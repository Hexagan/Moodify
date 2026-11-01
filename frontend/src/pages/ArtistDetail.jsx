import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BoxArrowUpRight, ChatDotsFill, ChatLeftText, ImageFill, CameraVideoFill, PlusLg, MusicNoteBeamed, PencilSquare } from "react-bootstrap-icons";

import Layout from "../components/layout/Layout";
import ArtistImage from "../components/artists/ArtistImage";
import ForumComposer from "../components/artists/ForumComposer";
import { AuthorLine } from "../components/artists/ForumParts";
import GuestPrompt from "../components/auth/GuestPrompt";
import StatusBadge from "../components/catalog/SongsRow/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { getArtist, getArtistSongs, getArtistThreads, createArtistThread, getSongThumbnail, updateArtistBio } from "../services/api";
import { mapCancion } from "../utils/mapCancion";
import { timeAgo } from "../utils/timeAgo";
import "./ArtistDetail.css";

function SongTile({ song }) {
    const [cover, setCover] = useState(null);

    useEffect(() => {
        let cancelled = false;
        getSongThumbnail(song.track_id)
            .then((url) => { if (!cancelled) setCover(url); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [song.track_id]);

    return (
        <Link to={`/cancion/${song.id}`} className="song-tile">
            <div className="song-tile-cover">
                {cover ? <img src={cover} alt="" loading="lazy" /> : <MusicNoteBeamed aria-hidden="true" />}
            </div>
            <span className="song-tile-title">{song.title}</span>
            <StatusBadge status={song.status} />
        </Link>
    );
}

function ThreadRow({ artistId, thread }) {
    return (
        <Link to={`/artistas/${artistId}/hilo/${thread.id}`} className="thread-row">
            <div className="thread-row-main">
                <h4>{thread.title}</h4>
                {thread.body && <p>{thread.body}</p>}
                <AuthorLine author={thread.author} date={thread.created_at} />
            </div>
            <div className="thread-row-side">
                {thread.media_type === "image" && (
                    <img className="thread-row-thumb" src={thread.media_url} alt="" loading="lazy" />
                )}
                {thread.media_type === "video" && (
                    <span className="thread-row-video" title="Incluye video"><CameraVideoFill aria-hidden="true" /></span>
                )}
                <span className="thread-row-stat" title="Respuestas">
                    <ChatLeftText aria-hidden="true" /> {thread.reply_count}
                </span>
                <span className="thread-row-activity">{timeAgo(thread.last_activity_at)}</span>
            </div>
        </Link>
    );
}

const BIO_MAX = 3000;

// "Fuente: Wikipedia" for the automatic descriptions, the site's name for a source an admin set.
function sourceLabel(url) {
    try {
        const host = new URL(url).hostname.replace(/^www\./, "");
        return host.endsWith("wikipedia.org") ? "Wikipedia" : host;
    } catch {
        return "enlace";
    }
}

function BioEditor({ artist, adminUid, onSaved, onCancel }) {
    const [bio, setBio] = useState(artist.bio || "");
    const [bioUrl, setBioUrl] = useState(artist.bio_url || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            onSaved(await updateArtistBio(artist.id, { adminUid, bio, bioUrl }));
        } catch (err) {
            setError(err.message);
            setSaving(false);
        }
    }

    return (
        <form className="artist-bio-editor" onSubmit={handleSubmit}>
            <label>
                <span>Descripción</span>
                <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={BIO_MAX}
                    rows={6}
                    placeholder={`¿Quién es ${artist.name}? Dejalo vacío para no mostrar descripción.`}
                    autoFocus
                />
                <small>{bio.length}/{BIO_MAX}</small>
            </label>
            <label>
                <span>Fuente (opcional)</span>
                <input
                    type="url"
                    value={bioUrl}
                    onChange={(e) => setBioUrl(e.target.value)}
                    placeholder="https://es.wikipedia.org/wiki/…"
                />
            </label>
            {error && <p className="artist-bio-error" role="alert">{error}</p>}
            <div className="artist-bio-actions">
                <button type="button" className="forum-btn ghost" onClick={onCancel} disabled={saving}>Cancelar</button>
                <button type="submit" className="forum-btn primary" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button>
            </div>
        </form>
    );
}

function ArtistDetailView({ id }) {

    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();
    const [editingBio, setEditingBio] = useState(false);

    const [artist, setArtist] = useState(null);
    const [songs, setSongs] = useState([]);
    const [threads, setThreads] = useState([]);
    const [composing, setComposing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        getArtist(id)
            .then((data) => { if (!cancelled) setArtist(data); })
            .catch((err) => { if (!cancelled) setError(err.message); });
        getArtistSongs(id)
            .then((data) => { if (!cancelled) setSongs(data.map(mapCancion)); })
            .catch(() => {});
        getArtistThreads(id)
            .then((data) => { if (!cancelled) setThreads(data); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [id]);

    async function handleCreate(formData) {
        const thread = await createArtistThread(id, formData);
        navigate(`/artistas/${id}/hilo/${thread.id}`);
    }

    if (error) {
        return (
            <Layout title="Artistas">
                <p className="artist-message">No se pudo cargar el artista: {error}</p>
            </Layout>
        );
    }

    if (!artist) {
        return <Layout title="Artistas"><p className="artist-message">Cargando…</p></Layout>;
    }

    return (

        <Layout title="Artistas">

            <div className="artist-page">

                <Link to="/artistas" className="artist-back"><ArrowLeft /> Artistas</Link>

                <header className="artist-hero">
                    {artist.picture_url && (
                        <div className="artist-hero-backdrop" style={{ backgroundImage: `url("${artist.picture_url}")` }} aria-hidden="true" />
                    )}
                    <ArtistImage artist={artist} className="artist-hero-image" />
                    <div className="artist-hero-info">
                        <span className="artist-hero-eyebrow">Artista</span>
                        <h1>{artist.name}</h1>
                        <div className="artist-hero-chips">
                            <span><MusicNoteBeamed aria-hidden="true" /> {artist.song_count} {artist.song_count === 1 ? "canción" : "canciones"} en Moodify</span>
                            <span><ChatDotsFill aria-hidden="true" /> {artist.thread_count} {artist.thread_count === 1 ? "conversación" : "conversaciones"}</span>
                        </div>
                        {editingBio ? (
                            <BioEditor
                                artist={artist}
                                adminUid={user.uid}
                                onSaved={(saved) => {
                                    setArtist((prev) => ({ ...prev, ...saved }));
                                    setEditingBio(false);
                                }}
                                onCancel={() => setEditingBio(false)}
                            />
                        ) : (
                            <>
                                {artist.bio ? (
                                    <>
                                        <p className="artist-hero-bio">{artist.bio}</p>
                                        {artist.bio_url && (
                                            <a className="artist-hero-source" href={artist.bio_url} target="_blank" rel="noreferrer">
                                                Fuente: {sourceLabel(artist.bio_url)} <BoxArrowUpRight aria-hidden="true" />
                                            </a>
                                        )}
                                    </>
                                ) : (
                                    <p className="artist-hero-bio muted">Todavía no tenemos una descripción de este artista.</p>
                                )}
                                {isAdmin && (
                                    <button type="button" className="artist-bio-edit" onClick={() => setEditingBio(true)}>
                                        <PencilSquare aria-hidden="true" /> Editar descripción
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </header>

                {songs.length > 0 && (
                    <section className="artist-section" aria-labelledby="songs-title">
                        <div className="artist-section-head">
                            <h2 id="songs-title">Sus canciones en Moodify</h2>
                            <span>Las más populares del catálogo</span>
                        </div>
                        <div className="song-tiles">
                            {songs.map((song) => <SongTile key={song.id} song={song} />)}
                        </div>
                    </section>
                )}

                <section className="artist-section" aria-labelledby="threads-title">
                    <div className="artist-section-head">
                        <div>
                            <h2 id="threads-title">Conversaciones</h2>
                            <span>{threads.length > 0 ? "Las más activas primero" : `Todavía nadie habló de ${artist.name}`}</span>
                        </div>
                        {user && !composing && (
                            <button type="button" className="forum-btn primary" onClick={() => setComposing(true)}>
                                <PlusLg /> Nuevo hilo
                            </button>
                        )}
                    </div>

                    {!user && <GuestPrompt action={`abrir un hilo sobre ${artist.name}`} />}

                    {composing && (
                        <ForumComposer
                            authorUid={user.uid}
                            withTitle
                            autoFocus
                            placeholder={`¿Qué querés charlar sobre ${artist.name}?`}
                            submitLabel="Publicar hilo"
                            onSubmit={handleCreate}
                            onCancel={() => setComposing(false)}
                        />
                    )}

                    {threads.length > 0 ? (
                        <div className="thread-list">
                            {threads.map((thread) => <ThreadRow key={thread.id} artistId={artist.id} thread={thread} />)}
                        </div>
                    ) : !composing && (
                        <div className="thread-empty">
                            <ImageFill aria-hidden="true" />
                            <p>Abrí el primer hilo: una opinión, un recuerdo, una foto del recital o un video.</p>
                        </div>
                    )}
                </section>

            </div>

        </Layout>

    );

}

// Keyed by the URL id so moving between artists starts from fresh state.
function ArtistDetail() {
    const { id } = useParams();
    return <ArtistDetailView key={id} id={id} />;
}

export default ArtistDetail;
