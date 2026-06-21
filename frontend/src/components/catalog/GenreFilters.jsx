import { useState, useEffect, useRef } from "react";
import "./GenreFilters.css";
import { Funnel, Search } from "react-bootstrap-icons";

import { getGeneros } from "../../services/api";

const QUICK_GENRES = ["todos", "pop", "rock", "jazz", "electronic", "blues"];

function GenreFilters({ selectedGenre, onSelectGenre }) {

    const [allGenres, setAllGenres] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef(null);

    useEffect(() => {
        getGeneros()
            .then(setAllGenres)
            .catch((err) => console.error("Error al cargar géneros:", err));
    }, []);

    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredGenres = allGenres.filter((g) =>
        g.toLowerCase().includes(search.toLowerCase())
    );

    const isOverflowGenreActive =
        selectedGenre !== "todos" && !QUICK_GENRES.includes(selectedGenre);

    return (

        <div className="genre-filters">

            <div className="genre-buttons">

                {QUICK_GENRES.map((genre) => (
                    <button
                        key={genre}
                        className={genre === selectedGenre ? "genre-btn active" : "genre-btn"}
                        onClick={() => onSelectGenre(genre)}
                    >
                        {genre === "todos" ? "Todos" : genre}
                    </button>
                ))}

            </div>

            <div className="filter-dropdown" ref={dropdownRef}>

                <button
                    className={isOverflowGenreActive ? "filter-btn active" : "filter-btn"}
                    onClick={() => setDropdownOpen((open) => !open)}
                >
                    <Funnel />
                    {isOverflowGenreActive ? selectedGenre : "Más filtros"}
                </button>

                {dropdownOpen && (
                    <div className="filter-dropdown-menu">

                        <div className="filter-search">
                            <Search />
                            <input
                                placeholder="Buscar género"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="filter-dropdown-list">
                            {filteredGenres.map((genre) => (
                                <button
                                    key={genre}
                                    className={genre === selectedGenre ? "filter-option active" : "filter-option"}
                                    onClick={() => {
                                        onSelectGenre(genre);
                                        setDropdownOpen(false);
                                        setSearch("");
                                    }}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>

                    </div>
                )}

            </div>

        </div>

    );

}

export default GenreFilters;