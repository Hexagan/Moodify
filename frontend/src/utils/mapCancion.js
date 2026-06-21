export function mapCancion(c) {
    return {
        id: c.id,
        title: c.track_name,
        artist: c.artists,
        genre: c.track_genre,
        valence: c.valence,
        energy: c.energy,
        popularity: c.popularity,
        duration: formatDuration(c.duration_ms),
        explicit: c.explicit,
        loudness: c.loudness,
        acousticness: c.acousticness,
        status: deriveStatus(c.valence, c.energy)
    };
}

function formatDuration(ms) {
    if (!ms) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function deriveStatus(valence, energy) {
    if (energy > 0.7) return "Enérgico";
    if (energy < 0.3) return "Relajante";
    return "Mixto";
}