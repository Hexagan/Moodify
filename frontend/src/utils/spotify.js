// Real Spotify track IDs are 22-char base62; ABM-created songs use "manual-<timestamp>".
const SPOTIFY_ID = /^[A-Za-z0-9]{22}$/;

export function isSpotifyId(trackId) {
    return SPOTIFY_ID.test(trackId ?? "");
}
