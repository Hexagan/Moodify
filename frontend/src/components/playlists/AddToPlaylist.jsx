import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CollectionPlay, PlusLg, CheckLg } from "react-bootstrap-icons";

import PlaylistForm from "./PlaylistForm";
import VisibilityBadge from "./VisibilityBadge";
import { useSettings } from "../../context/SettingsContext";
import { getUserPlaylists, createPlaylist, addSongToPlaylist, removeSongFromPlaylist } from "../../services/api";
import "./Playlists.css";

const EDGE_GAP = 12;

// "Agregar a playlist" on the song page: tick/untick the user's playlists, or create one
// on the spot (the song goes straight into it).
function AddToPlaylist({ uid, songId }) {

    const { settings } = useSettings();
    const [open, setOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [lists, setLists] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState(null);
    const rootRef = useRef(null);
    const panelRef = useRef(null);

    // The panel opens aligned with the button's left edge; when the button sits near the right
    // edge of the window, slide the panel left so it never causes horizontal scrolling.
    useLayoutEffect(() => {
        const panel = panelRef.current;
        if (!open || !panel) return;
        function fit() {
            panel.style.transform = "";
            const rect = panel.getBoundingClientRect();
            const viewport = document.documentElement.clientWidth;
            const overflow = rect.right - (viewport - EDGE_GAP);
            const shift = overflow > 0 ? Math.min(overflow, rect.left - EDGE_GAP) : 0;
            if (shift > 0) panel.style.transform = `translateX(${-shift}px)`;
        }
        fit();
        window.addEventListener("resize", fit);
        return () => window.removeEventListener("resize", fit);
    }, [open, creating, lists]);

    useEffect(() => {
        if (!open) return;
        function onPointer(e) {
            if (!rootRef.current?.contains(e.target)) setOpen(false);
        }
        function onKey(e) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("pointerdown", onPointer);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onPointer);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    async function load() {
        try {
            setLists(await getUserPlaylists(uid, uid, songId));
        } catch (err) {
            setError(err.message);
        }
    }

    function toggleOpen() {
        const next = !open;
        setOpen(next);
        setCreating(false);
        setError(null);
        if (next) load();
    }

    async function toggle(playlist) {
        setBusyId(playlist.id);
        setError(null);
        try {
            if (playlist.contains_song) await removeSongFromPlaylist(playlist.id, uid, songId);
            else await addSongToPlaylist(playlist.id, uid, songId);
            setLists((prev) => prev.map((p) => p.id === playlist.id
                ? { ...p, contains_song: !p.contains_song, song_count: p.song_count + (p.contains_song ? -1 : 1) }
                : p));
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId(null);
        }
    }

    async function handleCreate(data) {
        const created = await createPlaylist({ ...data, owner_uid: uid });
        await addSongToPlaylist(created.id, uid, songId);
        setCreating(false);
        await load();
    }

    const inCount = lists?.filter((p) => p.contains_song).length ?? 0;

    return (

        <div className="add-to-playlist" ref={rootRef}>

            <button
                type="button"
                className={`add-to-playlist-btn ${inCount ? "active" : ""}`}
                onClick={toggleOpen}
                aria-expanded={open}
                aria-haspopup="dialog"
            >
                <CollectionPlay aria-hidden="true" />
                {inCount ? `En ${inCount} ${inCount === 1 ? "playlist" : "playlists"}` : "Agregar a playlist"}
            </button>

            {open && (
                <div className="add-to-playlist-panel" ref={panelRef} role="dialog" aria-label="Agregar a una playlist">

                    {creating ? (
                        <PlaylistForm
                            compact
                            initial={{ visibility: settings.preferences.defaultPlaylistVisibility }}
                            submitLabel="Crear y agregar"
                            onSubmit={handleCreate}
                            onCancel={() => setCreating(false)}
                        />
                    ) : (
                        <>
                            <h4>Tus playlists</h4>
                            {lists === null && !error && <p className="add-to-playlist-empty">Cargando…</p>}
                            {lists?.length === 0 && <p className="add-to-playlist-empty">Todavía no tenés playlists.</p>}
                            {lists?.length > 0 && (
                                <ul className="add-to-playlist-list">
                                    {lists.map((p) => (
                                        <li key={p.id}>
                                            <button
                                                type="button"
                                                role="checkbox"
                                                aria-checked={Boolean(p.contains_song)}
                                                disabled={busyId === p.id}
                                                onClick={() => toggle(p)}
                                            >
                                                <span className="add-to-playlist-check" aria-hidden="true">
                                                    {p.contains_song && <CheckLg />}
                                                </span>
                                                <span className="add-to-playlist-name">{p.name}</span>
                                                <VisibilityBadge visibility={p.visibility} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {error && <p className="playlist-form-error" role="alert">{error}</p>}
                            <div className="add-to-playlist-foot">
                                <button type="button" className="pl-btn primary" onClick={() => setCreating(true)}>
                                    <PlusLg aria-hidden="true" /> Nueva playlist
                                </button>
                                <Link to={`/perfil/${uid}`} className="add-to-playlist-link">Ver mis playlists</Link>
                            </div>
                        </>
                    )}

                </div>
            )}

        </div>

    );

}

export default AddToPlaylist;
