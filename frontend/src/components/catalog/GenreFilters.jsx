import { useState, useEffect, useRef, useMemo } from "react";
import "./GenreFilters.css";
import { ChevronDown, Check2, Search, X } from "react-bootstrap-icons";

import { getGeneros } from "../../services/api";

const POPULAR = ["pop", "rock", "hip-hop", "latin", "electronic", "jazz", "classical", "reggaeton"];
const ALL = "todos";

function Highlight({ text, query }) {
    const i = query ? text.toLowerCase().indexOf(query) : -1;
    if (i < 0) return text;
    return (
        <>
            {text.slice(0, i)}
            <mark>{text.slice(i, i + query.length)}</mark>
            {text.slice(i + query.length)}
        </>
    );
}

function GenreFilters({ selectedGenre, onSelectGenre }) {

    const [allGenres, setAllGenres] = useState([]);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const rootRef = useRef(null);
    const triggerRef = useRef(null);
    const listRef = useRef(null);

    useEffect(() => {
        getGeneros()
            .then(setAllGenres)
            .catch((err) => console.error("Error al cargar géneros:", err));
    }, []);

    useEffect(() => {
        if (!open) return;
        function handleClickOutside(e) {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
                setQuery("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const q = query.trim().toLowerCase();
    const options = useMemo(() => {
        const matches = allGenres.filter((g) => g.toLowerCase().includes(q));
        return q ? matches : [ALL, ...matches];
    }, [allGenres, q]);
    const popular = POPULAR.filter((g) => allGenres.includes(g));

    useEffect(() => {
        listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
    }, [activeIndex]);

    function closeAndFocusTrigger() {
        setOpen(false);
        setQuery("");
        triggerRef.current?.focus();
    }

    function select(genre) {
        onSelectGenre(genre);
        closeAndFocusTrigger();
    }

    function handleKeyDown(e) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && options[activeIndex]) {
            e.preventDefault();
            select(options[activeIndex]);
        } else if (e.key === "Escape") {
            closeAndFocusTrigger();
        }
    }

    const hasGenre = selectedGenre && selectedGenre !== ALL;

    return (

        <div className="genre-picker" ref={rootRef}>

            <div className={`genre-trigger-group ${hasGenre ? "has-value" : ""}`}>
                <button
                    ref={triggerRef}
                    type="button"
                    className="genre-trigger"
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    onClick={() => {
                        setOpen((o) => !o);
                        setActiveIndex(0);
                    }}
                >
                    <span className="genre-trigger-label">Género</span>
                    <span className="genre-trigger-value">{hasGenre ? selectedGenre : "Todos"}</span>
                    <ChevronDown className="genre-trigger-chevron" />
                </button>
                {hasGenre && (
                    <button
                        type="button"
                        className="genre-clear"
                        onClick={() => onSelectGenre(ALL)}
                        aria-label={`Quitar filtro de género ${selectedGenre}`}
                        title="Quitar filtro"
                    >
                        <X />
                    </button>
                )}
            </div>

            {open && (
                <div className="genre-panel">

                    <div className="genre-search">
                        <Search aria-hidden="true" />
                        <input
                            role="combobox"
                            aria-expanded="true"
                            aria-controls="genre-listbox"
                            aria-activedescendant={options[activeIndex] ? `genre-opt-${activeIndex}` : undefined}
                            aria-label="Buscar género"
                            placeholder={`Buscar entre ${allGenres.length} géneros`}
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setActiveIndex(0);
                            }}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                    </div>

                    {!q && popular.length > 0 && (
                        <div className="genre-section">
                            <span className="genre-section-title">Populares</span>
                            <div className="genre-chips-row">
                                {popular.map((g) => (
                                    <button
                                        key={g}
                                        type="button"
                                        className={`genre-quick ${g === selectedGenre ? "active" : ""}`}
                                        onClick={() => select(g)}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="genre-section genre-section-list">
                        {!q && <span className="genre-section-title">Todos los géneros</span>}
                        <ul id="genre-listbox" role="listbox" aria-label="Géneros" className="genre-list" ref={listRef}>
                            {options.map((g, i) => {
                                const selected = g === selectedGenre || (g === ALL && !hasGenre);
                                return (
                                    <li
                                        key={g}
                                        id={`genre-opt-${i}`}
                                        data-index={i}
                                        role="option"
                                        aria-selected={selected}
                                        className={`genre-option ${i === activeIndex ? "active" : ""}`}
                                        onMouseEnter={() => setActiveIndex(i)}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => select(g)}
                                    >
                                        <span>{g === ALL ? "Todos los géneros" : <Highlight text={g} query={q} />}</span>
                                        {selected && <Check2 aria-hidden="true" />}
                                    </li>
                                );
                            })}
                            {options.length === 0 && (
                                <li className="genre-empty" role="presentation">Ningún género coincide con “{query}”.</li>
                            )}
                        </ul>
                    </div>

                </div>
            )}

        </div>

    );

}

export default GenreFilters;
