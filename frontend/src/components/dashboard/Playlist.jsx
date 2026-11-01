import { Link } from "react-router-dom";
import SongCover from "../common/SongCover";
import StatusBadge from "../catalog/SongsRow/StatusBadge";
import "./Playlist.css";

function Playlist({ title, icon, tone, total, items, meta, emptyText, action }) {
    return (
        <section className={`playlist playlist-${tone}`}>

            <header className="playlist-head">
                <div className="playlist-art" aria-hidden="true">{icon}</div>
                <div className="playlist-titles">
                    <span className="playlist-eyebrow">Playlist</span>
                    <h3>{title}</h3>
                    <span className="playlist-count">
                        {total == null ? "Cargando…" : `${total.toLocaleString("es-AR")} ${total === 1 ? "canción" : "canciones"}`}
                    </span>
                </div>
                {action}
            </header>

            {items && items.length === 0 ? (
                <p className="playlist-empty">{emptyText}</p>
            ) : (
                <ol className="playlist-rows">
                    {(items ?? []).map((song, i) => (
                        <li key={song.id}>
                            <Link to={`/cancion/${song.id}`} className="playlist-row">
                                <span className="playlist-index">{i + 1}</span>
                                <SongCover trackId={song.track_id} genre={song.genres?.[0]} className="playlist-cover" />
                                <span className="playlist-song">
                                    <span className="playlist-song-title">{song.title}</span>
                                    <span className="playlist-song-artist">{song.artist}</span>
                                </span>
                                <StatusBadge status={song.status} />
                                <span className="playlist-meta">{meta(song)}</span>
                            </Link>
                        </li>
                    ))}
                </ol>
            )}

        </section>
    );
}

export default Playlist;
