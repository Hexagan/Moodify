import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { Youtube, BoxArrowUpRight, X, SkipBackwardFill, SkipForwardFill, MusicNoteList } from "react-bootstrap-icons";

import { usePlayer } from "../../context/PlayerContext";
import { subscribeSnippet, isAnySnippetActive, stopSnippet } from "../../utils/snippetPlayer";

import "./YouTubeDock.css";

const YT_API_URL = "https://www.youtube.com/iframe_api";
const YT_API_TIMEOUT_MS = 10000;
// When a playlist song's video can't be embedded, leave the message up briefly, then move on.
const SKIP_AFTER_ERROR_MS = 2500;

const ERROR_MESSAGES = {
    api: "No se pudo cargar el reproductor de YouTube.",
    // 101 / 150: the uploader disabled embedding; 100: removed or private.
    101: "El dueño de este video no permite reproducirlo fuera de YouTube.",
    150: "El dueño de este video no permite reproducirlo fuera de YouTube.",
    100: "Este video ya no está disponible en YouTube.",
};

let apiPromise = null;

function loadYouTubeApi() {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (apiPromise) return apiPromise;
    apiPromise = new Promise((resolve, reject) => {
        const previous = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            previous?.();
            resolve(window.YT);
        };
        const script = document.createElement("script");
        script.src = YT_API_URL;
        script.async = true;
        script.onerror = () => reject(new Error("youtube iframe api failed to load"));
        document.head.appendChild(script);
        setTimeout(() => reject(new Error("youtube iframe api timed out")), YT_API_TIMEOUT_MS);
    });
    apiPromise.catch(() => { apiPromise = null; });
    return apiPromise;
}

// Rendered once at the app root. The player is kept visible at 16:9 and at least 200px tall,
// as YouTube's embed terms require, and it hands the speakers over whenever a 10 s snippet starts.
function YouTubeDock() {

    const { track, queue, queueStatus, closePlayer, playNext, playPrevious } = usePlayer();
    const hostRef = useRef(null);
    const nextRef = useRef(playNext); // the YT event handlers are created once; read the latest from here
    const playerRef = useRef(null); // set once the YT player reports ready
    const creatingRef = useRef(false);
    const wantedRef = useRef(null); // the video that should be loaded, read by onReady
    const [failure, setFailure] = useState({ videoId: null, code: null });
    const snippetActive = useSyncExternalStore(subscribeSnippet, isAnySnippetActive);

    const videoId = track?.videoId ?? null;
    const playId = track?.playId ?? null;
    const open = Boolean(track);

    useEffect(() => {
        nextRef.current = playNext;
    }, [playNext]);
    const error = failure.videoId && failure.videoId === videoId ? ERROR_MESSAGES[failure.code] ?? ERROR_MESSAGES.api : null;

    useEffect(() => {
        wantedRef.current = videoId;

        if (!videoId) {
            // Closing must stop the audio, and a hidden player would break the embed terms anyway.
            playerRef.current?.destroy();
            playerRef.current = null;
            return;
        }
        if (playerRef.current) {
            // Also reached when the same video is played again (playId changed), which restarts it.
            playerRef.current.loadVideoById(videoId);
            return;
        }
        if (creatingRef.current) return; // onReady loads whatever is wanted by then

        creatingRef.current = true;
        loadYouTubeApi()
            .then((YT) => {
                // The YT API swaps this element for its iframe, so it must not be a node React owns.
                const target = document.createElement("div");
                hostRef.current.appendChild(target);
                new YT.Player(target, {
                    // Privacy-enhanced mode: YouTube sets no tracking cookies until the user
                    // interacts with the video itself.
                    host: "https://www.youtube-nocookie.com",
                    width: "100%",
                    height: "100%",
                    videoId: wantedRef.current,
                    playerVars: { autoplay: 1, playsinline: 1, rel: 0 },
                    events: {
                        onReady: (e) => {
                            creatingRef.current = false;
                            if (!wantedRef.current) {
                                e.target.destroy();
                                return;
                            }
                            playerRef.current = e.target;
                            if (e.target.getVideoData?.().video_id !== wantedRef.current) {
                                e.target.loadVideoById(wantedRef.current);
                            } else {
                                e.target.playVideo();
                            }
                        },
                        onStateChange: (e) => {
                            if (e.data === YT.PlayerState.PLAYING) stopSnippet();
                            // Playing a playlist: continue with the next song (a no-op for single songs).
                            if (e.data === YT.PlayerState.ENDED) nextRef.current?.();
                        },
                        onError: (e) => {
                            const failed = wantedRef.current;
                            setFailure({ videoId: failed, code: e.data });
                            setTimeout(() => {
                                if (wantedRef.current === failed) nextRef.current?.();
                            }, SKIP_AFTER_ERROR_MS);
                        },
                    },
                });
            })
            .catch(() => {
                creatingRef.current = false;
                setFailure({ videoId: wantedRef.current, code: "api" });
            });
    }, [videoId, playId]);

    useEffect(() => {
        if (snippetActive) playerRef.current?.pauseVideo();
    }, [snippetActive]);

    useEffect(() => () => {
        playerRef.current?.destroy();
        playerRef.current = null;
    }, []);

    // Room at the bottom of the page so the dock never permanently hides the last rows.
    useEffect(() => {
        document.documentElement.classList.toggle("has-player-dock", open);
    }, [open]);

    return (

        <aside className={`yt-dock ${open ? "open" : ""}`} aria-label="Reproductor de YouTube Music" aria-hidden={!open}>

            <div className="yt-dock-head">
                <span className="yt-dock-title">
                    <Youtube aria-hidden="true" /> YouTube Music
                </span>
                {track && (
                    <a
                        className="yt-dock-btn"
                        href={track.musicUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Abrir en YouTube Music"
                        title="Abrir en YouTube Music"
                    >
                        <BoxArrowUpRight />
                    </a>
                )}
                <button type="button" className="yt-dock-btn" onClick={closePlayer} aria-label="Cerrar reproductor" title="Cerrar">
                    <X />
                </button>
            </div>

            {track && (
                <Link to={`/cancion/${track.songId}`} className="yt-dock-song">
                    <strong>{track.title}</strong>
                    <span>{track.artist}</span>
                </Link>
            )}

            {queue && (
                <div className="yt-dock-queue">
                    <Link to={`/playlist/${queue.id}`} className="yt-dock-queue-name" title={queue.name}>
                        <MusicNoteList aria-hidden="true" />
                        <span>{queue.name}</span>
                    </Link>
                    <span className="yt-dock-queue-pos">
                        {queueStatus?.state === "loading" ? "Buscando…" : `${queue.index + 1} / ${queue.items.length}`}
                    </span>
                    <button
                        type="button"
                        className="yt-dock-btn"
                        onClick={playPrevious}
                        disabled={queue.index === 0}
                        aria-label="Canción anterior"
                        title="Anterior"
                    >
                        <SkipBackwardFill />
                    </button>
                    <button
                        type="button"
                        className="yt-dock-btn"
                        onClick={playNext}
                        disabled={queue.index >= queue.items.length - 1}
                        aria-label="Canción siguiente"
                        title="Siguiente"
                    >
                        <SkipForwardFill />
                    </button>
                </div>
            )}

            {error && (
                <p className="yt-dock-hint" role="status">
                    {error} <a href={track?.musicUrl} target="_blank" rel="noreferrer">Escuchala en YouTube Music</a>.
                </p>
            )}

            <div ref={hostRef} className={`yt-dock-player ${error ? "failed" : ""}`} />

        </aside>

    );

}

export default YouTubeDock;
