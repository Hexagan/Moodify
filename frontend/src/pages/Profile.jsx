import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Profile.css";

import Layout from "../components/layout/Layout";
import { useAuth } from "../context/AuthContext";
import {
    getUser, updateUser, getFriends, sendFriendRequest, uploadUserPhoto,
    getPendingRequests, acceptFriendRequest, rejectFriendRequest, getFriendshipStatus,
    getUserLikes, updateLikeNote, unlikeSong
} from "../services/api";
import SongCover from "../components/common/SongCover";
import UserPlaylists from "../components/playlists/UserPlaylists";

import { PersonCircle, ShieldCheck, MusicNoteBeamed, PeopleFill, PencilSquare, Check2, Globe, LockFill, CameraFill, BoxArrowRight, X, HeartFill, CollectionPlay, PersonPlusFill, PersonCheckFill, PersonDashFill, HourglassSplit } from "react-bootstrap-icons";

function PrivacyToggle({ value, onChange }) {
    return (
        <button className={`privacy-toggle ${value ? "public" : "private"}`} onClick={() => onChange(!value)}>
            {value ? <><Globe /> Público</> : <><LockFill /> Privado</>}
        </button>
    );
}

const VISIBLE_LIKES = 5;

function Profile() {

    const { uid } = useParams();
    const { user, logout, setProfile: setAuthProfile } = useAuth();
    const navigate = useNavigate();

    const isOwnProfile = user?.uid === uid;

    const [profile, setProfile] = useState(null);
    const [friends, setFriends] = useState([]);
    const [editing, setEditing] = useState(false);
    const [bio, setBio] = useState("");
    const [privacy, setPrivacy] = useState({ public_email: false, public_bio: true, public_genres: true });
    const [feedback, setFeedback] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const avatarInputRef = useRef(null);
    const [pendingRequests, setPendingRequests] = useState([]);
    // The signed-in user's relationship with this profile: { status, friendship_id }. Tagged with
    // the profile's uid so a result for the previously viewed profile is never shown here.
    const [friendshipFor, setFriendshipFor] = useState(null);
    const friendship = friendshipFor?.uid === uid ? friendshipFor : null;
    const setFriendship = (next) => setFriendshipFor({ ...next, uid });
    const [friendBusy, setFriendBusy] = useState(false);
    const [likes, setLikes] = useState([]);
    const likesListRef = useRef(null);

    // Show the latest 5 likes and scroll for the rest. Rows vary in height (notes), so measure.
    useLayoutEffect(() => {
        const list = likesListRef.current;
        if (!list) return;
        function fit() {
            const rows = list.children;
            if (rows.length <= VISIBLE_LIKES) {
                list.style.maxHeight = "";
                return;
            }
            const top = list.getBoundingClientRect().top - list.scrollTop;
            list.style.maxHeight = `${Math.ceil(rows[VISIBLE_LIKES - 1].getBoundingClientRect().bottom - top) + 2}px`;
        }
        fit();
        window.addEventListener("resize", fit);
        return () => window.removeEventListener("resize", fit);
    }, [likes, profile]);
    const [noteDrafts, setNoteDrafts] = useState({});

    useEffect(() => {
        getUser(uid, user?.uid).then((data) => {
            setProfile(data);
            setBio(data.bio || "");
            setPrivacy({
                public_email: data.public_email,
                public_bio: data.public_bio,
                public_genres: data.public_genres
            });
        });
        getFriends(uid).then(setFriends);
        getUserLikes(uid).then(setLikes);
        if (isOwnProfile) {
            getPendingRequests(uid).then(setPendingRequests);
        }
        if (user && !isOwnProfile) {
            getFriendshipStatus(user.uid, uid).then((res) => setFriendshipFor({ ...res, uid })).catch(() => {});
        }
    }, [uid, isOwnProfile]);

    async function handleSave() {
        const updated = await updateUser(uid, { bio, ...privacy });
        setProfile(updated);
        if (isOwnProfile) setAuthProfile(updated);
        setEditing(false);
        setFeedback({ type: "success", text: "Perfil actualizado." });
        setTimeout(() => setFeedback(null), 3000);
    }

    function flash(type, text) {
        setFeedback({ type, text });
        setTimeout(() => setFeedback(null), 3000);
    }

    // Wraps each friend action so the buttons can't be double-clicked mid-request.
    async function friendAction(action, successText) {
        setFriendBusy(true);
        try {
            await action();
            flash("success", successText);
        } catch {
            flash("error", "No se pudo completar la acción. Probá de nuevo.");
        } finally {
            setFriendBusy(false);
        }
    }

    function handleAddFriend() {
        return friendAction(async () => {
            const res = await sendFriendRequest(user.uid, uid);
            setFriendship({ status: res.status, friendship_id: res.friendship_id });
        }, "Solicitud de amistad enviada.");
    }

    function handleCancelRequest() {
        return friendAction(async () => {
            await rejectFriendRequest(friendship.friendship_id);
            setFriendship({ status: "none", friendship_id: null });
        }, "Solicitud cancelada.");
    }

    function handleAcceptFromProfile() {
        return friendAction(async () => {
            await acceptFriendRequest(friendship.friendship_id);
            setFriendship({ ...friendship, status: "friends" });
            getFriends(uid).then(setFriends);
        }, "Ahora son amigos.");
    }

    function handleRemoveFriend() {
        if (!window.confirm(`¿Eliminar a ${profile?.display_name || "este usuario"} de tus amigos?`)) return;
        return friendAction(async () => {
            await rejectFriendRequest(friendship.friendship_id);
            setFriendship({ status: "none", friendship_id: null });
            getFriends(uid).then(setFriends);
        }, "Amigo eliminado.");
    }

    async function handleAcceptRequest(requestId) {
        await acceptFriendRequest(requestId);
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
        getFriends(uid).then(setFriends);
    }

    async function handleRejectRequest(requestId) {
        await rejectFriendRequest(requestId);
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
    }

    async function handleSaveNote(likeId) {
        const note = noteDrafts[likeId];
        if (note === undefined) return;
        const updated = await updateLikeNote(likeId, note);
        setLikes((prev) => prev.map((l) => (l.id === likeId ? { ...l, note: updated.note } : l)));
        setNoteDrafts((prev) => {
            const next = { ...prev };
            delete next[likeId];
            return next;
        });
    }

    async function handleUnlike(likeId) {
        await unlikeSong(likeId);
        setLikes((prev) => prev.filter((l) => l.id !== likeId));
    }

    async function handleLogout() {
        await logout();
        navigate("/login");
    }

    async function handleAvatarChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarPreview(URL.createObjectURL(file));
        try {
            const updated = await uploadUserPhoto(uid, file);
            setProfile(updated);
            if (isOwnProfile) setAuthProfile(updated);
        } catch (err) {
            setFeedback({ type: "error", text: "No se pudo actualizar la foto de perfil." });
            setTimeout(() => setFeedback(null), 3000);
        } finally {
            setAvatarPreview(null);
        }
    }

    if (!profile) return <Layout title="Perfil"><div className="profile-loading">Cargando...</div></Layout>;

    const isDev = profile.role === "dev";
    const initials = profile.display_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    return (

        <Layout title="Perfil">

            <div className="profile-page">

                <div className="profile-header-card">

                    <div className="profile-avatar-large">
                        {avatarPreview || profile.photo_url
                            ? <img src={avatarPreview || profile.photo_url} alt={profile.display_name} />
                            : <span>{initials}</span>
                        }
                        {isOwnProfile && (
                            <>
                                <button
                                    type="button"
                                    className="avatar-edit-overlay"
                                    onClick={() => avatarInputRef.current?.click()}
                                    aria-label="Cambiar foto de perfil"
                                >
                                    <CameraFill />
                                </button>
                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={handleAvatarChange}
                                />
                            </>
                        )}
                    </div>

                    <div className="profile-header-info">

                        <div className="profile-name-row">
                            <h2>{profile.display_name}</h2>
                            {isDev && (
                                <span className="dev-badge">
                                    <ShieldCheck /> Desarrollador
                                </span>
                            )}
                        </div>

                        {profile.public_email && profile.email && (
                            <span className="profile-email">{profile.email}</span>
                        )}

                        {profile.public_bio && profile.bio && (
                            <p className="profile-bio">{profile.bio}</p>
                        )}

                    </div>

                    <div className="profile-actions">
                        {isOwnProfile ? (
                            <>
                                <button className="edit-profile-btn" onClick={() => setEditing(!editing)}>
                                    <PencilSquare /> Editar perfil
                                </button>
                                <button className="logout-btn" onClick={handleLogout}>
                                    <BoxArrowRight /> Cerrar sesión
                                </button>
                            </>
                        ) : user && friendship && (
                            <>
                                {friendship.status === "none" && (
                                    <button className="add-friend-btn" onClick={handleAddFriend} disabled={friendBusy}>
                                        <PersonPlusFill /> Agregar amigo
                                    </button>
                                )}
                                {friendship.status === "sent" && (
                                    <>
                                        <span className="friend-status"><HourglassSplit /> Solicitud enviada</span>
                                        <button className="remove-friend-btn" onClick={handleCancelRequest} disabled={friendBusy}>
                                            <X /> Cancelar
                                        </button>
                                    </>
                                )}
                                {friendship.status === "received" && (
                                    <>
                                        <button className="add-friend-btn" onClick={handleAcceptFromProfile} disabled={friendBusy}>
                                            <Check2 /> Aceptar solicitud
                                        </button>
                                        <button className="remove-friend-btn" onClick={handleCancelRequest} disabled={friendBusy}>
                                            <X /> Rechazar
                                        </button>
                                    </>
                                )}
                                {friendship.status === "friends" && (
                                    <>
                                        <span className="friend-status friends"><PersonCheckFill /> Amigos</span>
                                        <button className="remove-friend-btn" onClick={handleRemoveFriend} disabled={friendBusy}>
                                            <PersonDashFill /> Eliminar amigo
                                        </button>
                                    </>
                                )}
                            </>
                        )}
                    </div>

                </div>

                {feedback && <div className={`profile-feedback ${feedback.type}`}>{feedback.text}</div>}

                {editing && isOwnProfile && (

                    <div className="profile-edit-card">

                        <h4>Editar información</h4>

                        <label>Biografía</label>
                        <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Contá algo sobre vos..." />

                        <div className="privacy-section">
                            <h4>Privacidad</h4>

                            <div className="privacy-row">
                                <span>Email visible</span>
                                <PrivacyToggle value={privacy.public_email} onChange={(v) => setPrivacy(p => ({ ...p, public_email: v }))} />
                            </div>

                            <div className="privacy-row">
                                <span>Biografía visible</span>
                                <PrivacyToggle value={privacy.public_bio} onChange={(v) => setPrivacy(p => ({ ...p, public_bio: v }))} />
                            </div>

                            <div className="privacy-row">
                                <span>Gustos musicales visibles</span>
                                <PrivacyToggle value={privacy.public_genres} onChange={(v) => setPrivacy(p => ({ ...p, public_genres: v }))} />
                            </div>
                        </div>

                        <button className="save-btn" onClick={handleSave}>
                            <Check2 /> Guardar cambios
                        </button>

                    </div>

                )}

                <section id="playlists" className="profile-section-card profile-playlists">
                    <h4><CollectionPlay /> Playlists</h4>
                    <UserPlaylists
                        ownerUid={uid}
                        viewerUid={user?.uid}
                        emptyText={`${profile.display_name} no tiene playlists que puedas ver.`}
                    />
                </section>

                <div className="profile-grid">

                    {(likes.length > 0 || isOwnProfile) && (
                        <div className="profile-section-card likes-card">
                            <h4><HeartFill /> Me gusta ({likes.length})</h4>
                            <div className="likes-list" ref={likesListRef}>
                                {likes.map((like) => (
                                    <div key={like.id} className={`like-row ${!isOwnProfile && !like.note ? "compact" : ""}`}>
                                        <button
                                            type="button"
                                            className="like-cover"
                                            onClick={() => navigate(`/cancion/${like.song_id}`)}
                                            aria-label={`Abrir ${like.track_name || "la canción"}`}
                                        >
                                            <SongCover trackId={like.track_id} genre={like.track_genre} />
                                        </button>
                                        <div className="like-info">
                                            <div className="like-title-row">
                                                <span className="like-title" onClick={() => navigate(`/cancion/${like.song_id}`)}>
                                                    {like.track_name || "Canción eliminada"}
                                                </span>
                                                <span className="like-artist">{like.artists}</span>
                                            </div>
                                            {/* Only the owner can write; visitors just read the note, if there is one. */}
                                            {isOwnProfile ? (
                                                <textarea
                                                    className="like-note"
                                                    placeholder="Escribí tus pensamientos sobre esta canción..."
                                                    value={noteDrafts[like.id] ?? like.note ?? ""}
                                                    onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [like.id]: e.target.value }))}
                                                    onBlur={() => handleSaveNote(like.id)}
                                                />
                                            ) : like.note && (
                                                <p className="like-note-text">{like.note}</p>
                                            )}
                                        </div>
                                        {isOwnProfile && (
                                            <button className="like-remove-btn" onClick={() => handleUnlike(like.id)}>
                                                <X />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {likes.length === 0 && (
                                    <span className="empty-text">Sin canciones marcadas con me gusta aún.</span>
                                )}
                            </div>
                        </div>
                    )}

                    {profile.public_genres && profile.top_genres && (
                        <div className="profile-section-card">
                            <h4><MusicNoteBeamed /> Géneros favoritos</h4>
                            <div className="genre-chips">
                                {profile.top_genres.split(",").map((g) => (
                                    <span key={g} className="genre-chip">{g.trim()}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="profile-section-card">
                        <h4><PeopleFill /> Amigos ({friends.length})</h4>

                        {isOwnProfile && pendingRequests.length > 0 && (
                            <div className="friend-requests-list">
                                {pendingRequests.map((req) => (
                                    <div key={req.id} className="friend-request-row">
                                        <div
                                            className="friend-request-info"
                                            onClick={() => navigate(`/perfil/${req.requester_uid}`)}
                                        >
                                            <div className="friend-avatar">
                                                {req.requester_photo
                                                    ? <img src={req.requester_photo} alt={req.requester_name} />
                                                    : <span>{req.requester_name?.[0]}</span>
                                                }
                                            </div>
                                            <span>{req.requester_name}</span>
                                        </div>
                                        <div className="friend-request-actions">
                                            <button
                                                className="friend-request-accept"
                                                onClick={() => handleAcceptRequest(req.id)}
                                                aria-label="Aceptar solicitud"
                                            >
                                                <Check2 />
                                            </button>
                                            <button
                                                className="friend-request-reject"
                                                onClick={() => handleRejectRequest(req.id)}
                                                aria-label="Rechazar solicitud"
                                            >
                                                <X />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="friends-grid">
                            {friends.map((friend) => (
                                <div
                                    key={friend.uid}
                                    className="friend-chip"
                                    onClick={() => navigate(`/perfil/${friend.uid}`)}
                                >
                                    <div className="friend-avatar">
                                        {friend.photo_url
                                            ? <img src={friend.photo_url} alt={friend.display_name} />
                                            : <span>{friend.display_name?.[0]}</span>
                                        }
                                    </div>
                                    <span>{friend.display_name}</span>
                                </div>
                            ))}
                            {friends.length === 0 && <span className="empty-text">Sin amigos aún.</span>}
                        </div>
                    </div>

                </div>

            </div>

        </Layout>

    );

}

export default Profile;