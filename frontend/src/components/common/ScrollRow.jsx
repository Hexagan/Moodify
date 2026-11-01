import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import "./ScrollRow.css";

// Always a single row: overflow scrolls sideways (wheel, touch, keyboard or the arrows),
// it never wraps onto a second line.
function ScrollRow({ children, label, itemWidth = 180 }) {

    const trackRef = useRef(null);
    const [edges, setEdges] = useState({ start: true, end: true });

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;
        function measure() {
            const max = track.scrollWidth - track.clientWidth;
            setEdges({ start: track.scrollLeft <= 2, end: track.scrollLeft >= max - 2 });
        }
        const observer = new ResizeObserver(measure);
        observer.observe(track);
        for (const child of track.children) observer.observe(child);
        track.addEventListener("scroll", measure, { passive: true });
        return () => {
            observer.disconnect();
            track.removeEventListener("scroll", measure);
        };
    }, [children]);

    function scrollBy(direction) {
        const track = trackRef.current;
        track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: "smooth" });
    }

    return (
        <div className="scroll-row" style={{ "--scroll-item": `${itemWidth}px` }}>
            {!edges.start && (
                <button type="button" className="scroll-row-arrow prev" onClick={() => scrollBy(-1)} aria-label="Ver anteriores">
                    <ChevronLeft />
                </button>
            )}
            <div ref={trackRef} className="scroll-row-track" role="group" aria-label={label} tabIndex={0}>
                {children}
            </div>
            {!edges.end && (
                <button type="button" className="scroll-row-arrow next" onClick={() => scrollBy(1)} aria-label="Ver más">
                    <ChevronRight />
                </button>
            )}
        </div>
    );

}

export default ScrollRow;
