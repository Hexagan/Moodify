import "./AudioSlider.css";

function AudioSlider({ label, range, min, max, step, value, onChange, required }) {

    return (

        <div className="audio-slider">

            <div className="audio-slider-label">
                <span>{label} <span className="audio-slider-range">({range})</span>{required && <span className="required">*</span>}</span>
                <span className="audio-slider-value">{value}</span>
            </div>

            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
            />

        </div>

    );

}

export default AudioSlider;