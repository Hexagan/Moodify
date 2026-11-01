import { appendRangeParams } from "../utils/catalogRanges";
import { appendUpload } from "../utils/uploads";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getCanciones(page = 1, pageSize = 10, sortBy, order = "asc") {
    const params = new URLSearchParams({ page, page_size: pageSize });
    if (sortBy) { params.append("sort_by", sortBy); params.append("order", order); }
    const res = await fetch(`${BASE_URL}/canciones?${params}`);
    return res.json();
}

export async function getSongsByQuadrant(cuadrante, valencia, energia) {
    const params = new URLSearchParams({ limit: 15 });
    if (valencia !== undefined && energia !== undefined) {
        params.append("valencia", valencia);
        params.append("energia", energia);
    }
    const res = await fetch(`${BASE_URL}/canciones/mapa-emocional/${cuadrante}?${params}`);
    return res.json();
}

export async function getSongThumbnail(trackId) {
    const res = await fetch(`${BASE_URL}/media/${encodeURIComponent(trackId)}/thumbnail`);
    if (!res.ok) throw new Error(`thumbnail ${res.status}`);
    // Covers uploaded from the ABM are served by this backend as relative /uploads paths.
    return absolutizePhoto((await res.json()).thumbnail_url);
}

export async function getSongPreview(trackId) {
    const res = await fetch(`${BASE_URL}/media/${encodeURIComponent(trackId)}/preview`);
    if (!res.ok) throw new Error(`preview ${res.status}`);
    return absolutizePhoto((await res.json()).preview_url);
}

// { video_id, music_url, search_url, configured } - video_id is null when nothing embeddable
// was found or the server has no YouTube key; music_url then points to a YouTube Music search.
export async function getSongYouTube(trackId) {
    const res = await fetch(`${BASE_URL}/media/${encodeURIComponent(trackId)}/youtube`);
    return jsonOrThrow(res);
}

export async function getSongMediaAdmin(trackId) {
    const res = await fetch(`${BASE_URL}/media/${encodeURIComponent(trackId)}/admin`);
    const data = await jsonOrThrow(res);
    return { ...data, thumbnail_url: absolutizePhoto(data.thumbnail_url), preview_url: absolutizePhoto(data.preview_url) };
}

// fields: { cover (File), cover_url, remove_cover, preview (File), preview_url, remove_preview, youtube, remove_youtube }
export async function updateSongMedia(trackId, adminUid, fields) {
    const formData = new FormData();
    formData.append("admin_uid", adminUid);
    for (const [key, value] of Object.entries(fields)) {
        if (value === undefined || value === null || value === false || value === "") continue;
        if (value instanceof File) await appendUpload(formData, key, value, { folder: "songs", uid: adminUid });
        else formData.append(key, value === true ? "true" : value);
    }
    const res = await fetch(`${BASE_URL}/media/${encodeURIComponent(trackId)}`, { method: "PUT", body: formData });
    return jsonOrThrow(res);
}

export async function getAutofillSources() {
    const res = await fetch(`${BASE_URL}/media/autocompletar/fuentes`);
    return jsonOrThrow(res);
}

export async function searchAutofill(query, source, adminUid) {
    const params = new URLSearchParams({ q: query, fuente: source, admin_uid: adminUid });
    const res = await fetch(`${BASE_URL}/media/autocompletar/buscar?${params}`);
    return jsonOrThrow(res);
}

export async function getKpis() {
    const res = await fetch(`${BASE_URL}/stats/kpis`);
    return res.json();
}

export async function getGenreDistribution() {
    const res = await fetch(`${BASE_URL}/stats/genre-distribution`);
    return res.json();
}

export async function getTopGenres() {
    const res = await fetch(`${BASE_URL}/stats/top-genres`);
    return res.json();
}

export async function getExplicitContent() {
    const res = await fetch(`${BASE_URL}/stats/explicit-content`);
    return res.json();
}

export async function getLoudnessByGenre() {
    const res = await fetch(`${BASE_URL}/stats/loudness-by-genre`);
    return res.json();
}

export async function getAcousticIndex() {
    const res = await fetch(`${BASE_URL}/stats/acoustic-index`);
    return res.json();
}

export async function getTopAcousticSongs({ limit = 6, offset = 0 } = {}) {
    const params = new URLSearchParams({ limit, offset });
    const res = await fetch(`${BASE_URL}/stats/top-acoustic-songs?${params}`);
    return res.json();
}

