import { Link } from "react-router-dom";
import PlaylistCover from "./PlaylistCover";
import VisibilityBadge from "./VisibilityBadge";
import "./Playlists.css";

function PlaylistCard({ playlist, showVisibility = true }) {
    return (
        <Link to={`/playlist/${playlist.id}`} className="playlist-card">
            <PlaylistCover covers={playlist.covers} className="playlist-card-cover" />
            <span className="playlist-card-name">{playlist.name}</span>
            <span className="playlist-card-meta">
                {playlist.song_count} {playlist.song_count === 1 ? "canción" : "canciones"}
                {showVisibility && <VisibilityBadge visibility={playlist.visibility} />}
            </span>
        </Link>
    );
}

export default PlaylistCard;
