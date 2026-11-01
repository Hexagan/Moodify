import { SunFill, MoonStarsFill } from "react-bootstrap-icons";
import { useTheme } from "../../context/ThemeContext";
import "./ThemeToggle.css";

function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            className={`theme-toggle ${theme}`}
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
            <SunFill className="theme-toggle-icon sun" />
            <MoonStarsFill className="theme-toggle-icon moon" />
            <span className="theme-toggle-knob" />
        </button>
    );
}

export default ThemeToggle;
