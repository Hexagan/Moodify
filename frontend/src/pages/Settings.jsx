import { useEffect, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import {
    Palette2, UniversalAccess, Plug, Sliders2, ShieldLock, MoonStarsFill, SunFill, PlusLg,
    Pencil, Trash3, CheckLg, Spotify, Youtube, PersonGear, Download, ClockHistory, ArrowCounterclockwise,
    Envelope, ChatSquareHeart
} from "react-bootstrap-icons";

import Layout from "../components/layout/Layout";
import GuestPrompt from "../components/auth/GuestPrompt";
import ColorProfileEditor from "../components/settings/ColorProfileEditor";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { TEXT_SCALES } from "../utils/settings";
import {
    getListeningHistory, getLikedPlaylist, getUserPlaylists, getPlaylist, clearListeningHistory
} from "../services/api";
import {
    integrationsConfigured, subscribeIntegrations, getConnection, disconnect,
    connectSpotify, completeSpotifyRedirect, connectYouTube, spotifyRedirectUri
} from "../utils/integrations";
import { BASE_PALETTES } from "../utils/themePalettes";
import { VISIBILITY } from "../utils/playlists";
import "../components/playlists/Playlists.css";
import "./Settings.css";

const SECTIONS = [
    { id: "apariencia", label: "Apariencia", Icon: Palette2 },
    { id: "accesibilidad", label: "Accesibilidad", Icon: UniversalAccess },
    { id: "integraciones", label: "Integraciones", Icon: Plug },
    { id: "preferencias", label: "Preferencias", Icon: Sliders2 },
    { id: "datos", label: "Datos y cuenta", Icon: ShieldLock },
    { id: "contacto", label: "Contacto", Icon: Envelope },
];

const CATALOG_VIEW_KEY = "catalogViewMode"; // shared with the catalogue's own toggle

function readCatalogView() {
    try {
        return localStorage.getItem(CATALOG_VIEW_KEY) === "infinite" ? "infinite" : "paged";
    } catch {
        return "paged";
    }
}

function Switch({ checked, onChange, label, description }) {
    return (
        <div className="settings-switch-row">
            <span>
                <strong>{label}</strong>
                {description && <small>{description}</small>}
            </span>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={label}
                className={`settings-switch ${checked ? "on" : ""}`}
                onClick={() => onChange(!checked)}
            >
                <span />
            </button>
        </div>
    );
}

function Swatches({ colors }) {
    return (
        <span className="settings-swatches" aria-hidden="true">
            {["bg-page", "bg-card", "accent", "text-primary"].map((t) => (
                <span key={t} style={{ background: colors[t] }} />
            ))}
        </span>
    );
}

// ---------- Apariencia ----------

function AppearanceSection() {

    const { settings, setMode, selectProfile, saveProfile, deleteProfile } = useSettings();
    const [editing, setEditing] = useState(null); // slot index

    const modes = [
        { key: "dark", label: "Oscuro", Icon: MoonStarsFill },
        { key: "light", label: "Claro", Icon: SunFill },
    ];

    function handleSave(profile, use) {
        saveProfile(editing, profile);
        if (use) selectProfile(editing);
        setEditing(null);
    }

    function handleDelete(index) {
        if (!window.confirm(`¿Borrar el perfil "${settings.profiles[index].name}"?`)) return;
        deleteProfile(index);
    }

    return (
        <section id="apariencia" className="settings-card">
            <h2><Palette2 aria-hidden="true" /> Apariencia</h2>

            <h3>Modo</h3>
            <p className="settings-help">
                Claro y oscuro son independientes de los perfiles: elegir uno desactiva el perfil que estaba en uso,
                y para volver a él hay que seleccionarlo de nuevo. El interruptor de la barra superior hace lo mismo.
            </p>
            <div className="settings-modes" role="radiogroup" aria-label="Modo de color">
                {modes.map(({ key, label, Icon }) => (
                    <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={settings.mode === key}
                        className="settings-mode"
                        onClick={() => setMode(key)}
                    >
                        <Swatches colors={BASE_PALETTES[key]} />
                        <span><Icon aria-hidden="true" /> {label}</span>
                    </button>
                ))}
            </div>

            <h3>Perfiles de color</h3>
            <p className="settings-help">Hasta tres paletas propias, guardadas en tu cuenta: fondos, textos, acentos y colores de estado.</p>

            {editing !== null ? (
                <ColorProfileEditor
                    key={editing}
                    slot={editing}
                    profile={settings.profiles[editing]}
                    onSave={handleSave}
                    onCancel={() => setEditing(null)}
                />
            ) : (
                <div className="settings-profiles">
                    {settings.profiles.map((profile, i) => {
                        const active = settings.mode === "profile" && settings.activeProfile === i;
                        return profile ? (
                            <div key={i} className={`settings-profile ${active ? "active" : ""}`}>
                                <Swatches colors={profile.colors} />
                                <strong>{profile.name}</strong>
                                <span className="settings-profile-slot">Perfil {i + 1}{active ? " · en uso" : ""}</span>
                                <div className="settings-profile-actions">
                                    <button type="button" className="pl-btn primary" onClick={() => selectProfile(i)} disabled={active}>
                                        {active ? <><CheckLg aria-hidden="true" /> En uso</> : "Usar"}
                                    </button>
                                    <button type="button" className="pl-btn ghost" onClick={() => setEditing(i)} aria-label={`Editar ${profile.name}`}>
                                        <Pencil aria-hidden="true" />
                                    </button>
                                    <button type="button" className="pl-btn danger" onClick={() => handleDelete(i)} aria-label={`Borrar ${profile.name}`}>
                                        <Trash3 aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button key={i} type="button" className="settings-profile empty" onClick={() => setEditing(i)}>
                                <PlusLg aria-hidden="true" />
                                <strong>Crear perfil {i + 1}</strong>
                                <span className="settings-profile-slot">Espacio libre</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

// ---------- Accesibilidad ----------

function AccessibilitySection() {
    const { settings, updateAccessibility } = useSettings();
    const a11y = settings.accessibility;
    return (
        <section id="accesibilidad" className="settings-card">
            <h2><UniversalAccess aria-hidden="true" /> Accesibilidad</h2>

            <h3>Tamaño del contenido</h3>
            <div className="settings-segmented" role="radiogroup" aria-label="Tamaño del contenido">
                {TEXT_SCALES.map((scale) => (
                    <button
                        key={scale}
                        type="button"
                        role="radio"
                        aria-checked={a11y.textScale === scale}
                        onClick={() => updateAccessibility({ textScale: scale })}
                        style={{ fontSize: `${13 * scale}px` }}
                    >
                        {Math.round(scale * 100)}%
                    </button>
                ))}
            </div>
            <p className="settings-help">Agranda textos, botones y gráficos de cada página; el menú lateral queda igual.</p>

            <Switch
                label="Reducir animaciones"
                description="Quita transiciones y movimientos (las notas flotantes, los deslizamientos de los reproductores…)."
                checked={a11y.reduceMotion}
                onChange={(v) => updateAccessibility({ reduceMotion: v })}
            />
            <Switch
                label="Alto contraste"
                description="Lleva los textos secundarios al color de los párrafos y hace visibles los bordes. Funciona con cualquier modo o perfil."
                checked={a11y.highContrast}
                onChange={(v) => updateAccessibility({ highContrast: v })}
            />
            <Switch
                label="Resaltar el foco del teclado"
                description="Un contorno grueso alrededor del elemento seleccionado al navegar con Tab."
                checked={a11y.strongFocus}
                onChange={(v) => updateAccessibility({ strongFocus: v })}
            />
            <Switch
                label="Fuente de lectura fácil"
                description="Usa Atkinson Hyperlegible, diseñada para distinguir mejor letras parecidas."
                checked={a11y.readableFont}
                onChange={(v) => updateAccessibility({ readableFont: v })}
            />
        </section>
    );
}

// ---------- Integraciones ----------

function IntegrationCard({ service, label, Icon, connection, onConnect, uses, setupNote }) {
    const [state, setState] = useState({ busy: false, error: null });
    const configured = integrationsConfigured[service];

    async function handleConnect() {
        setState({ busy: true, error: null });
        try {
            await onConnect();
            setState({ busy: false, error: null });
        } catch (err) {
            setState({ busy: false, error: err.message });
        }
    }

    return (
        <div className={`settings-integration ${service}`}>
            <div className="settings-integration-head">
                <Icon aria-hidden="true" className="settings-integration-icon" />
                <div>
                    <strong>{label}</strong>
                    <span>{connection ? "Conectada" : configured ? "Sin conectar" : "No disponible en este servidor"}</span>
                </div>
            </div>

            {connection?.account && (
                <div className="settings-account">
                    {connection.account.image && <img src={connection.account.image} alt="" />}
                    <span>
                        <strong>{connection.account.name}</strong>
                        {connection.account.product && <small>Plan {connection.account.product}</small>}
                    </span>
                </div>
            )}

            <ul className="settings-integration-uses">
                {uses.map((u) => <li key={u}>{u}</li>)}
            </ul>

            {state.error && <p className="playlist-form-error" role="alert">{state.error}</p>}

            {configured ? (
                connection ? (
                    <button type="button" className="pl-btn ghost" onClick={() => disconnect(service)}>Desconectar</button>
                ) : (
                    <button type="button" className="pl-btn primary" onClick={handleConnect} disabled={state.busy}>
                        {state.busy ? "Conectando…" : `Conectar ${label}`}
                    </button>
                )
            ) : (
                <p className="settings-help">{setupNote}</p>
            )}
        </div>
    );
}

function IntegrationsSection() {
    const spotify = useSyncExternalStore(subscribeIntegrations, () => getConnection("spotify"));
    const youtube = useSyncExternalStore(subscribeIntegrations, () => getConnection("youtube"));
    const [redirect, setRedirect] = useState({ done: false, message: null });

    // Spotify sends the browser back here with ?code=…; finish the connection once.
    useEffect(() => {
        let cancelled = false;
        completeSpotifyRedirect()
            .then((connected) => { if (!cancelled && connected) setRedirect({ done: true, message: "Spotify quedó conectado." }); })
            .catch((err) => { if (!cancelled) setRedirect({ done: true, message: err.message }); });
        return () => { cancelled = true; };
    }, []);

    return (
        <section id="integraciones" className="settings-card">
            <h2><Plug aria-hidden="true" /> Integraciones</h2>
            <p className="settings-help">
                Las conexiones quedan guardadas solo en este navegador; Moodify no recibe ni guarda tus contraseñas ni tus permisos.
            </p>
            {redirect.message && <p className="settings-notice" role="status">{redirect.message}</p>}
            <div className="settings-integrations">
                <IntegrationCard
                    service="spotify"
                    label="Spotify"
                    Icon={Spotify}
                    connection={spotify}
                    onConnect={connectSpotify}
                    uses={[
                        "Exportar tus playlists de Moodify a tu cuenta de Spotify.",
                        "Para escuchar canciones completas en el reproductor de Spotify, además iniciá sesión en open.spotify.com en este navegador.",
                    ]}
                    setupNote={`Quien administra Moodify tiene que configurar VITE_SPOTIFY_CLIENT_ID y registrar ${spotifyRedirectUri()} como Redirect URI.`}
                />
                <IntegrationCard
                    service="youtube"
                    label="YouTube"
                    Icon={Youtube}
                    connection={youtube}
                    onConnect={connectYouTube}
                    uses={[
                        "Exportar tus playlists de Moodify a YouTube Music (hasta 50 canciones por vez).",
                        "Con tu sesión de YouTube Premium abierta en este navegador, el reproductor de Moodify suena sin anuncios.",
                    ]}
                    setupNote="Quien administra Moodify tiene que configurar VITE_GOOGLE_CLIENT_ID (un cliente OAuth de Google con la YouTube Data API habilitada)."
                />
            </div>
        </section>
    );
}

// ---------- Preferencias ----------

function PreferencesSection() {
    const { settings, updatePreferences } = useSettings();
    const prefs = settings.preferences;
    const [catalogView, setCatalogView] = useState(readCatalogView);

    function changeCatalogView(next) {
        setCatalogView(next);
        try { localStorage.setItem(CATALOG_VIEW_KEY, next); } catch { /* not persisted */ }
    }

    return (
        <section id="preferencias" className="settings-card">
            <h2><Sliders2 aria-hidden="true" /> Preferencias</h2>

            <label className="settings-field">
                <span>Visibilidad de las playlists nuevas</span>
                <select
                    value={prefs.defaultPlaylistVisibility}
                    onChange={(e) => updatePreferences({ defaultPlaylistVisibility: e.target.value })}
                >
                    {Object.entries(VISIBILITY).map(([key, { label, hint }]) => (
                        <option key={key} value={key}>{label} — {hint}</option>
                    ))}
                </select>
            </label>

            <label className="settings-field">
                <span>Volumen de las vistas previas de 10 s: {Math.round(prefs.snippetVolume * 100)}%</span>
                <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={prefs.snippetVolume}
                    onChange={(e) => updatePreferences({ snippetVolume: Number(e.target.value) })}
                />
                <small>Aplica a las vistas previas de Apple Music, Deezer y las subidas a mano; el reproductor de Spotify maneja su propio volumen.</small>
            </label>

            <div className="settings-field">
                <span>Forma de recorrer el catálogo</span>
                <div className="settings-segmented" role="radiogroup" aria-label="Forma de recorrer el catálogo">
                    {[["paged", "Páginas"], ["infinite", "Scroll infinito"]].map(([key, label]) => (
                        <button key={key} type="button" role="radio" aria-checked={catalogView === key} onClick={() => changeCatalogView(key)}>
                            {label}
                        </button>
                    ))}
                </div>
                <small>También se cambia desde el pie del catálogo.</small>
            </div>
        </section>
    );
}

// ---------- Datos y cuenta ----------

function DataSection({ user }) {
    const { settings, reset } = useSettings();
    const [status, setStatus] = useState(null);

    async function downloadData() {
        setStatus("Preparando tus datos…");
        try {
            const [history, liked, playlists] = await Promise.all([
                getListeningHistory(user.uid, 200),
                getLikedPlaylist(user.uid, 200),
                getUserPlaylists(user.uid, user.uid),
            ]);
            const fullPlaylists = await Promise.all(playlists.map((p) => getPlaylist(p.id, user.uid)));
            const data = {
                exported_at: new Date().toISOString(),
                account: { uid: user.uid, email: user.email },
                settings,
                history: history.items.map((s) => ({ song: s.track_name, artists: s.artists, plays: s.plays, last_played_at: s.last_played_at })),
                likes: liked.items.map((s) => ({ song: s.track_name, artists: s.artists, liked_at: s.liked_at })),
                playlists: fullPlaylists.map((p) => ({
                    name: p.name, description: p.description, visibility: p.visibility,
                    songs: p.songs.map((s) => ({ song: s.track_name, artists: s.artists, spotify_id: s.track_id })),
                })),
            };
            const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
            const link = document.createElement("a");
            link.href = url;
            link.download = `moodify-datos-${new Date().toISOString().slice(0, 10)}.json`;
            link.click();
            URL.revokeObjectURL(url);
            setStatus("Descarga lista.");
        } catch (err) {
            setStatus(`No se pudo exportar: ${err.message}`);
        }
    }

    async function handleClearHistory() {
        if (!window.confirm("¿Borrar todo tu historial de escucha? Tus recomendaciones dejarán de tenerlo en cuenta.")) return;
        try {
            await clearListeningHistory(user.uid);
            setStatus("Historial borrado.");
        } catch (err) {
            setStatus(err.message);
        }
    }

    function handleReset() {
        if (!window.confirm("¿Volver a la configuración original? Se borran los tres perfiles de color.")) return;
        reset();
        setStatus("Configuración restablecida.");
    }

    return (
        <section id="datos" className="settings-card">
            <h2><ShieldLock aria-hidden="true" /> Datos y cuenta</h2>
            <div className="settings-actions-list">
                <Link to={`/perfil/${user.uid}`} className="settings-action">
                    <PersonGear aria-hidden="true" />
                    <span><strong>Editar perfil</strong><small>Foto, biografía y qué datos son públicos.</small></span>
                </Link>
                <button type="button" className="settings-action" onClick={downloadData}>
                    <Download aria-hidden="true" />
                    <span><strong>Descargar mis datos</strong><small>Historial, me gusta, playlists y configuración en un archivo JSON.</small></span>
                </button>
                <button type="button" className="settings-action" onClick={handleClearHistory}>
                    <ClockHistory aria-hidden="true" />
                    <span><strong>Borrar historial de escucha</strong><small>No afecta tus me gusta ni tus playlists.</small></span>
                </button>
                <button type="button" className="settings-action danger" onClick={handleReset}>
                    <ArrowCounterclockwise aria-hidden="true" />
                    <span><strong>Restablecer configuración</strong><small>Modo oscuro, sin perfiles y accesibilidad por defecto.</small></span>
                </button>
            </div>
            {status && <p className="settings-notice" role="status">{status}</p>}
        </section>
    );
}

// ---------- Contacto ----------

function ContactSection() {
    return (
        <section id="contacto" className="settings-card">
            <h2><Envelope aria-hidden="true" /> Contacto</h2>
            <div className="settings-actions-list">
                <Link to="/contacto" className="settings-action">
                    <ChatSquareHeart aria-hidden="true" />
                    <span><strong>Enviar una sugerencia</strong><small>Contanos qué agregarías o qué te parece el sitio.</small></span>
                </Link>
            </div>
        </section>
    );
}

function Settings() {

    const { user } = useAuth();

    if (!user) {
        return (
            <Layout title="Configuración">
                <div className="settings-guest">
                    <GuestPrompt action="personalizar colores, accesibilidad y conectar Spotify o YouTube" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Configuración">
            <div className="settings-page">
                <nav className="settings-nav" aria-label="Secciones de configuración">
                    {SECTIONS.map(({ id, label, Icon }) => (
                        <a key={id} href={`#${id}`}><Icon aria-hidden="true" /> {label}</a>
                    ))}
                </nav>
                <div className="settings-sections">
                    <AppearanceSection />
                    <AccessibilitySection />
                    <IntegrationsSection />
                    <PreferencesSection />
                    <DataSection user={user} />
                    <ContactSection />
                </div>
            </div>
        </Layout>
    );

}

export default Settings;
