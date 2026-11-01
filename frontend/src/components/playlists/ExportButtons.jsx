import { useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { Spotify, Youtube } from "react-bootstrap-icons";

import {
    integrationsConfigured, subscribeIntegrations, getConnection,
    exportToSpotify, exportToYouTube, YOUTUBE_EXPORT_LIMIT
} from "../../utils/integrations";
import "./Playlists.css";

const SERVICES = [
    { key: "spotify", label: "Spotify", Icon: Spotify, run: exportToSpotify },
    { key: "youtube", label: "YouTube Music", Icon: Youtube, run: exportToYouTube },
];

// Copies the playlist into whichever of the viewer's own accounts are connected.
function ExportButtons({ playlist }) {

    const spotify = useSyncExternalStore(subscribeIntegrations, () => getConnection("spotify"));
    const youtube = useSyncExternalStore(subscribeIntegrations, () => getConnection("youtube"));
    const connected = { spotify, youtube };
    const [status, setStatus] = useState(null); // { key, kind: "busy"|"done"|"error", text, url }

    const available = SERVICES.filter((s) => integrationsConfigured[s.key]);
    if (available.length === 0 || playlist.songs.length === 0) return null;

    async function run(service) {
        setStatus({ key: service.key, kind: "busy", text: `Exportando a ${service.label}…` });
        try {
            const result = await service.run(playlist, (done, total) => {
                setStatus({ key: service.key, kind: "busy", text: `Buscando en YouTube ${done}/${total}…` });
            });
            const skipped = result.skipped ? ` ${result.skipped} no se encontraron en ${service.label}.` : "";
            setStatus({ key: service.key, kind: "done", text: `Listo: ${result.added} canciones en ${service.label}.${skipped}`, url: result.url });
        } catch (err) {
            setStatus({ key: service.key, kind: "error", text: err.message });
        }
    }

    return (

        <div className="export-buttons">
            {available.map((service) => {
                const { key, label, Icon } = service;
                return connected[key] ? (
                    <button
                        key={key}
                        type="button"
                        className={`pl-btn export-${key}`}
                        onClick={() => run(service)}
                        disabled={status?.kind === "busy"}
                        title={key === "youtube" && playlist.songs.length > YOUTUBE_EXPORT_LIMIT
                            ? `Se exportan las primeras ${YOUTUBE_EXPORT_LIMIT} canciones (límite de la cuota de YouTube)`
                            : undefined}
                    >
                        <Icon aria-hidden="true" /> Exportar a {label}
                    </button>
                ) : (
                    <Link key={key} to="/configuracion#integraciones" className={`pl-btn ghost export-${key}`}>
                        <Icon aria-hidden="true" /> Conectar {label}
                    </Link>
                );
            })}
            {status && (
                <p className={`export-status ${status.kind}`} role="status">
                    {status.text}{" "}
                    {status.url && <a href={status.url} target="_blank" rel="noreferrer">Abrir</a>}
                </p>
            )}
        </div>

    );

}

export default ExportButtons;
