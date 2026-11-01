import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChatDotsFill, Search, MusicNoteBeamed, ChatQuote } from "react-bootstrap-icons";

import Layout from "../components/layout/Layout";
import ArtistImage from "../components/artists/ArtistImage";
import { getArtists, getFeaturedArtists } from "../services/api";
import { useDebounce } from "../hooks/useDebounce";
import { timeAgo } from "../utils/timeAgo";
import "./Artists.css";

const PAGE_SIZE = 24;

function FeaturedCard({ artist }) {
    return (
        <Link to={`/artistas/${artist.id}`} className="featured-card">
            <ArtistImage artist={artist} className="featured-card-image" />
            <div className="featured-card-body">
                <h3>{artist.name}</h3>
                {artist.latest_thread ? (
                    <>
                        <p className="featured-card-quote">
                            <ChatQuote aria-hidden="true" />
                            <span>{artist.latest_thread.title}</span>
                        </p>
                        <span className="featured-card-meta">
                            {artist.thread_count} {artist.thread_count === 1 ? "hilo" : "hilos"} · {timeAgo(artist.last_activity_at)}
                        </span>
                    </>
                ) : (
                    <>
                        <p className="featured-card-quote muted">Nadie abrió un hilo todavía.</p>
                        <span className="featured-card-meta">{artist.song_count} canciones en Moodify</span>
                    </>
                )}
            </div>
        </Link>
    );
}

function ArtistCard({ artist }) {
    return (
        <Link to={`/artistas/${artist.id}`} className="artist-card">
            <div className="artist-card-media">
                <ArtistImage artist={artist} className="artist-card-image" />
                {artist.thread_count > 0 && (
                    <span className="artist-card-badge" title={`${artist.thread_count} conversaciones`}>
                        <ChatDotsFill aria-hidden="true" /> {artist.thread_count}
                    </span>
                )}
            </div>
            <div className="artist-card-body">
                <h4>{artist.name}</h4>
                <span>
                    <MusicNoteBeamed aria-hidden="true" /> {artist.song_count}
                    {artist.last_activity_at && <> · activo {timeAgo(artist.last_activity_at)}</>}
                </span>
            </div>
        </Link>
    );
}

function Artists() {

    const [featured, setFeatured] = useState([]);
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounce(query.trim(), 300);
    // Tagged with the query they answer; "loading" is just "not for the current query yet".
    const [results, setResults] = useState({ query: null, items: [], total: 0, page: 1, error: null });
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        getFeaturedArtists()
            .then((data) => setFeatured(data.items))
            .catch(() => {});
    }, []);

    useEffect(() => {
        let cancelled = false;
        getArtists({ q: debouncedQuery, page: 1, pageSize: PAGE_SIZE })
            .then((data) => {
                if (!cancelled) setResults({ query: debouncedQuery, items: data.items, total: data.total, page: 1, error: null });
            })
            .catch((err) => {
                if (!cancelled) setResults({ query: debouncedQuery, items: [], total: 0, page: 1, error: err.message });
            });
        return () => { cancelled = true; };
    }, [debouncedQuery]);

    const { items, total, error } = results;
    const loading = results.query !== debouncedQuery || loadingMore;

    function loadMore() {
        const q = results.query;
        const next = results.page + 1;
        setLoadingMore(true);
        getArtists({ q, page: next, pageSize: PAGE_SIZE })
            .then((data) => {
                setResults((prev) => {
                    if (prev.query !== q) return prev;
                    const seen = new Set(prev.items.map((a) => a.id));
                    return { ...prev, items: [...prev.items, ...data.items.filter((a) => !seen.has(a.id))], page: next };
                });
            })
            .catch((err) => setResults((prev) => ({ ...prev, error: err.message })))
            .finally(() => setLoadingMore(false));
    }

    const anyDiscussed = featured.some((a) => a.thread_count > 0);
    const searching = debouncedQuery.length > 0;

    return (

        <Layout title="Artistas">

            <div className="artists-page">

                {!searching && featured.length > 0 && (
                    <section className="artists-featured" aria-labelledby="featured-title">
                        <div className="artists-section-head">
                            <h2 id="featured-title">{anyDiscussed ? "En conversación" : "Populares ahora"}</h2>
                            <p>{anyDiscussed
                                ? "Los artistas con la actividad más reciente de la comunidad."
                                : "Todavía no hay conversaciones. Elegí un artista y abrí el primer hilo."}
                            </p>
                        </div>
                        <div className="featured-grid">
                            {featured.map((artist) => <FeaturedCard key={artist.id} artist={artist} />)}
                        </div>
                    </section>
                )}

                <section className="artists-browse" aria-labelledby="browse-title">

                    <div className="artists-toolbar">
                        <div className="artists-section-head">
                            <h2 id="browse-title">{searching ? "Resultados" : "Todos los artistas"}</h2>
                            <p>{total.toLocaleString("es-AR")} {total === 1 ? "artista" : "artistas"}{!searching && " · los más comentados primero"}</p>
                        </div>
                        <label className="artists-search">
                            <Search aria-hidden="true" />
                            <input
                                type="search"
                                placeholder="Buscar artista"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                aria-label="Buscar artista"
                            />
                        </label>
                    </div>

                    {error && <p className="artists-message error" role="alert">No se pudieron cargar los artistas: {error}</p>}

                    {!loading && !error && items.length === 0 && (
                        <p className="artists-message">Ningún artista coincide con “{debouncedQuery}”.</p>
                    )}

                    <div className="artist-grid">
                        {items.map((artist) => <ArtistCard key={artist.id} artist={artist} />)}
                    </div>

                    {items.length < total && (
                        <button type="button" className="artists-more" onClick={loadMore} disabled={loading}>
                            {loading ? "Cargando…" : `Ver más artistas (${(total - items.length).toLocaleString("es-AR")} restantes)`}
                        </button>
                    )}

                </section>

            </div>

        </Layout>

    );

}

export default Artists;
