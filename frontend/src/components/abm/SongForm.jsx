import { useState, useEffect } from "react";
import "./SongForm.css";

import AudioSlider from "./AudioSlider";
import AutofillSearch from "./AutofillSearch";
import SongMediaFields from "./SongMediaFields";
import { PlusCircle, XCircle, PencilSquare } from "react-bootstrap-icons";

import { getGeneros, getSongMediaAdmin } from "../../services/api";
import { isSpotifyId } from "../../utils/spotify";
import { EMPTY_MEDIA } from "../../utils/songMedia";

const DURATION_REGEX = /^\d+:\d{2}$/;
// A bare track ID, an open.spotify.com/track/... link (with or without /intl-xx/) or a spotify:track: URI.
const SPOTIFY_REF = /^(?:https?:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?track\/|spotify:track:)?([A-Za-z0-9]{22})(?:[/?#].*)?$/;

const SOURCE_NAMES = { itunes: "Apple Music", deezer: "Deezer", spotify: "Spotify" };

function parseSpotifyRef(value) {
    return value.trim().match(SPOTIFY_REF)?.[1] ?? null;
}

function msToDuration(ms) {
    const total = Math.round(ms / 1000);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

// Store genres ("Hip-Hop/Rap", "Singer/Songwriter") mapped onto the dataset's slugs when one fits.
function matchGenre(raw, genres) {
    if (!raw) return null;
    const lower = raw.toLowerCase().trim();
    const candidates = [lower, lower.replace(/\s*\/\s*/g, "-"), ...lower.split(/[/&,]/)];
    return candidates.map((c) => c.trim().replace(/\s+/g, "-")).find((c) => genres.includes(c)) ?? null;
}

function buildInitialState(song) {
    if (!song) {
        return {
            title:"", artist:"", album:"", spotify:"", genre:"", duration:"", notes:"",
            popularity:50, valence:0.5, energy:0.5, danceability:0.5, acousticness:0.5,
            loudness:"", tempo:"", explicit:false
        };
    }
    return {
        title: song.title || "",
        artist: song.artist || "",
        album: song.album || "",
        spotify: isSpotifyId(song.track_id) ? song.track_id : "",
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

// Parents remount the form (key) for each song, so state is only ever initialised here.
function SongForm({ mode = "create", initialSong = null, adminUid, onSubmit, onCancel, submitting = false }) {

    const [form, setForm] = useState(() => buildInitialState(initialSong));
    const [media, setMedia] = useState(EMPTY_MEDIA);
    const [existingMedia, setExistingMedia] = useState(null);
    const [genres, setGenres] = useState([]);
    const [errors, setErrors] = useState({});
    const [autofillNote, setAutofillNote] = useState(null);

    useEffect(() => {
        getGeneros().then(setGenres).catch((err) => console.error("Error al cargar géneros:", err));
    }, []);

    const existingTrackId = initialSong?.track_id;
    useEffect(() => {
        if (!existingTrackId) return;
        getSongMediaAdmin(existingTrackId).then(setExistingMedia).catch(() => {});
    }, [existingTrackId]);

    function update(field, value) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    function updateMedia(patch) {
        setMedia((prev) => ({ ...prev, ...patch }));
    }

    function applyAutofill(item) {
        // A YouTube result only says which video to play: its title is the video's, not the song's.
        if (item.source === "youtube") {
            updateMedia({ youtube: item.youtube_id, removeYoutube: false });
            setAutofillNote("Video de YouTube cargado. Revisalo abajo, en Portada, preview y YouTube.");
            return;
        }
        const genre = matchGenre(item.genre, genres);
        setForm((prev) => ({
            ...prev,
            title: item.title || prev.title,
            artist: item.artist || prev.artist,
            album: item.album || prev.album,
            duration: item.duration_ms ? msToDuration(item.duration_ms) : prev.duration,
            explicit: item.explicit ?? prev.explicit,
            popularity: item.popularity ?? prev.popularity,
            spotify: item.spotify_id || prev.spotify,
            genre: genre || prev.genre,
        }));
        updateMedia({
            ...(item.cover_url ? { coverUrl: item.cover_url, coverFile: null, removeCover: false } : {}),
            ...(item.preview_url ? { previewUrl: item.preview_url, previewFile: null, removePreview: false } : {}),
        });
        const missing = [!genre && "el género", "los atributos de audio"].filter(Boolean).join(" y ");
        setAutofillNote(`Datos cargados desde ${SOURCE_NAMES[item.source]}. Completá ${missing} a mano.`);
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

        if (form.spotify.trim() && !parseSpotifyRef(form.spotify)) {
            newErrors.spotify = "Pegá un enlace de canción de Spotify o su ID de 22 caracteres.";
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
            track_id: parseSpotifyRef(form.spotify) || initialSong?.track_id || `manual-${Date.now()}`,
            track_name: form.title.trim(),
            artists: form.artist.trim(),
            album_name: form.album.trim() || form.title.trim(),
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

        onSubmit(payload, media);

    }

    return (

        <div className="song-form">

            <div className="form-column form-wide">
                <AutofillSearch
                    adminUid={adminUid}
                    defaultQuery={initialSong ? `${initialSong.artist?.split(";")[0] ?? ""} ${initialSong.title ?? ""}`.trim() : ""}
                    onPick={applyAutofill}
                />
                {autofillNote && <p className="autofill-note" role="status">{autofillNote}</p>}
            </div>

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

                <label>Álbum</label>
                <input
                    placeholder="Ej: A Night at the Opera"
                    value={form.album}
                    onChange={(e) => update("album", e.target.value)}
                />

                <label>Enlace o ID de Spotify</label>
                <input
                    placeholder="https://open.spotify.com/track/…"
                    value={form.spotify}
                    onChange={(e) => update("spotify", e.target.value)}
                />
                {errors.spotify
                    ? <span className="field-error">{errors.spotify}</span>
                    : <span className="field-hint">Opcional. Habilita el reproductor de Spotify y su portada.</span>}

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

            <div className="form-column form-wide">
                <SongMediaFields media={media} existing={existingMedia} onChange={updateMedia} />
            </div>

            <div className="form-actions">

                <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>
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