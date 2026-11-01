import { useState, useEffect } from "react";
import SongSearchSelect from "./SongSearchSelect";
import SongForm from "./SongForm";
import { modificarCancion } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { mapCancion } from "../../utils/mapCancion";
import { saveSongMedia } from "../../utils/songMedia";

function ModificarCancion({ presetSong }) {

    const { user } = useAuth();
    const [selectedSong, setSelectedSong] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [saving, setSaving] = useState(false);
    // Bumped after each save so the form remounts with what was stored (including media).
    const [version, setVersion] = useState(0);

    useEffect(() => {
        if (presetSong) {
            setSelectedSong(presetSong);
        }
    }, [presetSong]);

    async function handleSubmit(payload, media) {
        setSaving(true);
        try {
            const updated = await modificarCancion(selectedSong.id, payload);
            try {
                await saveSongMedia(updated.track_id, user.uid, media);
                setFeedback({ type:"success", text:"Canción modificada correctamente." });
            } catch (err) {
                setFeedback({ type:"error", text:`Los datos se guardaron, pero no se pudo guardar la portada, la preview o el video: ${err.message}` });
            }
            setSelectedSong(mapCancion(updated));
            setVersion((v) => v + 1);
        } catch (err) {
            console.error("Error al modificar canción:", err);
            setFeedback({ type:"error", text:"Ocurrió un error al modificar la canción." });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div>

            <SongSearchSelect
                selectedSong={selectedSong}
                onSelect={(song) => { setSelectedSong(song); setFeedback(null); }}
                variant="purple"
            />

            {feedback && <div className={`abm-feedback ${feedback.type}`}>{feedback.text}</div>}

            {selectedSong && (
                <SongForm
                    key={`${selectedSong.id}-${version}`}
                    mode="edit"
                    initialSong={selectedSong}
                    adminUid={user?.uid}
                    submitting={saving}
                    onSubmit={handleSubmit}
                    onCancel={() => setSelectedSong(null)}
                />
            )}

        </div>
    );

}

export default ModificarCancion;
