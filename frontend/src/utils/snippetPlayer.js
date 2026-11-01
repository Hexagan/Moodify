import { getSongPreview } from "../services/api";
import { isSpotifyId } from "./spotify";

export const SNIPPET_SECONDS = 10;
const FADE_SECONDS = 0.5;
// 10 ms of real silence, played synchronously inside the first click so Safari treats the
// element as user-unlocked before the preview URL finishes resolving over the network.
// It must contain samples: Firefox refuses to decode a WAV with an empty data chunk.
const SILENT_WAV = "data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==";

const SPOTIFY_API_URL = "https://open.spotify.com/embed/iframe-api/v1";
const SPOTIFY_API_TIMEOUT_MS = 10000;
// Firefox and Safari don't pass the page's click on to the cross-origin Spotify iframe, so
// its own audio element can be autoplay-blocked. If nothing plays this long after the embed
// is ready, ask the person to press play inside the visible player instead.
const SPOTIFY_AUTOPLAY_GRACE_MS = 4000;
const SPOTIFY_LOAD_TIMEOUT_MS = 12000;
// Seeking can briefly report a paused state; don't mistake that for the person pausing.
const SPOTIFY_SEEK_SETTLE_MS = 1500;

const audio = typeof Audio === "undefined" ? null : new Audio();
const listeners = new Set();
const urlCache = new Map();
const unavailable = new Set();

let activeId = null;
let engine = null; // "audio" | "spotify" while a snippet is active
let phase = "idle"; // idle | resolving | buffering | playing | stalled | awaiting
let startAt = 0;
let frame = null;
let session = 0;
let unlocked = false;
let maxVolume = 1; // the listener's preference (Configuración), 0-1

let spotifyHost = null;
let spotifyTheme = "dark";
let spotifyApiPromise = null;
let controllerPromise = null;
let spotifyController = null;
let spotifyStart = 0;
let spotifySeekedAt = 0;
let spotifyTimers = [];

function emit() {
    listeners.forEach((listener) => listener());
}

function setPhase(next) {
    phase = next;
    emit();
}

function clearSpotifyTimers() {
    spotifyTimers.forEach(clearTimeout);
    spotifyTimers = [];
}

function tick() {
    const elapsed = audio.currentTime - startAt;
    if (elapsed >= SNIPPET_SECONDS) {
        stopSnippet();
        return;
    }
    const fade = Math.min(1, elapsed / FADE_SECONDS, (SNIPPET_SECONDS - elapsed) / FADE_SECONDS);
    audio.volume = Math.max(0, Math.min(1, fade)) * maxVolume;
    frame = requestAnimationFrame(tick);
}

async function resolveUrl(trackId) {
    if (urlCache.has(trackId)) return urlCache.get(trackId);
    const url = await getSongPreview(trackId);
    urlCache.set(trackId, url);
    return url;
}

export function stopSnippet() {
    session += 1;
    cancelAnimationFrame(frame);
    clearSpotifyTimers();
    if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
    }
    if (engine === "spotify") spotifyController?.pause();
    engine = null;
    activeId = null;
    setPhase("idle");
}

export async function toggleSnippet(trackId) {
    if (!audio || !trackId || unavailable.has(trackId)) return;
    if (activeId === trackId) {
        stopSnippet();
        return;
    }

    stopSnippet();
    const mySession = session;
    activeId = trackId;
    if (!unlocked) {
        audio.src = SILENT_WAV;
        audio.play().then(() => { unlocked = true; }).catch(() => {});
    }
    setPhase("resolving");

    let url = null;
    let lookupFailed = false;
    try {
        url = await resolveUrl(trackId);
    } catch {
        lookupFailed = true;
    }
    if (mySession !== session) return;

    if (url) {
        playViaAudio(url, mySession);
    } else if (isSpotifyId(trackId) && spotifyHost) {
        playViaSpotify(trackId, mySession);
    } else {
        if (!lookupFailed) unavailable.add(trackId);
        stopSnippet();
    }
}

function playViaAudio(url, mySession) {
    engine = "audio";
    audio.volume = 0;
    audio.src = url;
    setPhase("buffering");
    audio.addEventListener("loadedmetadata", () => {
        if (mySession !== session) return;
        startAt = Number.isFinite(audio.duration) ? Math.max(0, (audio.duration - SNIPPET_SECONDS) / 2) : 0;
        audio.currentTime = startAt;
        audio.play().catch(() => {
            if (mySession === session) stopSnippet();
        });
    }, { once: true });
}

async function playViaSpotify(trackId, mySession) {
    engine = "spotify";
    setPhase("buffering");
    spotifyTimers.push(setTimeout(() => {
        if (mySession === session && phase === "buffering") setPhase("awaiting");
    }, SPOTIFY_LOAD_TIMEOUT_MS));

    let controller;
    try {
        controller = await getSpotifyController(`spotify:track:${trackId}`);
    } catch {
        if (mySession !== session) return;
        unavailable.add(trackId);
        stopSnippet();
        return;
    }
    if (mySession !== session) return;
    // Queued by the embed until it reports "ready" if the track is still loading.
    controller.play();
}

