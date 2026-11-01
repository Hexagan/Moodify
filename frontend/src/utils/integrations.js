// Connections to the listener's own Spotify and YouTube accounts, entirely in the browser:
// Spotify through Authorization Code + PKCE (no client secret needed), YouTube through Google
// Identity Services' token client. Tokens stay in this browser's localStorage and never reach
// the Moodify backend. Each needs a client ID in the frontend env (see .env.example).

import { getSongYouTube } from "../services/api";
import { isSpotifyId } from "./spotify";

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const SPOTIFY_SCOPES = "user-read-private playlist-modify-private playlist-modify-public";
const YOUTUBE_SCOPE = "https://www.googleapis.com/auth/youtube";
const GSI_URL = "https://accounts.google.com/gsi/client";

const STORE_KEYS = { spotify: "moodifySpotifyAuth", youtube: "moodifyYouTubeAuth" };
const PKCE_KEY = "moodifySpotifyPkce";
// Each YouTube playlist insert costs 50 units of the Google project's daily quota (10,000).
export const YOUTUBE_EXPORT_LIMIT = 50;

export const integrationsConfigured = {
    spotify: Boolean(SPOTIFY_CLIENT_ID),
    youtube: Boolean(GOOGLE_CLIENT_ID),
};

export function spotifyRedirectUri() {
    return import.meta.env.VITE_SPOTIFY_REDIRECT_URI || `${window.location.origin}/configuracion`;
}

// ---------- tiny store so the settings page and playlist page share one connection state ----------

const listeners = new Set();
const snapshots = {};

function read(service) {
    try {
        return JSON.parse(localStorage.getItem(STORE_KEYS[service])) || null;
    } catch {
        return null;
    }
}

function write(service, value) {
    try {
        if (value) localStorage.setItem(STORE_KEYS[service], JSON.stringify(value));
        else localStorage.removeItem(STORE_KEYS[service]);
    } catch { /* connection just won't persist */ }
    delete snapshots[service];
    listeners.forEach((l) => l());
}

export function subscribeIntegrations(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

// Stable object per change, as useSyncExternalStore requires.
export function getConnection(service) {
    if (!(service in snapshots)) {
        const auth = read(service);
        snapshots[service] = auth ? { account: auth.account ?? null, expiresAt: auth.expiresAt } : null;
    }
    return snapshots[service];
}

export function disconnect(service) {
    write(service, null);
}

// ---------- Spotify (PKCE) ----------

function base64url(bytes) {
    return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomString(length = 64) {
    return base64url(crypto.getRandomValues(new Uint8Array(length))).slice(0, length);
}

export async function connectSpotify() {
    const verifier = randomString(64);
    const state = randomString(16);
    const challenge = base64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
    sessionStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state }));
    const params = new URLSearchParams({
        response_type: "code",
        client_id: SPOTIFY_CLIENT_ID,
        scope: SPOTIFY_SCOPES,
        redirect_uri: spotifyRedirectUri(),
        code_challenge_method: "S256",
        code_challenge: challenge,
        state,
    });
    window.location.assign(`https://accounts.spotify.com/authorize?${params}`);
}

async function spotifyTokenRequest(body) {
    const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ client_id: SPOTIFY_CLIENT_ID, ...body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error_description || "Spotify rechazó la conexión.");
    return data;
}

function storeSpotifyTokens(data, previous) {
    const auth = {
        accessToken: data.access_token,
        // Spotify may rotate the refresh token; when it doesn't send one, the old one stays valid.
        refreshToken: data.refresh_token || previous?.refreshToken,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000,
        account: previous?.account ?? null,
    };
    write("spotify", auth);
    return auth;
}

// Call on the redirect page (/configuracion). Returns true when it completed a connection.
export async function completeSpotifyRedirect() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const returnedState = params.get("state");
    const failure = params.get("error");
    if (!code && !failure) return false;
    window.history.replaceState(null, "", window.location.pathname);
    const pending = JSON.parse(sessionStorage.getItem(PKCE_KEY) || "null");
    sessionStorage.removeItem(PKCE_KEY);
    if (failure) throw new Error(failure === "access_denied" ? "Cancelaste la conexión con Spotify." : `Spotify: ${failure}`);
    if (!pending || pending.state !== returnedState) throw new Error("La respuesta de Spotify no coincide con esta sesión. Probá de nuevo.");
    const data = await spotifyTokenRequest({
        grant_type: "authorization_code",
        code,
        redirect_uri: spotifyRedirectUri(),
        code_verifier: pending.verifier,
    });
    storeSpotifyTokens(data, null);
    const me = await spotifyApi("/me");
    write("spotify", { ...read("spotify"), account: { name: me.display_name || me.id, id: me.id, image: me.images?.[0]?.url ?? null, product: me.product } });
    return true;
}

async function spotifyAccessToken() {
    let auth = read("spotify");
    if (!auth) throw new Error("Conectá tu cuenta de Spotify en Configuración.");
    if (Date.now() >= auth.expiresAt) {
        try {
            auth = storeSpotifyTokens(await spotifyTokenRequest({ grant_type: "refresh_token", refresh_token: auth.refreshToken }), auth);
        } catch {
            write("spotify", null);
            throw new Error("La conexión con Spotify venció. Volvé a conectarla en Configuración.");
        }
    }
    return auth.accessToken;
}