export async function getPsychMap() {
    const res = await fetch(`${BASE_URL}/stats/psych-map`);
    return res.json();
}

export async function getCancionesCount(genero) {
    const params = new URLSearchParams();
    if (genero) params.append("genero", genero);
    const res = await fetch(`${BASE_URL}/canciones/count?${params}`);
    return res.json();
}

export async function getRandomCanciones() {
    const res = await fetch(`${BASE_URL}/canciones/random`);
    return res.json();
}

export async function getGeneros() {
    const res = await fetch(`${BASE_URL}/canciones/generos`);
    return res.json();
}

export async function getCancionesFull({ page = 1, pageSize = 10, sortBy, order = "asc", genero, busqueda, estado, ranges }) {
    const params = new URLSearchParams({ page, page_size: pageSize });
    if (sortBy) { params.append("sort_by", sortBy); params.append("order", order); }
    if (genero) params.append("genero", genero);
    if (busqueda) params.append("busqueda", busqueda);
    if (estado) params.append("estado", estado);
    appendRangeParams(params, ranges);
    const res = await fetch(`${BASE_URL}/canciones?${params}`);
    return res.json();
}

export async function getCancionesCountFull({ genero, busqueda, estado, ranges }) {
    const params = new URLSearchParams();
    if (genero) params.append("genero", genero);
    if (busqueda) params.append("busqueda", busqueda);
    if (estado) params.append("estado", estado);
    appendRangeParams(params, ranges);
    const res = await fetch(`${BASE_URL}/canciones/count?${params}`);
    return res.json();
}

export async function searchCanciones(query) {
    if (!query) return [];
    const results = await getCancionesFull({ page: 1, pageSize: 30, busqueda: query });
    const seen = new Set();
    return results.filter((song) => {
        const key = song.track_name?.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

export async function crearCancion(data) {
    const res = await fetch(`${BASE_URL}/canciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return jsonOrThrow(res);
}

export async function modificarCancion(id, data) {
    const res = await fetch(`${BASE_URL}/canciones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return jsonOrThrow(res);
}

export async function eliminarCancion(id) {
    const res = await fetch(`${BASE_URL}/canciones/${id}`, {
        method: "DELETE"
    });
    return res.json();
}

function absolutizePhoto(url) {
    return url && !url.startsWith("http") ? `${BASE_URL}${url}` : url;
}

export async function upsertUser(data) {
    const res = await fetch(`${BASE_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    const updated = await res.json();
    updated.photo_url = absolutizePhoto(updated.photo_url);
    return updated;
}

export async function getUser(uid, viewerUid) {
    const params = viewerUid ? `?viewer_uid=${viewerUid}` : "";
    const res = await fetch(`${BASE_URL}/usuarios/${uid}${params}`);
    const data = await res.json();
    data.photo_url = absolutizePhoto(data.photo_url);
    return data;
}

export async function updateUser(uid, data) {
    const res = await fetch(`${BASE_URL}/usuarios/${uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    const updated = await res.json();
    updated.photo_url = absolutizePhoto(updated.photo_url);
    return updated;
}

export async function uploadUserPhoto(uid, file) {
    const formData = new FormData();
    await appendUpload(formData, "file", file, { folder: "avatars", uid });
    const res = await fetch(`${BASE_URL}/usuarios/${uid}/foto`, {
        method: "POST",
        body: formData
    });
    const data = await jsonOrThrow(res);
    data.photo_url = absolutizePhoto(data.photo_url);
    return data;
}

export async function searchUsers(q) {
    const res = await fetch(`${BASE_URL}/usuarios?q=${encodeURIComponent(q)}`);
    return res.json();
}

export async function getFriends(uid) {
    const res = await fetch(`${BASE_URL}/amigos/${uid}`);
    const data = await res.json();
    data.forEach((friend) => { friend.photo_url = absolutizePhoto(friend.photo_url); });
    return data;
}

export async function sendFriendRequest(requesterUid, addresseeUid) {
    const res = await fetch(`${BASE_URL}/amigos/solicitar?requester_uid=${requesterUid}&addressee_uid=${addresseeUid}`, {
        method: "POST"
    });
    return res.json();
}

export async function getPendingRequests(uid) {
    const res = await fetch(`${BASE_URL}/amigos/solicitudes/${uid}`);
    const data = await res.json();
    data.forEach((req) => { req.requester_photo = absolutizePhoto(req.requester_photo); });
    return data;
}

export async function acceptFriendRequest(friendshipId) {
    const res = await fetch(`${BASE_URL}/amigos/aceptar/${friendshipId}`, {
        method: "PUT"
    });
    return res.json();
}

export async function rejectFriendRequest(friendshipId) {
    const res = await fetch(`${BASE_URL}/amigos/${friendshipId}`, {
        method: "DELETE"
    });
    return res.json();
}

export async function checkLike(userUid, songId) {
    const res = await fetch(`${BASE_URL}/likes/check?user_uid=${userUid}&song_id=${songId}`);
    return res.json();
}

export async function setReaction(userUid, songId, type, reaction = null) {
    const res = await fetch(`${BASE_URL}/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_uid: userUid, song_id: songId, type, reaction })
    });
    return res.json();
}

export async function unlikeSong(likeId) {
    const res = await fetch(`${BASE_URL}/likes/${likeId}`, {
        method: "DELETE"
    });
    return res.json();
}

export async function updateLikeNote(likeId, note) {
    const res = await fetch(`${BASE_URL}/likes/${likeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note })
    });
    return res.json();
}

export async function getUserLikes(uid) {
    const res = await fetch(`${BASE_URL}/likes/usuario/${uid}`);
    return res.json();
}

export async function getComments(songId) {
    const res = await fetch(`${BASE_URL}/comentarios/${songId}`);
    return res.json();
}

export async function postComment(data) {
    const res = await fetch(`${BASE_URL}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function deleteComment(commentId) {
    const res = await fetch(`${BASE_URL}/comentarios/${commentId}`, {
        method: "DELETE"
    });
    return res.json();
}


// ---------- Artistas ----------

export async function sendSuggestion({ uid, title, message }) {
    const res = await fetch(`${BASE_URL}/contacto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, title, message })
    });
    return jsonOrThrow(res);
}

async function jsonOrThrow(res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || `Error ${res.status}`);
    return data;
}

