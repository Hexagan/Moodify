import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { getUserSettings, saveUserSettings } from "../services/api";
import { TOKENS } from "../utils/themePalettes";
import { DEFAULT_SETTINGS, normalizeSettings, resolveAppearance } from "../utils/settings";
import { setSnippetVolume } from "../utils/snippetPlayer";

const STORAGE_KEY = "moodifySettings";
const LEGACY_THEME_KEY = "theme";
const SERVER_SAVE_DELAY_MS = 800;
const READABLE_FONT_URL = "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap";

function loadLocal() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return normalizeSettings(JSON.parse(saved));
        const legacy = localStorage.getItem(LEGACY_THEME_KEY);
        return normalizeSettings({ mode: legacy === "light" ? "light" : "dark" });
    } catch {
        return normalizeSettings(null);
    }
}

function saveLocal(settings) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch { /* settings just won't survive a reload */ }
}

function applyToDocument(settings) {
    const root = document.documentElement;
    const { scheme, palette, inline } = resolveAppearance(settings);
    root.setAttribute("data-theme", scheme);
    for (const token of TOKENS) {
        if (inline) root.style.setProperty(`--${token}`, palette[token]);
        else root.style.removeProperty(`--${token}`);
    }
    root.style.colorScheme = inline ? scheme : "";

    const a11y = settings.accessibility;
    root.style.setProperty("--ui-zoom", String(a11y.textScale));
    root.classList.toggle("a11y-reduce-motion", a11y.reduceMotion);
    root.classList.toggle("a11y-strong-focus", a11y.strongFocus);
    root.classList.toggle("a11y-readable-font", a11y.readableFont);
    if (a11y.readableFont && !document.getElementById("a11y-font")) {
        const link = document.createElement("link");
        link.id = "a11y-font";
        link.rel = "stylesheet";
        link.href = READABLE_FONT_URL;
        document.head.appendChild(link);
    }

    setSnippetVolume(settings.preferences.snippetVolume);
}

const SettingsContext = createContext(null);

// Settings live in this browser (applied before anything renders) and, for signed-in users,
// on the server too, so colour profiles follow the account to other devices.
export function SettingsProvider({ children }) {

    const { user } = useAuth();
    const uid = user?.uid ?? null;
    const [settings, setSettings] = useState(loadLocal);
    const settingsRef = useRef(settings);
    const uidRef = useRef(uid);
    const timerRef = useRef(null);

    useEffect(() => {
        applyToDocument(settings);
    }, [settings]);

    useEffect(() => {
        uidRef.current = uid;
        if (!uid) return;
        let cancelled = false;
        // On sign-in the account's saved settings win; an account without any adopts this browser's.
        getUserSettings(uid)
            .then((res) => {
                if (cancelled) return;
                if (res.data) {
                    const next = normalizeSettings(res.data);
                    settingsRef.current = next;
                    setSettings(next);
                    saveLocal(next);
                } else {
                    saveUserSettings(uid, settingsRef.current).catch(() => {});
                }
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [uid]);

    useEffect(() => () => clearTimeout(timerRef.current), []);

    function update(change) {
        const current = settingsRef.current;
        const next = normalizeSettings(typeof change === "function" ? change(current) : { ...current, ...change });
        settingsRef.current = next;
        setSettings(next);
        saveLocal(next);
        if (uidRef.current) {
            clearTimeout(timerRef.current);
            const owner = uidRef.current;
            timerRef.current = setTimeout(() => saveUserSettings(owner, next).catch(() => {}), SERVER_SAVE_DELAY_MS);
        }
    }

    const { scheme } = resolveAppearance(settings);

    const value = {
        settings,
        theme: scheme,
        update,
        setMode: (mode) => update({ mode, activeProfile: null }),
        toggleTheme: () => update({ mode: scheme === "dark" ? "light" : "dark", activeProfile: null }),
        selectProfile: (index) => update({ mode: "profile", activeProfile: index }),
        saveProfile: (index, profile) => update((s) => {
            const profiles = [...s.profiles];
            profiles[index] = profile;
            return { ...s, profiles };
        }),
        deleteProfile: (index) => update((s) => {
            const profiles = [...s.profiles];
            profiles[index] = null;
            const active = s.mode === "profile" && s.activeProfile === index;
            return { ...s, profiles, mode: active ? "dark" : s.mode, activeProfile: active ? null : s.activeProfile };
        }),
        updateAccessibility: (patch) => update((s) => ({ ...s, accessibility: { ...s.accessibility, ...patch } })),
        updatePreferences: (patch) => update((s) => ({ ...s, preferences: { ...s.preferences, ...patch } })),
        reset: () => update(DEFAULT_SETTINGS),
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );

}

export function useSettings() {
    return useContext(SettingsContext);
}
