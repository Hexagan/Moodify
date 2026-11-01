import "./GreenhouseBanner.css";
import { ArrowDown } from "react-bootstrap-icons";

const PLANTS = [
    { x: 212, h: 46, pot: "#b5643c" },
    { x: 256, h: 66, pot: "#c9784b" },
    { x: 300, h: 84, pot: "#b5643c" },
    { x: 344, h: 62, pot: "#c9784b" },
    { x: 388, h: 44, pot: "#b5643c" },
];

const NOTES = [
    { x: 140, y: 112, glyph: "♪", delay: "0s" },
    { x: 452, y: 100, glyph: "♫", delay: "1.2s" },
    { x: 470, y: 176, glyph: "♪", delay: "2.4s" },
    { x: 128, y: 196, glyph: "♫", delay: "3.1s" },
];

// A stem with alternating leaves; taller plants get more leaf pairs.
function Plant({ x, h, pot }) {
    const base = 236;
    const top = base - h;
    const leaves = [];
    for (let y = base - 14, i = 0; y > top + 6; y -= 15, i++) {
        const side = i % 2 === 0 ? -1 : 1;
        leaves.push(
            <ellipse
                key={y}
                cx={x + side * 9}
                cy={y}
                rx="10"
                ry="4.5"
                fill={i % 2 === 0 ? "#3ddc84" : "#2bb673"}
                transform={`rotate(${side * -28} ${x + side * 9} ${y})`}
            />
        );
    }
    return (
        <g>
            <line x1={x} y1={base} x2={x} y2={top} stroke="#2bb673" strokeWidth="3" strokeLinecap="round" />
            {leaves}
            <circle cx={x} cy={top} r="6" fill="#ffd166" />
            <path d={`M${x - 13} ${base} h26 l-4 18 h-18 z`} fill={pot} />
        </g>
    );
}

function GreenhouseBanner({ targetId }) {

    return (

        <div className="greenhouse-banner">

            <svg
                className="greenhouse-art"
                viewBox="0 0 600 300"
                preserveAspectRatio="xMaxYMax slice"
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id="gh-sky" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0d2a22" />
                        <stop offset="100%" stopColor="#1b4a36" />
                    </linearGradient>
                    <radialGradient id="gh-sun" cx="0.5" cy="0.5" r="0.5">
                        <stop offset="0%" stopColor="#fff2b3" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#fff2b3" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="gh-shade" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0d2a22" stopOpacity="0.95" />
                        <stop offset="55%" stopColor="#0d2a22" stopOpacity="0" />
                    </linearGradient>
                    <clipPath id="gh-glass">
                        <path d="M170 254 V150 Q300 40 430 150 V254 Z" />
                    </clipPath>
                </defs>

                <rect width="600" height="300" fill="url(#gh-sky)" />
                <circle cx="510" cy="58" r="70" fill="url(#gh-sun)" />
                <rect y="254" width="600" height="46" fill="#123322" />

                {/* The scene sits right of centre, leaving the left side for the copy. */}
                <g transform="translate(110 0)">
                    <path d="M170 254 V150 Q300 40 430 150 V254 Z" fill="rgba(180,255,220,0.10)" />
                    <g clipPath="url(#gh-glass)">
                        {PLANTS.map((p) => <Plant key={p.x} {...p} />)}
                        <g stroke="rgba(159,227,192,0.45)" strokeWidth="2">
                            {[210, 250, 290, 330, 370, 410].map((x) => (
                                <line key={x} x1={x} y1="40" x2={x} y2="254" />
                            ))}
                            <line x1="170" y1="150" x2="430" y2="150" />
                            <path d="M170 150 Q300 80 430 150" fill="none" />
                        </g>
                        <rect x="170" y="236" width="260" height="18" fill="#3b2a1e" />
                    </g>
                    <path
                        d="M170 254 V150 Q300 40 430 150 V254"
                        fill="none"
                        stroke="#9fe3c0"
                        strokeWidth="3"
                        strokeLinejoin="round"
                    />

                    {NOTES.map((n) => (
                        <text
                            key={n.x}
                            className="greenhouse-note"
                            x={n.x}
                            y={n.y}
                            style={{ animationDelay: n.delay }}
                        >
                            {n.glyph}
                        </text>
                    ))}
                </g>

                <rect width="600" height="300" fill="url(#gh-shade)" />
            </svg>

            <div className="greenhouse-copy">
                <span className="greenhouse-eyebrow">Invernadero sonoro</span>
                <h3>Música que hace crecer</h3>
                <p>
                    Guitarras, pianos y voces sin amplificar: los sonidos acústicos son los que más
                    estimulan a las plantas. Probá dejar sonando el ranking cerca de las tuyas.
                </p>
                {targetId && (
                    <a className="greenhouse-cta" href={`#${targetId}`}>
                        Ver el ranking acústico <ArrowDown aria-hidden="true" />
                    </a>
                )}
            </div>

        </div>

    );

}

export default GreenhouseBanner;
