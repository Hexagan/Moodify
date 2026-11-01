import { useState } from "react";
import { VISIBILITY } from "../../utils/playlists";
import "./Playlists.css";

// Used for creating (from the dashboard or straight from a song) and editing a playlist.
function PlaylistForm({ initial, onSubmit, onCancel, submitLabel = "Crear playlist", busy = false, compact = false }) {

    const [name, setName] = useState(initial?.name ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");
    const [visibility, setVisibility] = useState(initial?.visibility ?? "private");
    const [error, setError] = useState(null);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!name.trim()) {
            setError("Ponele un nombre.");
            return;
        }
        setError(null);
        try {
            await onSubmit({ name: name.trim(), description: description.trim() || null, visibility });
        } catch (err) {
            setError(err.message);
        }
    }

    return (

        <form className={`playlist-form ${compact ? "compact" : ""}`} onSubmit={handleSubmit}>

            <label className="playlist-form-field">
                <span>Nombre</span>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                    placeholder="Ej: Para estudiar"
                    autoFocus
                />
            </label>

            {!compact && (
                <label className="playlist-form-field">
                    <span>Descripción <em>(opcional)</em></span>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={500}
                        rows={3}
                    />
                </label>
            )}

            <fieldset className="playlist-form-visibility">
                <legend>Quién puede verla</legend>
                {Object.entries(VISIBILITY).map(([key, { label, hint, Icon }]) => (
                    <label key={key} className={visibility === key ? "selected" : ""}>
                        <input
                            type="radio"
                            name="playlist-visibility"
                            value={key}
                            checked={visibility === key}
                            onChange={() => setVisibility(key)}
                        />
                        <Icon aria-hidden="true" />
                        <span>
                            <strong>{label}</strong>
                            {!compact && <small>{hint}</small>}
                        </span>
                    </label>
                ))}
            </fieldset>

            {error && <p className="playlist-form-error" role="alert">{error}</p>}

            <div className="playlist-form-actions">
                {onCancel && <button type="button" className="pl-btn ghost" onClick={onCancel}>Cancelar</button>}
                <button type="submit" className="pl-btn primary" disabled={busy}>{busy ? "Guardando…" : submitLabel}</button>
            </div>

        </form>

    );

}

export default PlaylistForm;
