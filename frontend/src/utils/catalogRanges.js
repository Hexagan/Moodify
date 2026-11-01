import { NEUTRAL_MIN, NEUTRAL_MAX } from "./moodScale";

function formatSeconds(total) {
    const minutes = Math.floor(total / 60);
    const seconds = String(total % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
}

const MOOD_PRESETS = [
    { label: "Baja", range: [0, NEUTRAL_MIN] },
    { label: "Media", range: [NEUTRAL_MIN, NEUTRAL_MAX] },
    { label: "Alta", range: [NEUTRAL_MAX, 1] },
];

// Filterable catalogue columns. Duración works in seconds in the UI (the API takes ms) and its
// top end is open: dragging the max thumb all the way right means "and longer".
export const RANGE_COLUMNS = {
    valencia: {
        label: "Valencia",
        min: 0, max: 1, step: 0.01,
        format: (v) => v.toFixed(2),
        presets: MOOD_PRESETS,
        sortLabels: { asc: "Más negativas primero", desc: "Más positivas primero" },
    },
    energia: {
        label: "Energía",
        min: 0, max: 1, step: 0.01,
        format: (v) => v.toFixed(2),
        presets: MOOD_PRESETS,
        sortLabels: { asc: "Más tranquilas primero", desc: "Más enérgicas primero" },
    },
    popularidad: {
        label: "Popularidad",
        min: 0, max: 100, step: 1,
        format: (v) => String(v),
        presets: [
            { label: "Poco conocidas", range: [0, 30] },
            { label: "Intermedias", range: [30, 60] },
            { label: "Populares", range: [60, 100] },
        ],
        sortLabels: { asc: "Menos populares primero", desc: "Más populares primero" },
    },
    duracion: {
        label: "Duración",
        min: 0, max: 600, step: 15, openMax: true,
        format: (v) => (v >= 600 ? "10:00+" : formatSeconds(v)),
        presets: [
            { label: "Cortas (< 3 min)", range: [0, 180] },
            { label: "Medias (3–5 min)", range: [180, 300] },
            { label: "Largas (> 5 min)", range: [300, 600] },
        ],
        sortLabels: { asc: "Más cortas primero", desc: "Más largas primero" },
    },
};

export function isFullRange(field, [low, high]) {
    const col = RANGE_COLUMNS[field];
    return low <= col.min && high >= col.max;
}

export function formatRange(field, [low, high]) {
    const col = RANGE_COLUMNS[field];
    if (col.openMax && high >= col.max) return `${col.format(low)} o más`;
    return `${col.format(low)} – ${col.format(high)}`;
}

// { valencia: [0.2, 0.8], duracion: [180, 600] } -> valencia_min=0.2&valencia_max=0.8&duracion_min=180000
export function appendRangeParams(params, ranges = {}) {
    for (const [field, range] of Object.entries(ranges)) {
        const col = RANGE_COLUMNS[field];
        if (!col || !range) continue;
        const scale = field === "duracion" ? 1000 : 1;
        const [low, high] = range;
        if (low > col.min) params.append(`${field}_min`, low * scale);
        // A thumb resting on an end of the rail adds no bound (and on an open end must not).
        if (high < col.max) params.append(`${field}_max`, high * scale);
    }
    return params;
}
