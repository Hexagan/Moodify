const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getCanciones(page = 1, pageSize = 10, sortBy, order = "asc") {
    const params = new URLSearchParams({ page, page_size: pageSize });
    if (sortBy) { params.append("sort_by", sortBy); params.append("order", order); }
    const res = await fetch(`${BASE_URL}/canciones?${params}`);
    return res.json();
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

export async function getTopAcousticSongs() {
    const res = await fetch(`${BASE_URL}/stats/top-acoustic-songs`);
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

export async function getCancionesFull({ page = 1, pageSize = 10, sortBy, order = "asc", genero, busqueda }) {
    const params = new URLSearchParams({ page, page_size: pageSize });
    if (sortBy) { params.append("sort_by", sortBy); params.append("order", order); }
    if (genero) params.append("genero", genero);
    if (busqueda) params.append("busqueda", busqueda);
    const res = await fetch(`${BASE_URL}/canciones?${params}`);
    return res.json();
}

export async function getCancionesCountFull({ genero, busqueda }) {
    const params = new URLSearchParams();
    if (genero) params.append("genero", genero);
    if (busqueda) params.append("busqueda", busqueda);
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
    return res.json();
}

export async function modificarCancion(id, data) {
    const res = await fetch(`${BASE_URL}/canciones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return res.json();
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
    formData.append("file", file);
    const res = await fetch(`${BASE_URL}/usuarios/${uid}/foto`, {
        method: "POST",
        body: formData
    });
    const data = await res.json();
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

