import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./AcousticRanking.css";

import SongCover from "../common/SongCover";
import { getTopAcousticSongs } from "../../services/api";
import { mapCancion } from "../../utils/mapCancion";

const PAGE = 12;

// Picks up where the Top 6 card stops: a numbered podium-style list, no columns or filters,
// so it reads as a ranking rather than as a second catalogue.
function AcousticRanking({ id, startAfter = 6 }) {

    const [pages, setPages] = useState(1);
    const [result, setResult] = useState({ pages: 0, songs: [], hasMore: true });
    const loading = result.pages !== pages;

    useEffect(() => {
        let cancelled = false;
        const offset = startAfter + (pages - 1) * PAGE;
        // One extra row tells whether there's another page without a count query.
        getTopAcousticSongs({ limit: PAGE + 1, offset })
            .then((data) => {
                if (cancelled) return;
                const batch = data.slice(0, PAGE).map(mapCancion);
                setResult((prev) => ({
                    pages,
                    songs: pages === 1 ? batch : [...prev.songs, ...batch],
                    hasMore: data.length > PAGE,
                }));
            })
            .catch((err) => console.error("Error al cargar el ranking acústico:", err));
        return () => { cancelled = true; };
    }, [pages, startAfter]);

    return (

        <section id={id} className="acoustic-ranking">

            <div className="acoustic-ranking-head">
                <h2>Ranking acústico</h2>
                <p>
                    Las que siguen al Top {startAfter}. Cuanto más cerca de 1, menos producción
                    electrónica y más instrumentos y voces naturales.
                </p>
            </div>

            <ol className="acoustic-ranking-list" start={startAfter + 1}>
                {result.songs.map((song, i) => (
                    <li key={song.id}>
                        <Link to={`/cancion/${song.id}`} className="acoustic-rank-item">
                            <span className="acoustic-rank-number" aria-hidden="true">
                                {startAfter + i + 1}
                            </span>
                            <SongCover trackId={song.track_id} genre={song.genres[0]} className="acoustic-rank-cover" />
                            <span className="acoustic-rank-text">
                                <span className="acoustic-rank-title">{song.title}</span>
                                <span className="acoustic-rank-artist">{song.artist}</span>
                            </span>
                            <span className="acoustic-rank-value" title="Acousticness">
                                {song.acousticness.toFixed(3)}
                            </span>
                        </Link>
                    </li>
                ))}
            </ol>

            {result.hasMore && (
                <button
                    type="button"
                    className="acoustic-ranking-more"
                    onClick={() => setPages((p) => p + 1)}
                    disabled={loading}
                >
                    {loading ? "Cargando…" : "Mostrar más"}
                </button>
            )}

        </section>

    );

}

export default AcousticRanking;
