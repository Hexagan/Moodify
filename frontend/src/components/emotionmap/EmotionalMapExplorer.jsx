import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./EmotionalMap.css";

import { getSongsByQuadrant } from "../../services/api";
import { mapCancion } from "../../utils/mapCancion";

const QUADRANTS = {
    intensa: {
        label: "Intensa",
        color: "#7a2b2b",
        textColor: "#ffb3b3",
        range: { minV: 0, maxV: 0.4, minE: 0.6, maxE: 1 },
        center: { x: 20, y: 80 },
        emotions: [
            { key: "tenso", label: "Tenso", pos: { x: 25, y: 75 } },
            { key: "agresivo", label: "Agresivo", pos: { x: 10, y: 90 } },
            { key: "ansioso", label: "Ansioso", pos: { x: 15, y: 65 } },
            { key: "desafiante", label: "Desafiante", pos: { x: 35, y: 85 } },
        ],
    },
    energetica: {
        label: "Energética",
        color: "#7a7a2b",
        textColor: "#f0e8a0",
        range: { minV: 0.6, maxV: 1, minE: 0.6, maxE: 1 },
        center: { x: 80, y: 80 },
        emotions: [
            { key: "euforico", label: "Eufórico", pos: { x: 90, y: 90 } },
            { key: "feliz", label: "Feliz", pos: { x: 75, y: 70 } },
            { key: "motivado", label: "Motivado", pos: { x: 70, y: 85 } },
            { key: "emocionado", label: "Emocionado", pos: { x: 85, y: 75 } },
        ],
    },
    relajante: {
        label: "Relajante",
        color: "#1f6b56",
        textColor: "#9be8d0",
        range: { minV: 0, maxV: 0.4, minE: 0, maxE: 0.4 },
        center: { x: 20, y: 20 },
        emotions: [
            { key: "tranquilo", label: "Tranquilo", pos: { x: 30, y: 15 } },
            { key: "meditativo", label: "Meditativo", pos: { x: 15, y: 10 } },
            { key: "sombrio", label: "Sombrío", pos: { x: 10, y: 30 } },
            { key: "nostalgico", label: "Nostálgico", pos: { x: 25, y: 25 } },
        ],
    },
    melancolica: {
        label: "Melancólica",
        color: "#23437a",
        textColor: "#a9c8f5",
        range: { minV: 0.6, maxV: 1, minE: 0, maxE: 0.4 },
        center: { x: 80, y: 20 },
        emotions: [
            { key: "sereno", label: "Sereno", pos: { x: 70, y: 15 } },
            { key: "contemplativo", label: "Contemplativo", pos: { x: 65, y: 25 } },
            { key: "romantico", label: "Romántico", pos: { x: 90, y: 20 } },
            { key: "sonador", label: "Soñador", pos: { x: 80, y: 10 } },
        ],
    },
};

function quadrantFromPoint(x, y) {
    if (x < 50 && y >= 50) return "intensa";
    if (x >= 50 && y >= 50) return "energetica";
    if (x < 50 && y < 50) return "relajante";
    return "melancolica";
}

