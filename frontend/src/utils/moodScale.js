// Mirrors the backend Estado rule (song_queries.MIXTO_RADIUS = 0.15): values within 0.15 of the
// 0.5 midpoint are the neutral band where a song can be "Mixto"; outside it, a song leans
// clearly to one side of its quadrant.
export const NEUTRAL_MIN = 0.35;
export const NEUTRAL_MAX = 0.65;

export function scaleLevel(value) {
    if (value >= NEUTRAL_MAX) return "high";
    if (value < NEUTRAL_MIN) return "low";
    return "mid";
}
