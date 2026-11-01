import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import "./SongDetail.css";

import Layout from "../components/layout/Layout";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { usePlayer } from "../context/PlayerContext";
import { getComments, postComment, deleteComment, checkLike, setReaction, unlikeSong, getSongThumbnail, getSongYouTube, recordListen } from "../services/api";
import { getGenreColor } from "../utils/genreColors";
import { mapCancion } from "../utils/mapCancion";
import { isSpotifyId } from "../utils/spotify";
import StarRating from "../components/common/StarRating";
import ScaleBadge from "../components/common/ScaleBadge";
import GuestPrompt from "../components/auth/GuestPrompt";
import AddToPlaylist from "../components/playlists/AddToPlaylist";

import {
    Send, XSquareFill, PersonCircle, Heart, HandThumbsDown, X, Spotify, MusicNoteBeamed, Youtube, PlayFill, Soundwave,
    EmojiSmile, EmojiLaughing, EmojiHeartEyes, EmojiSunglasses,
    EmojiFrown, EmojiAngry, EmojiDizzy, EmojiTear
} from "react-bootstrap-icons";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const POSITIVE_REACTIONS = [
    { key: "feliz", label: "Feliz", Icon: EmojiSmile },
    { key: "emocionante", label: "Emocionante", Icon: EmojiLaughing },
    { key: "enamorado", label: "Me encanta", Icon: EmojiHeartEyes },
    { key: "relajante", label: "Relajante", Icon: EmojiSunglasses },
];

const NEGATIVE_REACTIONS = [
    { key: "triste", label: "Triste", Icon: EmojiFrown },
    { key: "enojado", label: "Enojado", Icon: EmojiAngry },
    { key: "aburrido", label: "Aburrido", Icon: EmojiDizzy },
    { key: "decepcionante", label: "Decepcionante", Icon: EmojiTear },
];

