import { useEffect, useRef, useSyncExternalStore } from "react";
import { Spotify, X } from "react-bootstrap-icons";

import { useTheme } from "../../context/ThemeContext";
import {
    subscribeSnippet,
    getSpotifyDockState,
    registerSpotifyHost,
    unregisterSpotifyHost,
    stopSnippet
} from "../../utils/snippetPlayer";

import "./SpotifySnippetDock.css";

function SpotifySnippetDock() {

    const hostRef = useRef(null);
    const { theme } = useTheme();
    const state = useSyncExternalStore(subscribeSnippet, getSpotifyDockState);
    const open = state !== "hidden";

    useEffect(() => {
        registerSpotifyHost(hostRef.current, theme);
        return () => unregisterSpotifyHost();
    }, [theme]);

    return (
        <aside className={`spotify-dock ${open ? "open" : ""}`} aria-label="Vista previa de Spotify" aria-hidden={!open}>

            <div className="spotify-dock-head">
                <span className="spotify-dock-title">
                    <Spotify /> Vista previa de 10 s
                </span>
                <button type="button" className="spotify-dock-close" onClick={stopSnippet} aria-label="Cerrar vista previa">
                    <X />
                </button>
            </div>

            {state === "awaiting" && (
                <p className="spotify-dock-hint" role="status">
                    Tu navegador no deja que la página inicie el audio de Spotify. Tocá ▶ en el reproductor y sonarán 10 segundos desde la mitad.
                </p>
            )}

            <div ref={hostRef} className="spotify-dock-player" />

        </aside>
    );

}

export default SpotifySnippetDock;
