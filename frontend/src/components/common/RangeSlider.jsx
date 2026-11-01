import "./RangeSlider.css";

// Two native range inputs stacked on one track: keyboard and screen-reader support come free,
// and each thumb is clamped so the pair can never cross.
function RangeSlider({ min, max, step, value, onChange, format = String, label }) {

    const [low, high] = value;
    const span = max - min || 1;
    const lowPct = ((low - min) / span) * 100;
    const highPct = ((high - min) / span) * 100;

    return (

        <div className="range-slider">

            <div className="range-slider-track">
                <div
                    className="range-slider-fill"
                    style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={low}
                    aria-label={`${label}: mínimo`}
                    aria-valuetext={format(low)}
                    onChange={(e) => onChange([Math.min(Number(e.target.value), high), high])}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={high}
                    aria-label={`${label}: máximo`}
                    aria-valuetext={format(high)}
                    onChange={(e) => onChange([low, Math.max(Number(e.target.value), low)])}
                />
            </div>

            <div className="range-slider-values">
                <span>{format(low)}</span>
                <span>{format(high)}</span>
            </div>

        </div>

    );

}

export default RangeSlider;
