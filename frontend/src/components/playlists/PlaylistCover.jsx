import { CollectionPlay } from "react-bootstrap-icons";
import SongCover from "../common/SongCover";
import "./Playlists.css";

// The four most recently added songs as a 2x2 mosaic; fewer songs fall back to the first cover.
function PlaylistCover({ covers = [], className = "" }) {
    if (covers.length === 0) {
        return (
            <div className={`playlist-mosaic empty ${className}`} aria-hidden="true">
                <CollectionPlay />
            </div>
        );
    }
    const shown = covers.length >= 4 ? covers.slice(0, 4) : covers.slice(0, 1);
    return (
        <div className={`playlist-mosaic ${shown.length === 4 ? "grid" : ""} ${className}`} aria-hidden="true">
            {shown.map((c, i) => <SongCover key={`${c.track_id}-${i}`} trackId={c.track_id} genre={c.genre} className="playlist-mosaic-tile" />)}
        </div>
    );
}

export default PlaylistCover;
