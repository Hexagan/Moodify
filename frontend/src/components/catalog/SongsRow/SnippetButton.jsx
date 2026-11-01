import { useEffect, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { PlayFill, StopFill, VolumeMuteFill, BoxArrowUpRight } from "react-bootstrap-icons";

import { isSpotifyId } from "../../../utils/spotify";
import { useAuth } from "../../../context/AuthContext";
import { recordListen } from "../../../services/api";

import {
    SNIPPET_SECONDS,
    subscribeSnippet,
    getSnippetStatus,
    toggleSnippet,
    stopSnippet,
    isSnippetActive
} from "../../../utils/snippetPlayer";

import "./SnippetButton.css";

const LABELS = {
    idle: "Escuchar 10 segundos",
    loading: "Cargando vista previa",
    playing: "Detener vista previa",
    stalled: "Cargando vista previa",
    awaiting: "Tocá play en el reproductor de Spotify (o acá para cancelar)",
    unavailable: "Sin vista previa disponible"
};

function SnippetButton({ trackId, songId, title }) {

    const status = useSyncExternalStore(subscribeSnippet, () => getSnippetStatus(trackId));
    const { user } = useAuth();

    function handleClick() {
        const starting = status === "idle";
        toggleSnippet(trackId);
        if (starting && user && songId) recordListen(user.uid, songId, "preview").catch(() => {});
    }

    useEffect(() => () => {
        if (isSnippetActive(trackId)) stopSnippet();
    }, [trackId]);

    // Only reached when Spotify's player itself couldn't load (e.g. blocked by an extension) -
    // the song page's embed may still work, so send people there instead of a dead button.
    if (status === "unavailable" && isSpotifyId(trackId)) {
        return (
            <Link
                to={`/cancion/${songId}`}
                className="snippet-btn fallback"
                title="Sin vista previa de 10 s. Abrí la canción para escucharla en Spotify"
                aria-label={`Escuchar ${title} en su página`}
            >
                <BoxArrowUpRight />
            </Link>
        );
    }

    const started = status === "playing" || status === "stalled";
    const busy = status === "loading" || status === "stalled";

    let icon = <PlayFill />;
    if (busy) icon = <span className="snippet-spinner" aria-hidden="true" />;
    else if (status === "playing" || status === "awaiting") icon = <StopFill />;
    else if (status === "unavailable") icon = <VolumeMuteFill />;

    return (
        <button
            type="button"
            className={`snippet-btn ${status}`}
            onClick={handleClick}
            disabled={!trackId || status === "unavailable"}
            aria-label={`${LABELS[status]}: ${title}`}
            title={LABELS[status]}
        >
            {started && (
                <svg className="snippet-ring" viewBox="0 0 74 40" aria-hidden="true">
                    <rect className="snippet-ring-track" x="1" y="1" width="72" height="38" rx="19" pathLength="100" />
                    <rect
                        className="snippet-ring-progress"
                        x="1"
                        y="1"
                        width="72"
                        height="38"
                        rx="19"
                        pathLength="100"
                        style={{
                            animationDuration: `${SNIPPET_SECONDS}s`,
                            animationPlayState: status === "stalled" ? "paused" : "running"
                        }}
                    />
                </svg>
            )}
            {icon}
            {status !== "unavailable" && <span className="snippet-label">{SNIPPET_SECONDS}s</span>}
        </button>
    );

}

export default SnippetButton;