function fixForumUrls(item) {
    if (!item) return item;
    const fixed = { ...item, media_url: absolutizePhoto(item.media_url) };
    if (item.author) fixed.author = { ...item.author, photo_url: absolutizePhoto(item.author.photo_url) };
    if (item.posts) fixed.posts = item.posts.map(fixForumUrls);
    return fixed;
}

export async function getArtists({ q, page = 1, pageSize = 24 } = {}) {
    const params = new URLSearchParams({ page, page_size: pageSize });
    if (q) params.append("q", q);
    return jsonOrThrow(await fetch(`${BASE_URL}/artistas?${params}`));
}

export async function getFeaturedArtists() {
    return jsonOrThrow(await fetch(`${BASE_URL}/artistas/destacados`));
}

export async function getArtist(id) {
    return jsonOrThrow(await fetch(`${BASE_URL}/artistas/${id}`));
}

export async function getArtistPicture(id) {
    return (await jsonOrThrow(await fetch(`${BASE_URL}/artistas/${id}/foto`))).picture_url;
}

export async function getArtistSongs(id) {
    return jsonOrThrow(await fetch(`${BASE_URL}/artistas/${id}/canciones`));
}

export async function getArtistThreads(id) {
    return (await jsonOrThrow(await fetch(`${BASE_URL}/artistas/${id}/hilos`))).map(fixForumUrls);
}

export async function createArtistThread(artistId, formData) {
    const res = await fetch(`${BASE_URL}/artistas/${artistId}/hilos`, { method: "POST", body: formData });
    return fixForumUrls(await jsonOrThrow(res));
}

export async function getArtistThread(threadId) {
    return fixForumUrls(await jsonOrThrow(await fetch(`${BASE_URL}/artistas/hilos/${threadId}`)));
}

export async function replyArtistThread(threadId, formData) {
    const res = await fetch(`${BASE_URL}/artistas/hilos/${threadId}/respuestas`, { method: "POST", body: formData });
    return fixForumUrls(await jsonOrThrow(res));
}

export async function deleteArtistThread(threadId, uid) {
    const params = new URLSearchParams({ uid });
    return jsonOrThrow(await fetch(`${BASE_URL}/artistas/hilos/${threadId}?${params}`, { method: "DELETE" }));
}