function SongDetail() {

    const { id } = useParams();
    const { user, profile, isAdmin } = useAuth();
    const { theme } = useTheme();
    const { track: playing, playTrack } = usePlayer();
    const navigate = useNavigate();

    const [song, setSong] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [reactionId, setReactionId] = useState(null);
    const [reactionType, setReactionType] = useState(null);
    const [reactionDetail, setReactionDetail] = useState(null);
    const [expanded, setExpanded] = useState(null);
    // Tagged with its track so navigating to another song never shows the previous cover.
    const [cover, setCover] = useState({ trackId: null, url: null });
    const thumbnail = cover.trackId && cover.trackId === song?.track_id ? cover.url : null;
    // YouTube is only looked up on request (each search spends API quota); tagged per song.
    const [ytLookup, setYtLookup] = useState({ songId: null, status: "idle", data: null });
    const yt = ytLookup.songId === song?.id ? ytLookup : { status: "idle", data: null };

    useEffect(() => {
        const trackId = song?.track_id;
        if (!trackId) return;
        let cancelled = false;
        getSongThumbnail(trackId)
            .then((url) => { if (!cancelled) setCover({ trackId, url }); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [song?.track_id]);

    useEffect(() => {
        fetch(`${BASE_URL}/canciones/${id}`)
            .then(r => r.json())
            .then(data => setSong(mapCancion(data)));

        getComments(Number(id)).then(setComments);

        if (user?.uid) {
            recordListen(user.uid, Number(id), "detail").catch(() => {});
        }

        if (user?.uid) {
            checkLike(user.uid, Number(id)).then((res) => {
                setReactionId(res.like_id);
                setReactionType(res.type);
                setReactionDetail(res.reaction);
                setExpanded(res.type || null);
            });
        }
    }, [id, user?.uid]);

    async function handleSelectReaction(type, key) {
        if (reactionType === type && reactionDetail === key) {
            await unlikeSong(reactionId);
            setReactionId(null);
            setReactionType(null);
            setReactionDetail(null);
            setExpanded(null);
            return;
        }
        const result = await setReaction(user.uid, Number(id), type, key);
        setReactionId(result.id);
        setReactionType(type);
        setReactionDetail(key);
        setExpanded(type);
    }

    async function handlePlayYouTube() {
        const songId = song.id;
        setYtLookup({ songId, status: "loading", data: null });
        try {
            const data = await getSongYouTube(song.track_id);
            setYtLookup({ songId, status: data.video_id ? "found" : "missing", data });
            if (data.video_id) {
                playTrack({
                    songId,
                    trackId: song.track_id,
                    title: song.title,
                    artist: song.artist,
                    videoId: data.video_id,
                    musicUrl: data.music_url,
                });
            }
        } catch {
            setYtLookup({ songId, status: "error", data: null });
        }
    }

    async function handleSubmit() {
        if (!newComment.trim()) return;
        setSubmitting(true);
        const comment = await postComment({
            song_id: Number(id),
            user_uid: user.uid,
            user_name: profile?.display_name || user.displayName || "Usuario",
            user_photo: profile?.photo_url || user.photoURL || null,
            content: newComment.trim()
        });
        setComments((prev) => [comment, ...prev]);
        setNewComment("");
        setSubmitting(false);
    }

    async function handleDelete(commentId) {
        if (!window.confirm("¿Eliminar este comentario?")) return;
        await deleteComment(commentId);
        setComments((prev) => prev.filter(c => c.id !== commentId));
    }

    if (!song) return <Layout title="Canciones"><div className="song-detail-loading">Cargando...</div></Layout>;

    const isOnSpotify = isSpotifyId(song.track_id);
    const ytSearchUrl = `https://music.youtube.com/search?q=${encodeURIComponent(`${song.artist.split(";")[0]} ${song.title}`)}`;
    const ytMusicUrl = yt.data?.music_url ?? ytSearchUrl;
    const playingHere = playing?.songId === song.id;
    let ytMessage = null;
    if (yt.status === "missing") {
        ytMessage = yt.data.configured
            ? "No encontramos una versión de esta canción que se pueda reproducir dentro de Moodify."
            : "La búsqueda automática en YouTube no está activada en este servidor.";
    } else if (yt.status === "error") {
        ytMessage = "No se pudo consultar YouTube. Probá de nuevo en un rato.";
    }

    return (

        <Layout title="Canciones">

            <div className="song-detail-page">

                <div className="song-detail-header">

                    <div className="song-detail-cover">
                        {thumbnail
                            ? <img src={thumbnail} alt={`Portada de ${song.title}`} />
                            : <span>{song.title[0]}</span>
                        }
                    </div>

                    <div className="song-detail-info">

                        <h1>{song.title}</h1>
                        <p className="song-detail-artist">
                            {(song.artist || "").split(";").map((name) => name.trim()).filter(Boolean).map((name, i) => {
                                const ref = song.artistRefs.find((a) => a.name === name);
                                return (
                                    <span key={name}>
                                        {i > 0 && ", "}
                                        {ref
                                            ? <Link to={`/artistas/${ref.id}`} className="song-detail-artist-link">{name}</Link>
                                            : name}
                                    </span>
                                );
                            })}
                        </p>

                        <div className="song-detail-tags">
                            <span className="song-detail-badge" style={{ background: getGenreColor(song.genres[0]) }}>
                                {song.genres[0]}
                            </span>
                            <span className="song-detail-duration">{song.duration}</span>

                            <div className="reaction-control">
                                {expanded === "like" && (
                                    <div className="reaction-options">
                                        {POSITIVE_REACTIONS.map(({ key, label, Icon }) => (
                                            <button
                                                key={key}
                                                className={`reaction-btn ${reactionType === "like" && reactionDetail === key ? "active" : ""}`}
                                                onClick={() => handleSelectReaction("like", key)}
                                                title={label}
                                            >
                                                <Icon />
                                                {reactionType === "like" && reactionDetail === key && (
                                                    <span className="reaction-label">{label}</span>
                                                )}
                                            </button>
                                        ))}
                                        <button className="reaction-collapse-btn" onClick={() => setExpanded(null)} aria-label="Cerrar">
                                            <X />
                                        </button>
                                    </div>
                                )}

                                {expanded === "dislike" && (
                                    <div className="reaction-options negative">
                                        {NEGATIVE_REACTIONS.map(({ key, label, Icon }) => (
                                            <button
                                                key={key}
                                                className={`reaction-btn ${reactionType === "dislike" && reactionDetail === key ? "active" : ""}`}
                                                onClick={() => handleSelectReaction("dislike", key)}
                                                title={label}
                                            >
                                                <Icon />
                                                {reactionType === "dislike" && reactionDetail === key && (
                                                    <span className="reaction-label">{label}</span>
                                                )}
                                            </button>
                                        ))}
                                        <button className="reaction-collapse-btn" onClick={() => setExpanded(null)} aria-label="Cerrar">
                                            <X />
                                        </button>
                                    </div>
                                )}

                                {!expanded && user && (
                                    <div className="reaction-toggle">
                                        <button className="song-like-btn" onClick={() => setExpanded("like")}>
                                            <Heart /> Me gusta
                                        </button>
                                        <button className="song-dislike-btn" onClick={() => setExpanded("dislike")}>
                                            <HandThumbsDown /> No me gusta
                                        </button>
                                    </div>
                                )}

                                {!user && (
                                    <Link to="/login" className="song-like-btn">
                                        <Heart /> Iniciá sesión para reaccionar
                                    </Link>
                                )}
                            </div>

                            {user && <AddToPlaylist uid={user.uid} songId={song.id} />}
                        </div>

                        <div className="song-detail-stats">

                            <div className="stat-item">
                                <span className="stat-label">Popularidad</span>
                                <div className="stat-value">
                                    <span>{song.popularity}</span>
                                    <StarRating value={song.popularity} />
                                </div>
                            </div>

                            <div className="stat-item">
                                <span className="stat-label">Valencia</span>
                                <ScaleBadge value={song.valence} />
                            </div>

                            <div className="stat-item">
                                <span className="stat-label">Energía</span>
                                <ScaleBadge value={song.energy} />
                            </div>

                            <div className="stat-item">
                                <span className="stat-label">Estado</span>
                                <span className="stat-value">{song.status}</span>
                            </div>

                            <div className="stat-item">
                                <span className="stat-label">{song.genres.length > 1 ? "Géneros" : "Género"}</span>
                                <span className="stat-value">{song.genres.join(", ")}</span>
                            </div>

                        </div>

                    </div>

                </div>

                <div className="song-player-card">

                    <div className="song-player-head">
                        <div>
                            <h3>Reproductor</h3>
                            {isOnSpotify && (
                                <p>Iniciá sesión en Spotify en este navegador para escucharla completa. Sin sesión, Spotify reproduce una vista previa de 30 segundos.</p>
                            )}
                        </div>
                        {isOnSpotify && (
                            <a
                                className="spotify-link"
                                href={`https://open.spotify.com/track/${song.track_id}`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Spotify /> Abrir en Spotify
                            </a>
                        )}
                    </div>

                    {isOnSpotify ? (
                        <iframe
                            className="song-player-embed"
                            title={`Reproductor de ${song.title}`}
                            src={`https://open.spotify.com/embed/track/${song.track_id}?utm_source=generator${theme === "dark" ? "&theme=0" : ""}`}
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                        />
                    ) : (
                        <div className="song-player-empty">
                            <MusicNoteBeamed />
                            <span>Esta canción no está vinculada a Spotify. Podés escucharla completa en YouTube Music, acá abajo.</span>
                        </div>
                    )}

                    <div className="song-yt">

                        <div className="song-yt-text">
                            <h4><Youtube aria-hidden="true" /> Completa en YouTube Music</h4>
                            <p>
                                {ytMessage ?? "Sin cuenta de Spotify. Sigue sonando en el reproductor de abajo mientras recorrés el resto del sitio."}
                            </p>
                        </div>

                        <div className="song-yt-actions">
                            {playingHere ? (
                                <span className="song-yt-playing" role="status">
                                    <Soundwave aria-hidden="true" /> En el reproductor
                                </span>
                            ) : (
                                yt.status !== "missing" && (
                                    <button
                                        type="button"
                                        className="song-yt-play"
                                        onClick={handlePlayYouTube}
                                        disabled={yt.status === "loading"}
                                    >
                                        <PlayFill aria-hidden="true" />
                                        {yt.status === "loading" ? "Buscando…" : "Reproducir completa"}
                                    </button>
                                )
                            )}
                            <a className="song-yt-link" href={ytMusicUrl} target="_blank" rel="noreferrer">
                                {yt.data?.video_id ? "Abrir en YouTube Music" : "Buscar en YouTube Music"}
                            </a>
                        </div>

                    </div>

                </div>

                <div className="comment-section">

                    <h3>Comentarios ({comments.length})</h3>

                    {user ? (
                        <div className="comment-input-row">
                            <div className="comment-avatar-sm">
                                {profile?.photo_url || user.photoURL
                                    ? <img src={profile?.photo_url || user.photoURL} alt="" />
                                    : <PersonCircle />
                                }
                            </div>
                            <input
                                placeholder="Escribí un comentario..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                            />
                            <button className="comment-send-btn" onClick={handleSubmit} disabled={submitting}>
                                <Send />
                            </button>
                        </div>
                    ) : (
                        <div className="comment-guest">
                            <GuestPrompt action="comentar" />
                        </div>
                    )}

                    <div className="comments-list">
                        {comments.map((c) => (
                            <div key={c.id} className="comment-row">

                                <div
                                    className="comment-avatar-sm"
                                    onClick={() => navigate(`/perfil/${c.user_uid}`)}
                                    style={{ cursor: "pointer" }}
                                >
                                    {c.user_photo
                                        ? <img src={c.user_photo} alt="" />
                                        : <PersonCircle />
                                    }
                                </div>

                                <div className="comment-body">
                                    <div className="comment-meta">
                                        <span
                                            className="comment-author"
                                            onClick={() => navigate(`/perfil/${c.user_uid}`)}
                                        >
                                            {c.user_name}
                                        </span>
                                        <span className="comment-time">
                                            {new Date(c.created_at).toLocaleDateString("es-AR")}
                                        </span>
                                    </div>
                                    <p className="comment-content">{c.content}</p>
                                </div>

                                {(user?.uid === c.user_uid || isAdmin) && (
                                    <button className="comment-delete-btn" onClick={() => handleDelete(c.id)}>
                                        <XSquareFill />
                                    </button>
                                )}

                            </div>
                        ))}
                        {comments.length === 0 && (
                            <p className="no-comments">Sé el primero en comentar.</p>
                        )}
                    </div>

                </div>

            </div>

        </Layout>

    );

}

export default SongDetail;