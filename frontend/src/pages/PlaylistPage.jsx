import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Link45deg, Pencil, Trash3, PersonCircle, X, CheckLg, PlayFill, VolumeUpFill } from "react-bootstrap-icons";

import Layout from "../components/layout/Layout";
import PlaylistCover from "../components/playlists/PlaylistCover";
import PlaylistForm from "../components/playlists/PlaylistForm";
import VisibilityBadge from "../components/playlists/VisibilityBadge";
import ExportButtons from "../components/playlists/ExportButtons";
import SongCover from "../components/common/SongCover";
import StatusBadge from "../components/catalog/SongsRow/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { usePlayer } from "../context/PlayerContext";
import { getPlaylist, updatePlaylist, deletePlaylist, removeSongFromPlaylist } from "../services/api";
import { mapCancion } from "../utils/mapCancion";
import { playlistUrl } from "../utils/playlists";
import { timeAgo } from "../utils/timeAgo";
import "./PlaylistPage.css";

function totalDuration(songs) {
    const minutes = Math.round(songs.reduce((sum, s) => sum + (s.duration_ms || 0), 0) / 60000);
    return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;
}

function PlaylistPage() {

    const { id } = useParams();
    const { user } = useAuth();
    const { queue, queueStatus, playQueue } = usePlayer();
    const navigate = useNavigate();
    const viewer = user?.uid;
    const requestKey = `${id}|${viewer ?? ""}`;
    // Tagged with the request it answers, so switching playlists or signing in never shows stale data.
    const [result, setResult] = useState({ key: null, playlist: null, error: null });
    const [editing, setEditing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        // user is undefined while Firebase restores the session; wait so owners don't get a 404.
        if (user === undefined) return;
        let cancelled = false;
        getPlaylist(id, viewer)
            .then((p) => { if (!cancelled) setResult({ key: requestKey, playlist: p, error: null }); })
            .catch((err) => { if (!cancelled) setResult({ key: requestKey, playlist: null, error: err.message }); });
        return () => { cancelled = true; };
    }, [id, viewer, user, requestKey]);

    const current = result.key === requestKey ? result : { playlist: null, error: null };
    const playlist = current.playlist;

    if (current.error) {
        return (
            <Layout title="Playlist">
                <div className="pl-page-missing">
                    <h2>No encontramos esta playlist</h2>
                    <p>Puede que se haya borrado o que su creador la tenga como privada o solo para amigos.</p>
                    {!user && <p><Link to="/login">Iniciá sesión</Link> si te la compartió alguien de tus amigos.</p>}
                    <Link to="/" className="pl-btn primary">Ir al inicio</Link>
                </div>
            </Layout>
        );
    }

    if (!playlist) return <Layout title="Playlist"><div className="pl-page-missing">Cargando…</div></Layout>;

    const songs = playlist.songs.map((s) => ({ ...mapCancion(s), duration_ms: s.duration_ms, added_at: s.added_at }));
    const owner = playlist.owner;
    const playingHere = queue?.id === playlist.id;
    const status = queueStatus?.id === playlist.id ? queueStatus.state : null;

    // Plays in the YouTube dock from `index` on, continuing through the rest of the playlist.
    function play(index = 0) {
        playQueue({
            id: playlist.id,
            name: playlist.name,
            items: songs.map((s) => ({ songId: s.id, trackId: s.track_id, title: s.title, artist: s.artist })),
        }, index);
    }

    function setPlaylist(next) {
        setResult((r) => ({ ...r, playlist: next }));
    }

    async function handleEdit(data) {
        const updated = await updatePlaylist(playlist.id, { ...data, owner_uid: viewer });
        setPlaylist({ ...playlist, ...updated, songs: playlist.songs });
        setEditing(false);
    }

    async function handleDelete() {
        if (!window.confirm(`¿Eliminar la playlist "${playlist.name}"? Las canciones no se borran del catálogo.`)) return;
        setBusy(true);
        try {
            await deletePlaylist(playlist.id, viewer);
            navigate("/");
        } catch (err) {
            setBusy(false);
            window.alert(err.message);
        }
    }

    async function handleRemove(song) {
        await removeSongFromPlaylist(playlist.id, viewer, song.id);
        const remaining = playlist.songs.filter((s) => s.id !== song.id);
        setPlaylist({ ...playlist, songs: remaining, song_count: remaining.length });
    }

    async function copyLink() {
        try {
            await navigator.clipboard.writeText(playlistUrl(playlist.id));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            window.prompt("Copiá el enlace:", playlistUrl(playlist.id));
        }
    }

    return (

        <Layout title="Playlist">

            <div className="pl-page">

                <header className="pl-hero">

                    <PlaylistCover covers={playlist.covers} className="pl-hero-cover" />

                    <div className="pl-hero-info">

                        <span className="pl-eyebrow">Playlist <VisibilityBadge visibility={playlist.visibility} /></span>

                        {editing ? (
                            <PlaylistForm
                                initial={playlist}
                                submitLabel="Guardar cambios"
                                onSubmit={handleEdit}
                                onCancel={() => setEditing(false)}
                            />
                        ) : (
                            <>
                                <h1>{playlist.name}</h1>
                                {playlist.description && <p className="pl-description">{playlist.description}</p>}
                                <div className="pl-meta">
                                    <Link to={owner.uid ? `/perfil/${owner.uid}` : "#"} className="pl-owner">
                                        {owner.photo_url ? <img src={owner.photo_url} alt="" /> : <PersonCircle aria-hidden="true" />}
                                        <span>Armada por <strong>{owner.name}</strong></span>
                                    </Link>
                                    <span>{songs.length} {songs.length === 1 ? "canción" : "canciones"}</span>
                                    {songs.length > 0 && <span>{totalDuration(songs)}</span>}
                                </div>
                            </>
                        )}

                        {!editing && (
                            <div className="pl-actions">
                                {songs.length > 0 && (
                                    <button type="button" className="pl-btn primary" onClick={() => play(0)} disabled={status === "loading"}>
                                        <PlayFill aria-hidden="true" /> {status === "loading" ? "Buscando…" : "Reproducir"}
                                    </button>
                                )}
                                {playlist.visibility === "public" ? (
                                    <button type="button" className="pl-btn ghost" onClick={copyLink}>
                                        {copied ? <><CheckLg aria-hidden="true" /> Enlace copiado</> : <><Link45deg aria-hidden="true" /> Copiar enlace</>}
                                    </button>
                                ) : playlist.is_owner && (
                                    <span className="pl-share-hint">
                                        {playlist.visibility === "friends"
                                            ? "Solo tus amigos con sesión iniciada pueden abrirla."
                                            : "Hacela pública para compartirla con un enlace."}
                                    </span>
                                )}
                                {playlist.is_owner && (
                                    <>
                                        <button type="button" className="pl-btn ghost" onClick={() => setEditing(true)}>
                                            <Pencil aria-hidden="true" /> Editar
                                        </button>
                                        <button type="button" className="pl-btn danger" onClick={handleDelete} disabled={busy}>
                                            <Trash3 aria-hidden="true" /> Eliminar
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {status === "empty" && (
                            <p className="pl-play-note" role="status">No encontramos videos de YouTube para estas canciones.</p>
                        )}

                        {!editing && user && <ExportButtons playlist={playlist} />}

                    </div>

                </header>

                {songs.length === 0 ? (
                    <p className="pl-empty">
                        {playlist.is_owner
                            ? <>Todavía está vacía. Abrí cualquier canción y usá <strong>Agregar a playlist</strong>.</>
                            : "Esta playlist todavía no tiene canciones."}
                    </p>
                ) : (
                    <ol className="pl-songs">
                        {songs.map((song, i) => {
                            const current = playingHere && queue.index === i;
                            return (
                            <li key={song.id} className={`pl-song ${current ? "playing" : ""}`}>
                                <button
                                    type="button"
                                    className="pl-song-index"
                                    onClick={() => play(i)}
                                    aria-label={`Reproducir ${song.title} y seguir con la playlist`}
                                    title="Reproducir desde acá"
                                >
                                    {current
                                        ? <VolumeUpFill aria-hidden="true" />
                                        : <><span className="pl-song-number">{i + 1}</span><PlayFill className="pl-song-play" aria-hidden="true" /></>}
                                </button>
                                <SongCover trackId={song.track_id} genre={song.genres[0]} className="pl-song-cover" />
                                <Link to={`/cancion/${song.id}`} className="pl-song-text">
                                    <span className="pl-song-title">{song.title}</span>
                                    <span className="pl-song-artist">{song.artist}</span>
                                </Link>
                                <StatusBadge status={song.status} />
                                <span className="pl-song-added">{timeAgo(song.added_at)}</span>
                                <span className="pl-song-duration">{song.duration}</span>
                                {playlist.is_owner && (
                                    <button
                                        type="button"
                                        className="pl-song-remove"
                                        onClick={() => handleRemove(song)}
                                        aria-label={`Quitar ${song.title} de la playlist`}
                                        title="Quitar de la playlist"
                                    >
                                        <X />
                                    </button>
                                )}
                            </li>
                            );
                        })}
                    </ol>
                )}

            </div>

        </Layout>

    );

}

export default PlaylistPage;
