const BASE_URL = "http://localhost:8000";

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