function loadSpotifyApi() {
    if (spotifyApiPromise) return spotifyApiPromise;
    spotifyApiPromise = new Promise((resolve, reject) => {
        window.onSpotifyIframeApiReady = resolve;
        const script = document.createElement("script");
        script.src = SPOTIFY_API_URL;
        script.async = true;
        script.onerror = () => reject(new Error("spotify iframe api failed to load"));
        document.head.appendChild(script);
        setTimeout(() => reject(new Error("spotify iframe api timed out")), SPOTIFY_API_TIMEOUT_MS);
    });
    spotifyApiPromise.catch(() => { spotifyApiPromise = null; });
    return spotifyApiPromise;
}

function getSpotifyController(uri) {
    if (spotifyController) {
        spotifyController.loadUri(uri);
        return Promise.resolve(spotifyController);
    }
    if (controllerPromise) {
        return controllerPromise.then((controller) => {
            controller.loadUri(uri);
            return controller;
        });
    }

    const host = spotifyHost;
    controllerPromise = loadSpotifyApi().then((api) => new Promise((resolve, reject) => {
        if (spotifyHost !== host) {
            reject(new Error("player host unmounted"));
            return;
        }
        // createController replaces this element with its iframe, so it must not be a
        // node React owns - the host itself stays React's.
        const target = document.createElement("div");
        host.appendChild(target);
        api.createController(target, { uri, width: "100%", height: 80, theme: spotifyTheme }, (controller) => {
            if (spotifyHost !== host) {
                controller.destroy();
                reject(new Error("player host unmounted"));
                return;
            }
            controller.addListener("ready", onSpotifyReady);
            controller.addListener("playback_update", onSpotifyUpdate);
            spotifyController = controller;
            resolve(controller);
        });
    }));
    controllerPromise.catch(() => { controllerPromise = null; });
    return controllerPromise;
}

function onSpotifyReady() {
    if (engine !== "spotify" || phase !== "buffering") return;
    const mySession = session;
    spotifyController.play();
    spotifyTimers.push(setTimeout(() => {
        if (mySession === session && phase === "buffering") setPhase("awaiting");
    }, SPOTIFY_AUTOPLAY_GRACE_MS));
}

function onSpotifyUpdate({ data }) {
    if (engine !== "spotify" || !data) return;
    const { isPaused, isBuffering, position, duration } = data;

    if (phase === "playing") {
        const settling = Date.now() - spotifySeekedAt < SPOTIFY_SEEK_SETTLE_MS;
        if (isPaused && !settling) {
            stopSnippet();
        } else if (position / 1000 - spotifyStart >= SNIPPET_SECONDS) {
            stopSnippet();
        }
        return;
    }

    if (isPaused || isBuffering || !duration) return;

    // First real playback tick - from our play(), or from the person pressing play in the
    // embed after an autoplay block. Duration is the full track for logged-in Spotify users
    // and the 30-second preview otherwise, so the window lands in the middle of either.
    clearSpotifyTimers();
    spotifyStart = Math.max(0, (duration / 1000 - SNIPPET_SECONDS) / 2);
    spotifySeekedAt = Date.now();
    spotifyController.seek(spotifyStart);
    setPhase("playing");
}

export function registerSpotifyHost(element, theme) {
    spotifyHost = element;
    spotifyTheme = theme;
}

export function unregisterSpotifyHost() {
    if (engine === "spotify") stopSnippet();
    spotifyController?.destroy();
    spotifyController = null;
    controllerPromise = null;
    spotifyHost = null;
}

// Only the audio engine can be turned down: the Spotify embed exposes no volume control.
export function setSnippetVolume(volume) {
    maxVolume = Math.min(1, Math.max(0, volume));
}

export function subscribeSnippet(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function getSnippetStatus(trackId) {
    if (trackId && trackId === activeId) {
        return phase === "resolving" || phase === "buffering" ? "loading" : phase;
    }
    return unavailable.has(trackId) ? "unavailable" : "idle";
}

export function getSpotifyDockState() {
    if (engine !== "spotify") return "hidden";
    return phase === "playing" || phase === "awaiting" ? phase : "loading";
}

// Lets other players (the YouTube dock) step aside while a snippet is sounding.
export function isAnySnippetActive() {
    return activeId !== null;
}

export function isSnippetActive(trackId) {
    return trackId != null && trackId === activeId;
}

if (audio) {
    audio.preload = "auto";
    audio.addEventListener("playing", () => {
        if (engine !== "audio" || (phase !== "buffering" && phase !== "stalled")) return;
        setPhase("playing");
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(tick);
    });
    audio.addEventListener("waiting", () => {
        if (engine !== "audio" || phase !== "playing") return;
        cancelAnimationFrame(frame);
        setPhase("stalled");
    });
    audio.addEventListener("ended", () => {
        if (engine === "audio" && (phase === "playing" || phase === "stalled")) stopSnippet();
    });
    audio.addEventListener("error", () => {
        if (engine !== "audio") return;
        // A cached Deezer URL may have hit its signed expiry - refetch it on the next click.
        urlCache.delete(activeId);
        stopSnippet();
    });
}
