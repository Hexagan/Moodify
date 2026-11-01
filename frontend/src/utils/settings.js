import { BASE_PALETTES, TOKENS, PROFILE_SLOTS, schemeOf, withHighContrast } from "./themePalettes";

const HEX = /^#[0-9a-f]{6}$/i;

export const TEXT_SCALES = [0.9, 1, 1.12, 1.25];
export const VISIBILITIES = ["private", "friends", "public"];

export const DEFAULT_SETTINGS = {
    version: 1,
    // "dark" | "light" | "profile". Light/dark sit outside the profiles: choosing one of them
    // deselects the profile, which then has to be picked again on purpose.
    mode: "dark",
    activeProfile: null,
    profiles: Array(PROFILE_SLOTS).fill(null),
    accessibility: {
        textScale: 1,
        reduceMotion: false,
        highContrast: false,
        strongFocus: false,
        readableFont: false,
    },
    preferences: {
        defaultPlaylistVisibility: "private",
        snippetVolume: 1,
    },
};

function normalizeProfile(profile) {
    if (!profile || typeof profile !== "object" || !profile.colors) return null;
    const base = BASE_PALETTES[profile.base] ?? BASE_PALETTES.dark;
    const colors = {};
    for (const token of TOKENS) {
        const value = profile.colors[token];
        colors[token] = typeof value === "string" && HEX.test(value) ? value.toLowerCase() : base[token];
    }
    return { name: String(profile.name || "Perfil").slice(0, 30), base: profile.base === "light" ? "light" : "dark", colors };
}

// Anything read from storage or the server is untrusted shape-wise: fill gaps from the defaults.
export function normalizeSettings(raw) {
    const s = raw && typeof raw === "object" ? raw : {};
    const profiles = Array.from({ length: PROFILE_SLOTS }, (_, i) => normalizeProfile(s.profiles?.[i]));
    let mode = ["dark", "light", "profile"].includes(s.mode) ? s.mode : DEFAULT_SETTINGS.mode;
    const activeProfile = Number.isInteger(s.activeProfile) && profiles[s.activeProfile] ? s.activeProfile : null;
    if (mode === "profile" && activeProfile === null) mode = "dark";
    const a11y = { ...DEFAULT_SETTINGS.accessibility, ...(s.accessibility || {}) };
    if (!TEXT_SCALES.includes(a11y.textScale)) a11y.textScale = 1;
    const prefs = { ...DEFAULT_SETTINGS.preferences, ...(s.preferences || {}) };
    if (!VISIBILITIES.includes(prefs.defaultPlaylistVisibility)) prefs.defaultPlaylistVisibility = "private";
    prefs.snippetVolume = Math.min(1, Math.max(0, Number(prefs.snippetVolume) || 0));
    return { version: 1, mode, activeProfile: mode === "profile" ? activeProfile : null, profiles, accessibility: a11y, preferences: prefs };
}

export function resolveAppearance(settings) {
    const profile = settings.mode === "profile" ? settings.profiles[settings.activeProfile] : null;
    const scheme = profile ? schemeOf(profile.colors) : settings.mode;
    let palette = profile ? profile.colors : BASE_PALETTES[scheme];
    if (settings.accessibility.highContrast) palette = withHighContrast(palette);
    // Inline variables only when they differ from the stylesheet, so plain light/dark stay in CSS.
    return { scheme, palette, inline: Boolean(profile) || settings.accessibility.highContrast };
}
