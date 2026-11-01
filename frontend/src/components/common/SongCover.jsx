import { useEffect, useRef, useState } from "react";
import { MusicNoteBeamed } from "react-bootstrap-icons";
import { getSongThumbnail } from "../../services/api";
import { getGenreColor } from "../../utils/genreColors";
import "./SongCover.css";

// Album art is looked up (and cached server-side) per song; only ask once the cover is near
// the viewport so long playlists don't fire every lookup up front.
function SongCover({ trackId, genre, className = "" }) {

    const [cover, setCover] = useState({ trackId: null, url: null });
    const ref = useRef(null);
    const url = cover.trackId === trackId ? cover.url : null;

    useEffect(() => {
        if (!trackId || url || !ref.current) return;
        let cancelled = false;
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            observer.disconnect();
            getSongThumbnail(trackId)
                .then((found) => { if (!cancelled && found) setCover({ trackId, url: found }); })
                .catch(() => {});
        }, { rootMargin: "200px" });
        observer.observe(ref.current);
        return () => {
            cancelled = true;
            observer.disconnect();
        };
    }, [trackId, url]);

    return (
        <div ref={ref} className={`song-cover ${className}`} style={{ "--cover-tint": getGenreColor(genre) }}>
            {url ? <img src={url} alt="" loading="lazy" /> : <MusicNoteBeamed aria-hidden="true" />}
        </div>
    );

}

export default SongCover;
