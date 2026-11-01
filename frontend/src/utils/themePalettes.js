// Mirrors styles/variables.css. The CSS file stays the source for plain light/dark; these copies
// seed new colour profiles and feed the high-contrast adjustment.
export const BASE_PALETTES = {
    dark: {
        "bg-page": "#070714", "bg-card": "#101126", "bg-elevated": "#1b1d36", "bg-hover": "#24284d", "border": "#24264d",
        "text-primary": "#ffffff", "text-body": "#d0d2e8", "text-secondary": "#a6a9c8", "text-muted": "#8b8daa", "text-dim": "#5c5f80",
        "accent": "#7c5cff", "accent-hover": "#6a4ce0", "accent-strong": "#8b5cf6", "accent-purple": "#9b5cff", "accent-light": "#c4a0ff",
        "danger": "#ff4d4d", "danger-light": "#ff8888", "success": "#33d17a", "success-text": "#7ef0b0",
        "scale-low": "#ff9a8f", "scale-mid": "#f2cf6b", "scale-high": "#72e0a9",
    },
    light: {
        "bg-page": "#f4f5fb", "bg-card": "#ffffff", "bg-elevated": "#eef0f9", "bg-hover": "#e3e6f5", "border": "#dde0f0",
        "text-primary": "#1a1c2e", "text-body": "#33364f", "text-secondary": "#5a5d78", "text-muted": "#71749a", "text-dim": "#9498b8",
        "accent": "#7c5cff", "accent-hover": "#6a4ce0", "accent-strong": "#7c3aed", "accent-purple": "#8a3ef2", "accent-light": "#6d3fd1",
        "danger": "#e0324d", "danger-light": "#ff6b81", "success": "#1c9c5f", "success-text": "#177a4a",
        "scale-low": "#c2392f", "scale-mid": "#956c00", "scale-high": "#1b8550",
    },
};

export const TOKEN_GROUPS = [
    {
        title: "Fondos",
        tokens: [
            ["bg-page", "Fondo de la página"],
            ["bg-card", "Tarjetas y paneles"],
            ["bg-elevated", "Elementos elevados"],
            ["bg-hover", "Al pasar el mouse"],
            ["border", "Bordes"],
        ],
    },
    {
        title: "Textos",
        tokens: [
            ["text-primary", "Títulos y texto principal"],
            ["text-body", "Párrafos"],
            ["text-secondary", "Texto secundario"],
            ["text-muted", "Texto atenuado"],
            ["text-dim", "Texto tenue"],
        ],
    },
    {
        title: "Acento",
        tokens: [
            ["accent", "Botones y selección"],
            ["accent-hover", "Botones al pasar el mouse"],
            ["accent-strong", "Bordes de acento"],
            ["accent-purple", "Íconos de acento"],
            ["accent-light", "Enlaces y texto de acento"],
        ],
    },
    {
        title: "Estados y escalas",
        tokens: [
            ["danger", "Error / eliminar"],
            ["danger-light", "Error suave"],
            ["success", "Éxito"],
            ["success-text", "Texto de éxito"],
            ["scale-low", "Valencia/energía baja"],
            ["scale-mid", "Valencia/energía media"],
            ["scale-high", "Valencia/energía alta"],
        ],
    },
];

export const TOKENS = TOKEN_GROUPS.flatMap((g) => g.tokens.map(([key]) => key));

export const PROFILE_SLOTS = 3;

// Relative luminance (WCAG) of a #rrggbb colour.
export function luminance(hex) {
    const n = parseInt(hex.slice(1), 16);
    const channel = (v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrastRatio(a, b) {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
}

// A profile is "light" or "dark" by its page background; that decides embeds' themes
// (Spotify) and which of the stylesheet's light-only rules apply.
export function schemeOf(palette) {
    return luminance(palette["bg-page"]) > 0.4 ? "light" : "dark";
}

// High contrast lifts every secondary text tone to the body colour and makes borders visible.
export function withHighContrast(palette) {
    return {
        ...palette,
        "text-secondary": palette["text-body"],
        "text-muted": palette["text-body"],
        "text-dim": palette["text-secondary"],
        "border": palette["text-dim"],
    };
}
