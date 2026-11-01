import { useState, useEffect } from "react";
import "./AutofillSearch.css";

import { Apple, Disc, Spotify, Youtube, Search, Magic, MusicNoteBeamed } from "react-bootstrap-icons";

import { getAutofillSources, searchAutofill } from "../../services/api";

const SOURCES = [
    { key: "itunes", label: "Apple Music", Icon: Apple, fills: "título, artista, álbum, duración, género, portada y preview" },
    { key: "deezer", label: "Deezer", Icon: Disc, fills: "título, artista, álbum, duración y portada" },
    { key: "spotify", label: "Spotify", Icon: Spotify, fills: "ID de Spotify, título, artistas, álbum, duración, popularidad y portada" },
    { key: "youtube", label: "YouTube", Icon: Youtube, fills: "el video de YouTube Music para la reproducción completa" },
];

function formatMs(ms) {
    if (!ms) return null;
    const total = Math.round(ms / 1000);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

// Searching is explicit (Enter or the button), never per keystroke: the YouTube source spends
// shared API quota on every request.
function AutofillSearch({ adminUid, defaultQuery = "", onPick }) {

    const [available, setAvailable] = useState({ itunes: true, deezer: true, spotify: false, youtube: false });
    const [source, setSource] = useState("itunes");
    const [query, setQuery] = useState(defaultQuery);
    const [result, setResult] = useState({ key: null, items: [], error: null });
    const [pending, setPending] = useState(null);
    const [picked, setPicked] = useState(null);

    useEffect(() => {
        getAutofillSources().then(setAvailable).catch(() => {});
    }, []);

    const current = SOURCES.find((s) => s.key === source);
    const shown = result.key === source ? result : { items: [], error: null };

    async function runSearch(e) {
        e?.preventDefault();
        const q = query.trim();
        if (q.length < 2) return;
        const key = `${source}|${q}`;
        setPending(key);
        setPicked(null);
        try {
            const items = await searchAutofill(q, source, adminUid);
            setResult({ key: source, items, error: items.length ? null : "Sin resultados para esa búsqueda." });
        } catch (err) {
            setResult({ key: source, items: [], error: err.message });
        } finally {
            setPending((p) => (p === key ? null : p));
        }
    }

    function pick(item, index) {
        setPicked(`${source}-${index}`);
        onPick(item);
    }

    return (

        <div className="autofill">

            <div className="autofill-head">
                <Magic aria-hidden="true" />
                <div>
                    <h4>Autocompletar desde un servicio</h4>
                    <p>Buscá la canción y elegí un resultado: completa {current.fills}. Los atributos de audio se cargan a mano.</p>
                </div>
            </div>

            <div className="autofill-sources" role="radiogroup" aria-label="Servicio de búsqueda">
                {SOURCES.map(({ key, label, Icon }) => (
                    <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={source === key}
                        disabled={!available[key]}
                        title={available[key] ? label : `${label}: falta configurar la clave de API en el servidor`}
                        onClick={() => setSource(key)}
                    >
                        <Icon aria-hidden="true" /> {label}
                    </button>
                ))}
            </div>

            <form className="autofill-search" onSubmit={runSearch}>
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Artista y título, ej: Norah Jones Don't Know Why"
                    aria-label="Buscar canción"
                />
                <button type="submit" disabled={pending !== null || query.trim().length < 2}>
                    <Search aria-hidden="true" /> {pending ? "Buscando…" : "Buscar"}
                </button>
            </form>

            {shown.error && <p className="autofill-error" role="status">{shown.error}</p>}

            {shown.items.length > 0 && (
                <ul className="autofill-results">
                    {shown.items.map((item, i) => (
                        <li key={`${item.title}-${i}`}>
                            <button
                                type="button"
                                className={`autofill-result ${picked === `${source}-${i}` ? "picked" : ""}`}
                                onClick={() => pick(item, i)}
                            >
                                <span className="autofill-cover">
                                    {item.cover_url
                                        ? <img src={item.cover_url} alt="" loading="lazy" />
                                        : <MusicNoteBeamed aria-hidden="true" />}
                                </span>
                                <span className="autofill-text">
                                    <strong>{item.title}</strong>
                                    <span>{[item.artist, item.album].filter(Boolean).join(" · ")}</span>
                                </span>
                                <span className="autofill-meta">
                                    {formatMs(item.duration_ms)}
                                    {item.explicit && <em title="Explícita">E</em>}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

        </div>

    );

}

export default AutofillSearch;
