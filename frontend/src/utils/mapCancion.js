// Same order the catalog's Estado header cycles through; the backend owns the classification.
export const ESTADOS = ["Enérgico", "Intenso", "Relajante", "Melancólico", "Mixto"];

export function mapCancion(c) {
    return {
        id: c.id,
        track_id: c.track_id,
        title: c.track_name,
        artist: c.artists,
        album: c.album_name,
        genre: c.track_genre,
        genres: c.genres?.length ? c.genres : [c.track_genre].filter(Boolean),
        valence: c.valence,
        energy: c.energy,
        danceability: c.danceability,
        popularity: c.popularity,
        duration: formatDuration(c.duration_ms),
        explicit: c.explicit,
        loudness: c.loudness,
        acousticness: c.acousticness,
        status: c.estado ?? null,
        artistRefs: c.artist_refs ?? []
    };
}

function formatDuration(ms) {
    if (!ms) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
