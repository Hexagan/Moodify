import { useState, useEffect } from "react";
import "./SongForm.css";

import AudioSlider from "./AudioSlider";
import { PlusCircle, XCircle, PencilSquare } from "react-bootstrap-icons";

import { getGeneros } from "../../services/api";

const DURATION_REGEX = /^\d+:\d{2}$/;

function buildInitialState(song) {
    if (!song) {
        return {
            title:"", artist:"", genre:"", duration:"", notes:"",
            popularity:50, valence:0.5, energy:0.5, danceability:0.5, acousticness:0.5,
            loudness:"", tempo:"", explicit:false
        };
    }
    return {
        title: song.title || "",
        artist: song.artist || "",
        genre: song.genre || "",
        duration: song.duration || "",
        notes: "",
        popularity: song.popularity ?? 50,
        valence: song.valence ?? 0.5,
        energy: song.energy ?? 0.5,
        danceability: song.danceability ?? 0.5,
        acousticness: song.acousticness ?? 0.5,
        loudness: song.loudness ?? "",
        tempo: song.tempo ?? "",
        explicit: song.explicit ?? false
    };
}

function SongForm({ mode = "create", initialSong = null, onSubmit, onCancel }) {

    const [form, setForm] = useState(buildInitialState(initialSong));
    const [genres, setGenres] = useState([]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        getGeneros().then(setGenres).catch((err) => console.error("Error al cargar géneros:", err));
    }, []);

    useEffect(() => {
        setForm(buildInitialState(initialSong));
        setErrors({});
    }, [initialSong]);

    function update(field, value) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    function validate() {
        const newErrors = {};

        if (!form.title.trim()) newErrors.title = "El título es obligatorio.";
        if (!form.artist.trim()) newErrors.artist = "El artista es obligatorio.";
        if (!form.genre) newErrors.genre = "Selecciona un género.";

        if (!form.duration.trim()) {
            newErrors.duration = "La duración es obligatoria.";
        } else if (!DURATION_REGEX.test(form.duration.trim())) {
            newErrors.duration = "Formato esperado: m:ss (ej: 3:20).";
        }

        if (form.loudness !== "" && isNaN(Number(form.loudness))) {
            newErrors.loudness = "Debe ser un número (ej: -7.4).";
        } else if (form.loudness !== "" && Number(form.loudness) > 0) {
            newErrors.loudness = "El loudness debe ser un valor negativo (ej: -7.4).";
}

        if (form.tempo !== "" && (isNaN(Number(form.tempo)) || Number(form.tempo) <= 0)) {
            newErrors.tempo = "Debe ser un número positivo.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    function durationToMs(duration) {
        const [min, sec] = duration.split(":").map(Number);
        return (min * 60 + sec) * 1000;
    }

    function handleSubmit() {

        if (!validate()) return;

        const payload = {
            track_id: initialSong?.track_id || `manual-${Date.now()}`,
            track_name: form.title.trim(),
            artists: form.artist.trim(),
            album_name: form.title.trim(),
            track_genre: form.genre,
            popularity: Number(form.popularity),
            duration_ms: durationToMs(form.duration.trim()),
            explicit: form.explicit,
            danceability: Number(form.danceability),
            energy: Number(form.energy),
            loudness: form.loudness === "" ? 0 : Number(form.loudness),
            acousticness: Number(form.acousticness),
            valence: Number(form.valence)
        };

        onSubmit(payload);

    }

    return (

        <div className="song-form">

            <div className="form-column">

                <h4>Datos de la canción</h4>

                <label>Título<span className="required">*</span></label>
                <input
                    placeholder="Ej: Bohemian Rhapsody"
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                />
                {errors.title && <span className="field-error">{errors.title}</span>}

                <label>Artista<span className="required">*</span></label>
                <input
                    placeholder="Ej: Queen"
                    value={form.artist}
                    onChange={(e) => update("artist", e.target.value)}
                />
                {errors.artist && <span className="field-error">{errors.artist}</span>}

                <div className="form-row">

                    <div className="form-field">
                        <label>Género<span className="required">*</span></label>
                        <select value={form.genre} onChange={(e) => update("genre", e.target.value)}>
                            <option value="">Seleccionar</option>
                            {genres.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                        {errors.genre && <span className="field-error">{errors.genre}</span>}
                    </div>

                    <div className="form-field">
                        <label>Duración<span className="required">*</span></label>
                        <input
                            placeholder="Ej: 2:35"
                            value={form.duration}
                            onChange={(e) => update("duration", e.target.value)}
                        />
                        {errors.duration && <span className="field-error">{errors.duration}</span>}
                    </div>

                </div>

                <label>Observaciones {mode === "create" ? "" : "(opcional)"}</label>
                <textarea
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                />

            </div>

            <div className="form-column">

                <h4>Atributos de audio</h4>

                <AudioSlider label="Popularidad" range="0-100" min={0} max={100} step={1} value={form.popularity} onChange={(v) => update("popularity", v)} required />
                <AudioSlider label="Valencia emocional" range="0.0-1.0" min={0} max={1} step={0.01} value={form.valence} onChange={(v) => update("valence", v)} required />
                <AudioSlider label="Energía" range="0.0-1.0" min={0} max={1} step={0.01} value={form.energy} onChange={(v) => update("energy", v)} required />
                <AudioSlider label="Danzabilidad" range="0.0-1.0" min={0} max={1} step={0.01} value={form.danceability} onChange={(v) => update("danceability", v)} required />
                <AudioSlider label="Acusticidad" range="0.0-1.0" min={0} max={1} step={0.01} value={form.acousticness} onChange={(v) => update("acousticness", v)} required />

                <div className="form-row">

                    <div className="form-field">
                        <label>Loudness (dB)</label>
                        <input
                            placeholder="Ej: -7.4"
                            value={form.loudness}
                            onChange={(e) => update("loudness", e.target.value)}
                        />
                        {errors.loudness && <span className="field-error">{errors.loudness}</span>}
                    </div>

                    <div className="form-field">
                        <label>Tempo (BPM)</label>
                        <input
                            placeholder="Ej: 128"
                            value={form.tempo}
                            onChange={(e) => update("tempo", e.target.value)}
                        />
                        {errors.tempo && <span className="field-error">{errors.tempo}</span>}
                    </div>

                    <div className="form-field explicit-field">
                        <label>Explícito</label>
                        <button
                            className={`toggle ${form.explicit ? "on" : "off"}`}
                            onClick={() => update("explicit", !form.explicit)}
                            type="button"
                        >
                            <span className="toggle-dot" />
                        </button>
                        <span className="toggle-label">{form.explicit ? "Sí" : "No"}</span>
                    </div>

                </div>

            </div>

            <div className="form-actions">

                <button className="submit-btn" onClick={handleSubmit}>
                    {mode === "create" ? <PlusCircle /> : <PencilSquare />}
                    {mode === "create" ? "Agregar canción" : "Guardar cambios"}
                </button>

                <button className="cancel-btn" onClick={onCancel}>
                    <XCircle /> Cancelar
                </button>

            </div>

        </div>

    );

}

export default SongForm;