async function spotifyApi(path, options = {}) {
    const res = await fetch(`https://api.spotify.com/v1${path}`, {
        ...options,
        headers: { Authorization: `Bearer ${await spotifyAccessToken()}`, "Content-Type": "application/json", ...options.headers },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        if (res.status === 403) throw new Error("Spotify no autorizó la acción. Si la app está en modo desarrollo, tu cuenta tiene que estar en su lista de usuarios.");
        throw new Error(data.error?.message || `Spotify respondió ${res.status}`);
    }
    return data;
}

// Songs whose track_id isn't a Spotify ID (manual ABM entries) are skipped and counted.
export async function exportToSpotify(playlist) {
    const account = getConnection("spotify")?.account;
    if (!account) throw new Error("Conectá tu cuenta de Spotify en Configuración.");
    const uris = playlist.songs.filter((s) => isSpotifyId(s.track_id)).map((s) => `spotify:track:${s.track_id}`);
    const created = await spotifyApi(`/users/${encodeURIComponent(account.id)}/playlists`, {
        method: "POST",
        body: JSON.stringify({
            name: playlist.name,
            description: playlist.description || "Exportada desde Moodify",
            public: playlist.visibility === "public",
        }),
    });
    for (let i = 0; i < uris.length; i += 100) {
        await spotifyApi(`/playlists/${created.id}/tracks`, { method: "POST", body: JSON.stringify({ uris: uris.slice(i, i + 100) }) });
    }
    return { url: created.external_urls?.spotify, added: uris.length, skipped: playlist.songs.length - uris.length };
}

// ---------- YouTube (Google Identity Services) ----------

let gsiPromise = null;

function loadGsi() {
    if (window.google?.accounts?.oauth2) return Promise.resolve(window.google);
    if (gsiPromise) return gsiPromise;
    gsiPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = GSI_URL;
        script.async = true;
        script.onload = () => resolve(window.google);
        script.onerror = () => reject(new Error("No se pudo cargar el inicio de sesión de Google."));
        document.head.appendChild(script);
    });
    gsiPromise.catch(() => { gsiPromise = null; });
    return gsiPromise;
}

function requestGoogleToken(prompt) {
    return loadGsi().then((google) => new Promise((resolve, reject) => {
        const client = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: YOUTUBE_SCOPE,
            callback: (res) => (res.error ? reject(new Error(res.error_description || res.error)) : resolve(res)),
            error_callback: (err) => reject(new Error(err?.type === "popup_closed" ? "Cerraste la ventana de Google." : "Google rechazó la conexión.")),
        });
        client.requestAccessToken({ prompt });
    }));
}

async function youtubeApi(path, token, options = {}) {
    const res = await fetch(`https://www.googleapis.com/youtube/v3${path}`, {
        ...options,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...options.headers },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error?.message || `YouTube respondió ${res.status}`);
    return data;
}

// Must run from a click: Google opens a popup.
export async function connectYouTube() {
    const res = await requestGoogleToken("consent");
    const channels = await youtubeApi("/channels?part=snippet&mine=true", res.access_token);
    const channel = channels.items?.[0];
    write("youtube", {
        accessToken: res.access_token,
        expiresAt: Date.now() + (Number(res.expires_in) - 60) * 1000,
        account: channel
            ? { name: channel.snippet.title, id: channel.id, image: channel.snippet.thumbnails?.default?.url ?? null }
            : { name: "Cuenta de Google sin canal", id: null, image: null },
    });
}

// Browser tokens last an hour and can't be refreshed silently in the background; asking again
// from a click usually returns at once without showing anything.
async function youtubeAccessToken() {
    const auth = read("youtube");
    if (!auth) throw new Error("Conectá tu cuenta de YouTube en Configuración.");
    if (Date.now() < auth.expiresAt) return auth.accessToken;
    const res = await requestGoogleToken("");
    write("youtube", { ...auth, accessToken: res.access_token, expiresAt: Date.now() + (Number(res.expires_in) - 60) * 1000 });
    return res.access_token;
}

export async function exportToYouTube(playlist, onProgress = () => {}) {
    const auth = read("youtube");
    if (!auth?.account?.id) throw new Error("Tu cuenta de Google necesita un canal de YouTube para crear playlists.");
    const token = await youtubeAccessToken();
    const songs = playlist.songs.slice(0, YOUTUBE_EXPORT_LIMIT);
    const created = await youtubeApi("/playlists?part=snippet,status", token, {
        method: "POST",
        body: JSON.stringify({
            snippet: { title: playlist.name, description: playlist.description || "Exportada desde Moodify" },
            status: { privacyStatus: playlist.visibility === "public" ? "public" : "private" },
        }),
    });
    let added = 0;
    for (const [i, song] of songs.entries()) {
        onProgress(i + 1, songs.length);
        const yt = await getSongYouTube(song.track_id).catch(() => null);
        if (!yt?.video_id) continue;
        await youtubeApi("/playlistItems?part=snippet", token, {
            method: "POST",
            body: JSON.stringify({ snippet: { playlistId: created.id, resourceId: { kind: "youtube#video", videoId: yt.video_id } } }),
        });
        added += 1;
    }
    return {
        url: `https://music.youtube.com/playlist?list=${created.id}`,
        added,
        skipped: playlist.songs.length - added,
    };
}
