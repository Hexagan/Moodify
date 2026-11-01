import { useSettings } from "./SettingsContext";

// Light/dark is now one part of the user's settings (SettingsContext); this keeps the small
// API the existing components (theme toggle, Spotify embeds) were written against.
export function useTheme() {
    const { theme, toggleTheme, settings } = useSettings();
    return { theme, toggleTheme, usingProfile: settings.mode === "profile" };
}
