import { useState } from "react";
import "./SongSearchSelect.css";
import { Search } from "react-bootstrap-icons";

import { searchCanciones } from "../../services/api";
import { mapCancion } from "../../utils/mapCancion";

function SongSearchSelect({ onSelect, selectedSong, variant = "purple" }) {

    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [searched, setSearched] = useState(false);

    async function handleSearch() {
        if (!query.trim()) return;
        try {
            const data = await searchCanciones(query);
            setResults(data.map(mapCancion));
            setSearched(true);
        } catch (err) {
            console.error("Error al buscar canciones:", err);
        }
    }

    return (

        <div className="song-search-select">

            <h4>Seleccionar canción</h4>

            <div className="search-row">

                <input
                    placeholder="Buscar por nombre"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />

                <button className="search-btn" onClick={handleSearch}>
                    <Search /> Buscar
                </button>

            </div>

            {searched && results.length > 0 && (
                <div className="search-results">
                    {results.map((song) => (
                        <button
                            key={song.id}
                            className="search-result-item"
                            onClick={() => { onSelect(song); setResults([]); setSearched(false); setQuery(""); }}
                        >
                            <strong>{song.title}</strong>
                            <span>{song.artist} - {song.genre}</span>
                        </button>
                    ))}
                </div>
            )}

            {searched && results.length === 0 && (
                <p className="no-results">No se encontraron canciones.</p>
            )}

            {selectedSong && (
                <>
                    <h4>Canción seleccionada</h4>
                    <div className={`selected-song-card ${variant}`}>
                        <strong>{selectedSong.title}</strong>
                        <span>{selectedSong.artist} - {selectedSong.genre} - {selectedSong.duration}</span>
                    </div>
                </>
            )}

        </div>

    );

}

export default SongSearchSelect;