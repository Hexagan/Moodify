import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, PencilSquare, Trash } from "react-bootstrap-icons";

import Layout from "../components/layout/Layout";
import ArtistImage from "../components/artists/ArtistImage";
import ForumComposer from "../components/artists/ForumComposer";
import { AuthorLine, ForumMedia } from "../components/artists/ForumParts";
import GuestPrompt from "../components/auth/GuestPrompt";
import { useAuth } from "../context/AuthContext";
import {
    getArtistThread, replyArtistThread, deleteArtistThread, deleteArtistPost,
    updateArtistThread, updateArtistPost
} from "../services/api";
import "./ArtistThread.css";

function DeleteButton({ label, onConfirm }) {
    return (
        <button
            type="button"
            className="forum-delete"
            onClick={() => { if (window.confirm(`¿${label}? No se puede deshacer.`)) onConfirm(); }}
            title={label}
            aria-label={label}
        >
            <Trash />
        </button>
    );
}

function EditButton({ label, onClick }) {
    return (
        <button type="button" className="forum-edit" onClick={onClick} title={label} aria-label={label}>
            <PencilSquare />
        </button>
    );
}

function ArtistThreadView({ artistId, threadId }) {

    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();

    const [thread, setThread] = useState(null);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(null); // "op" or a reply id

    useEffect(() => {
        let cancelled = false;
        getArtistThread(threadId)
            .then((data) => { if (!cancelled) setThread(data); })
            .catch((err) => { if (!cancelled) setError(err.message); });
        return () => { cancelled = true; };
    }, [threadId]);

    const isAuthor = (authorUid) => Boolean(user) && authorUid === user.uid;
    const canDelete = (authorUid) => isAdmin || isAuthor(authorUid);

    async function handleReply(formData) {
        const post = await replyArtistThread(threadId, formData);
        setThread((t) => ({ ...t, reply_count: t.reply_count + 1, posts: [...t.posts, post] }));
    }

    async function handleEditThread(formData) {
        const updated = await updateArtistThread(threadId, formData);
        setThread((t) => ({ ...t, ...updated, posts: t.posts }));
        setEditing(null);
    }

    async function handleEditPost(postId, formData) {
        const updated = await updateArtistPost(postId, formData);
        setThread((t) => ({ ...t, posts: t.posts.map((p) => (p.id === postId ? updated : p)) }));
        setEditing(null);
    }

    async function handleDeleteThread() {
        try {
            await deleteArtistThread(threadId, user.uid);
            navigate(`/artistas/${artistId}`);
        } catch (err) {
            window.alert(err.message);
        }
    }

    async function handleDeletePost(postId) {
        try {
            await deleteArtistPost(postId, user.uid);
            setThread((t) => ({ ...t, reply_count: t.reply_count - 1, posts: t.posts.filter((p) => p.id !== postId) }));
        } catch (err) {
            window.alert(err.message);
        }
    }

    if (error) {
        return <Layout title="Artistas"><p className="artist-thread-message">No se pudo cargar el hilo: {error}</p></Layout>;
    }

    if (!thread) {
        return <Layout title="Artistas"><p className="artist-thread-message">Cargando…</p></Layout>;
    }

    return (

        <Layout title="Artistas">

            <div className="artist-thread-page">

                <nav className="thread-breadcrumb" aria-label="Ubicación">
                    <Link to="/artistas">Artistas</Link>
                    <ChevronRight aria-hidden="true" />
                    <Link to={`/artistas/${thread.artist.id}`} className="thread-breadcrumb-artist">
                        <ArtistImage artist={{ ...thread.artist, picture_checked: true }} className="thread-breadcrumb-image" />
                        {thread.artist.name}
                    </Link>
                </nav>

                <article className="thread-op">
                    <div className="thread-op-head">
                        <AuthorLine author={thread.author} date={thread.created_at} editedAt={thread.edited_at} label="abrió el hilo" />
                        <div className="forum-post-actions">
                            {isAuthor(thread.author.uid) && editing !== "op" && (
                                <EditButton label="Editar el hilo" onClick={() => setEditing("op")} />
                            )}
                            {canDelete(thread.author.uid) && (
                                <DeleteButton label="Eliminar el hilo y sus respuestas" onConfirm={handleDeleteThread} />
                            )}
                        </div>
                    </div>
                    {editing === "op" ? (
                        <div className="forum-edit-area">
                            <ForumComposer
                                authorUid={user.uid}
                                withTitle
                                autoFocus
                                initialTitle={thread.title}
                                initialBody={thread.body ?? ""}
                                existingMedia={thread.media_url ? { url: thread.media_url, type: thread.media_type } : null}
                                placeholder="Mensaje del hilo"
                                submitLabel="Guardar cambios"
                                onSubmit={handleEditThread}
                                onCancel={() => setEditing(null)}
                            />
                        </div>
                    ) : (
                        <>
                            <h1>{thread.title}</h1>
                            {thread.body && <p className="forum-text">{thread.body}</p>}
                            <ForumMedia url={thread.media_url} type={thread.media_type} />
                        </>
                    )}
                </article>

                <section className="thread-replies" aria-labelledby="replies-title">
                    <h2 id="replies-title">
                        {thread.reply_count === 0 ? "Sin respuestas todavía" : `${thread.reply_count} ${thread.reply_count === 1 ? "respuesta" : "respuestas"}`}
                    </h2>

                    {thread.posts.map((post) => (
                        <article key={post.id} className="thread-reply">
                            <div className="thread-op-head">
                                <AuthorLine author={post.author} date={post.created_at} editedAt={post.edited_at} />
                                <div className="forum-post-actions">
                                    {isAuthor(post.author.uid) && editing !== post.id && (
                                        <EditButton label="Editar esta respuesta" onClick={() => setEditing(post.id)} />
                                    )}
                                    {canDelete(post.author.uid) && (
                                        <DeleteButton label="Eliminar esta respuesta" onConfirm={() => handleDeletePost(post.id)} />
                                    )}
                                </div>
                            </div>
                            {editing === post.id ? (
                                <div className="forum-edit-area">
                                    <ForumComposer
                                        authorUid={user.uid}
                                        autoFocus
                                        initialBody={post.body ?? ""}
                                        existingMedia={post.media_url ? { url: post.media_url, type: post.media_type } : null}
                                        placeholder="Tu respuesta"
                                        submitLabel="Guardar cambios"
                                        onSubmit={(formData) => handleEditPost(post.id, formData)}
                                        onCancel={() => setEditing(null)}
                                    />
                                </div>
                            ) : (
                                <>
                                    {post.body && <p className="forum-text">{post.body}</p>}
                                    <ForumMedia url={post.media_url} type={post.media_type} />
                                </>
                            )}
                        </article>
                    ))}

                    {user ? (
                        <ForumComposer
                            authorUid={user.uid}
                            placeholder="Escribí tu respuesta"
                            submitLabel="Responder"
                            onSubmit={handleReply}
                        />
                    ) : (
                        <GuestPrompt action="responder en este hilo" />
                    )}
                </section>

            </div>

        </Layout>

    );

}

// Keyed by the URL id so moving between threads starts from fresh state.
function ArtistThread() {
    const { id: artistId, threadId } = useParams();
    return <ArtistThreadView key={threadId} artistId={artistId} threadId={threadId} />;
}

export default ArtistThread;