export async function deleteArtistPost(postId, uid) {
    const params = new URLSearchParams({ uid });
    return jsonOrThrow(await fetch(`${BASE_URL}/artistas/respuestas/${postId}?${params}`, { method: "DELETE" }));
}

export async function updateArtistThread(threadId, formData) {
    const res = await fetch(`${BASE_URL}/artistas/hilos/${threadId}`, { method: "PUT", body: formData });
    return fixForumUrls(await jsonOrThrow(res));
}

export async function updateArtistPost(postId, formData) {
    const res = await fetch(`${BASE_URL}/artistas/respuestas/${postId}`, { method: "PUT", body: formData });
    return fixForumUrls(await jsonOrThrow(res));
}

// ---------- Música personal: historial, me gusta, recomendaciones ----------

export async function recordListen(userUid, songId, source) {
    const res = await fetch(`${BASE_URL}/musica/historial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_uid: userUid, song_id: songId, source })
    });
    return jsonOrThrow(res);
}

export async function getListeningHistory(uid, limit = 50) {
    return jsonOrThrow(await fetch(`${BASE_URL}/musica/historial/${uid}?limit=${limit}`));
}

export async function clearListeningHistory(uid) {
    const params = new URLSearchParams({ requester: uid });
    return jsonOrThrow(await fetch(`${BASE_URL}/musica/historial/${uid}?${params}`, { method: "DELETE" }));
}

export async function getLikedPlaylist(uid, limit = 50) {
    return jsonOrThrow(await fetch(`${BASE_URL}/musica/me-gusta/${uid}?limit=${limit}`));
}

export async function getRecommendations(uid, limit = 12) {
    return jsonOrThrow(await fetch(`${BASE_URL}/musica/recomendaciones/${uid}?limit=${limit}`));
}

export async function getRecommendedArtists(uid, limit = 8) {
    return jsonOrThrow(await fetch(`${BASE_URL}/musica/artistas-recomendados/${uid}?limit=${limit}`));
}

// ---------- settings ----------

export async function getUserSettings(uid) {
    const res = await fetch(`${BASE_URL}/configuracion/${encodeURIComponent(uid)}`);
    return jsonOrThrow(res);
}

export async function saveUserSettings(uid, data) {
    const res = await fetch(`${BASE_URL}/configuracion/${encodeURIComponent(uid)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return jsonOrThrow(res);
}

// ---------- playlists ----------

function fixPlaylist(p) {
    return p && { ...p, owner: p.owner && { ...p.owner, photo_url: absolutizePhoto(p.owner.photo_url) } };
}

export async function getUserPlaylists(uid, viewerUid, songId) {
    const params = new URLSearchParams();
    if (viewerUid) params.append("viewer_uid", viewerUid);
    if (songId != null) params.append("song_id", songId);
    const res = await fetch(`${BASE_URL}/playlists/usuario/${encodeURIComponent(uid)}?${params}`);
    return (await jsonOrThrow(res)).map(fixPlaylist);
}

export async function getPlaylist(id, viewerUid) {
    const params = viewerUid ? `?viewer_uid=${encodeURIComponent(viewerUid)}` : "";
    const res = await fetch(`${BASE_URL}/playlists/${id}${params}`);
    return fixPlaylist(await jsonOrThrow(res));
}

export async function createPlaylist(data) {
    const res = await fetch(`${BASE_URL}/playlists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return fixPlaylist(await jsonOrThrow(res));
}

export async function updatePlaylist(id, data) {
    const res = await fetch(`${BASE_URL}/playlists/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return fixPlaylist(await jsonOrThrow(res));
}

export async function deletePlaylist(id, uid) {
    const res = await fetch(`${BASE_URL}/playlists/${id}?uid=${encodeURIComponent(uid)}`, { method: "DELETE" });
    return jsonOrThrow(res);
}

export async function addSongToPlaylist(playlistId, uid, songId) {
    const res = await fetch(`${BASE_URL}/playlists/${playlistId}/canciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, song_id: songId })
    });
    return jsonOrThrow(res);
}

export async function removeSongFromPlaylist(playlistId, uid, songId) {
    const res = await fetch(`${BASE_URL}/playlists/${playlistId}/canciones/${songId}?uid=${encodeURIComponent(uid)}`, { method: "DELETE" });
    return jsonOrThrow(res);
}
