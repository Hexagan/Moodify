import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./SongDetail.css";

import Layout from "../components/layout/Layout";
import { useAuth } from "../context/AuthContext";
import { getComments, postComment, deleteComment, checkLike, setReaction, unlikeSong } from "../services/api";
import { getGenreColor } from "../utils/genreColors";
import { mapCancion } from "../utils/mapCancion";
import StarRating from "../components/common/StarRating";

import {
    Send, XSquareFill, PersonCircle, Heart, HandThumbsDown, X,
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
    const navigate = useNavigate();

    const [song, setSong] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [reactionId, setReactionId] = useState(null);
    const [reactionType, setReactionType] = useState(null);
    const [reactionDetail, setReactionDetail] = useState(null);
    const [expanded, setExpanded] = useState(null);

    useEffect(() => {
        fetch(`${BASE_URL}/canciones/${id}`)
            .then(r => r.json())
            .then(data => setSong(mapCancion(data)));

        getComments(Number(id)).then(setComments);

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

    return (

        <Layout title="Canciones">

            <div className="song-detail-page">

                <div className="song-detail-header">

                    <div className="song-detail-cover">
                        <span>{song.title[0]}</span>
                    </div>

                    <div className="song-detail-info">

                        <h1>{song.title}</h1>
                        <p className="song-detail-artist">{song.artist}</p>

                        <div className="song-detail-tags">
                            <span className="song-detail-badge" style={{ background: getGenreColor(song.genre) }}>
                                {song.genre}
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

                                {!expanded && (
                                    <div className="reaction-toggle">
                                        <button className="song-like-btn" onClick={() => setExpanded("like")}>
                                            <Heart /> Me gusta
                                        </button>
                                        <button className="song-dislike-btn" onClick={() => setExpanded("dislike")}>
                                            <HandThumbsDown /> No me gusta
                                        </button>
                                    </div>
                                )}
                            </div>
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
                                <span className={`valence-badge ${song.valence >= 0.6 ? "valence-high" : song.valence >= 0.4 ? "valence-mid" : "valence-low"}`}>
                                    {song.valence}
                                </span>
                            </div>

                            <div className="stat-item">
                                <span className="stat-label">Energía</span>
                                <span className="stat-value">{song.energy}</span>
                            </div>

                            <div className="stat-item">
                                <span className="stat-label">Estado</span>
                                <span className="stat-value">{song.status}</span>
                            </div>

                        </div>

                    </div>

                </div>

                <div className="comment-section">

                    <h3>Comentarios ({comments.length})</h3>

                    <div className="comment-input-row">
                        <div className="comment-avatar-sm">
                            {profile?.photo_url || user?.photoURL
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