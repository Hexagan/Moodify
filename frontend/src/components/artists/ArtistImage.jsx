import { useEffect, useRef, useState } from "react";
import { getArtistPicture } from "../../services/api";
import "./ArtistImage.css";

function hueFor(name) {
    let hash = 0;
    for (const ch of name || "") hash = ch.charCodeAt(0) + ((hash << 5) - hash);
    return Math.abs(hash) % 360;
}

function initials(name) {
    return (name || "?").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function ArtistImage({ artist, className = "" }) {

    // Tagged with the artist id so a reused component never shows a previous artist's photo.
    const [fetched, setFetched] = useState({ id: null, url: null });
    const [failedSrc, setFailedSrc] = useState(null);
    const ref = useRef(null);

    const src = artist.picture_url || (fetched.id === artist.id ? fetched.url : null);

    // Photos are looked up on Deezer the first time an artist is seen; only do that once the
    // card is near the viewport, so a fresh grid doesn't fire dozens of lookups at once.
    useEffect(() => {
        if (src || artist.picture_checked || !ref.current) return;
        let cancelled = false;
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            observer.disconnect();
            getArtistPicture(artist.id)
                .then((url) => { if (!cancelled && url) setFetched({ id: artist.id, url }); })
                .catch(() => {});
        }, { rootMargin: "200px" });
        observer.observe(ref.current);
        return () => {
            cancelled = true;
            observer.disconnect();
        };
    }, [artist.id, artist.picture_checked, src]);

    return (
        <div ref={ref} className={`artist-image ${className}`} style={{ "--hue": hueFor(artist.name) }}>
            {src && src !== failedSrc
                ? <img src={src} alt="" loading="lazy" onError={() => setFailedSrc(src)} />
                : <span className="artist-image-initials" aria-hidden="true">{initials(artist.name)}</span>
            }
        </div>
    );

}

export default ArtistImage;