function EmotionalMapExplorer() {

    const navigate = useNavigate();
    const gridRef = useRef(null);

    const [activeQuadrant, setActiveQuadrant] = useState(null);
    const [activeEmotion, setActiveEmotion] = useState(null);
    const [point, setPoint] = useState(null);
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(false);

    async function fetchSongs(key, newPoint) {
        setLoading(true);
        try {
            const data = await getSongsByQuadrant(key, newPoint.x / 100, newPoint.y / 100);
            setSongs(data.map(mapCancion));
        } catch (err) {
            console.error("Error al buscar canciones del cuadrante:", err);
            setSongs([]);
        } finally {
            setLoading(false);
        }
    }

    function selectQuadrant(key, newPoint) {
        setActiveQuadrant(key);
        setActiveEmotion(null);
        setPoint(newPoint);
        fetchSongs(key, newPoint);
    }

    function selectEmotion(emotion) {
        setActiveEmotion(emotion.key);
        setPoint(emotion.pos);
        fetchSongs(activeQuadrant, emotion.pos);
    }

    function handleGridClick(e) {
        const rect = gridRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = 100 - ((e.clientY - rect.top) / rect.height) * 100;
        const quadrantKey = quadrantFromPoint(x, y);
        selectQuadrant(quadrantKey, { x, y });
    }

    const quadrant = activeQuadrant ? QUADRANTS[activeQuadrant] : null;
    const bottomButtons = quadrant
        ? quadrant.emotions.map((e) => ({ ...e, color: quadrant.color, textColor: quadrant.textColor }))
        : Object.entries(QUADRANTS).map(([key, q]) => ({ key, label: q.label, pos: q.center, color: q.color, textColor: q.textColor }));

    return (

            <div className="mapa-emocional-page">

                <div className="mapa-emocional-graph-card">

                    <div className="mapa-emocional-grid" ref={gridRef} onClick={handleGridClick}>

                        <span className="axis-label axis-energy">↑ Energía</span>
                        <span className="axis-label axis-valence">Valencia →</span>

                        {Object.entries(QUADRANTS).map(([key, q]) => (
                            <div
                                key={key}
                                className={`quadrant-cell quadrant-${key} ${activeQuadrant === key ? "active" : ""}`}
                                style={{ background: q.color }}
                            >
                                <span className="quadrant-title" style={{ color: q.textColor }}>{q.label}</span>
                                <span className="quadrant-subtitle">{q.emotions.map(e => e.label).join(" · ")}</span>
                            </div>
                        ))}

                        {point && (
                            <div
                                className="mapa-point"
                                style={{ left: `${point.x}%`, top: `${100 - point.y}%` }}
                            />
                        )}

                    </div>

                    <div className="mapa-emocional-buttons">
                        {bottomButtons.map((btn) => {
                            const isActive = activeEmotion === btn.key || (!quadrant && activeQuadrant === btn.key);
                            return (
                                <button
                                    key={btn.key}
                                    className="mapa-emotion-btn"
                                    style={isActive
                                        ? { background: btn.color, color: btn.textColor, borderColor: btn.color }
                                        : undefined
                                    }
                                    onClick={() => (quadrant ? selectEmotion(btn) : selectQuadrant(btn.key, btn.pos))}
                                >
                                    {btn.label}
                                </button>
                            );
                        })}
                    </div>

                    {quadrant && (
                        <p className="mapa-range-text">
                            Valencia: {quadrant.range.minV.toFixed(1)}-{quadrant.range.maxV.toFixed(1)} · Energía: {quadrant.range.minE.toFixed(1)}-{quadrant.range.maxE.toFixed(1)}
                        </p>
                    )}

                </div>

                <div className="mapa-emocional-sidebar">

                    <div className="mapa-quadrant-label">
                        {quadrant ? `Cuadrante: ${quadrant.label}` : "Elegí un punto del mapa"}
                    </div>

                    <div className="mapa-suggestions-card">

                        <h4>Canciones sugeridas</h4>

                        {loading && <p className="mapa-empty-text">Buscando...</p>}

                        {!loading && quadrant && songs.length === 0 && (
                            <p className="mapa-empty-text">No se encontraron canciones para este cuadrante.</p>
                        )}

                        {!loading && !quadrant && (
                            <p className="mapa-empty-text">Hacé clic en el mapa o en una emoción para ver sugerencias.</p>
                        )}

                        <div className="mapa-suggestions-list">
                            {!loading && songs.map((song) => (
                                <div
                                    key={song.id}
                                    className="mapa-suggestion-row"
                                    onClick={() => navigate(`/cancion/${song.id}`)}
                                >
                                    <span className="mapa-suggestion-dot" style={{ background: quadrant.color }} />
                                    <div className="mapa-suggestion-info">
                                        <span className="mapa-suggestion-title" title={song.title}>{song.title}</span>
                                        <span className="mapa-suggestion-artist" title={song.artist}>{song.artist}</span>
                                    </div>
                                    <div className="mapa-suggestion-values">
                                        <span>v {song.valence.toFixed(2)}</span>
                                        <span>e {song.energy.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>

                </div>

            </div>

    );

}

export default EmotionalMapExplorer;
