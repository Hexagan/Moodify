import { useState } from "react";
import SongForm from "./SongForm";
import { crearCancion } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { saveSongMedia } from "../../utils/songMedia";

function NuevaCancion() {

    const { user } = useAuth();
    const [feedback, setFeedback] = useState(null);
    const [formKey, setFormKey] = useState(0);
    const [saving, setSaving] = useState(false);

    async function handleSubmit(payload, media) {
        setSaving(true);
        try {
            const song = await crearCancion(payload);
            try {
                await saveSongMedia(song.track_id, user.uid, media);
                setFeedback({ type:"success", text:"Canción agregada correctamente." });
            } catch (err) {
                setFeedback({ type:"error", text:`La canción se agregó, pero no se pudo guardar la portada, la preview o el video: ${err.message}` });
            }
            setFormKey((k) => k + 1);
        } catch (err) {
            console.error("Error al crear canción:", err);
            setFeedback({ type:"error", text:"Ocurrió un error al agregar la canción." });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div>
            {feedback && <div className={`abm-feedback ${feedback.type}`}>{feedback.text}</div>}
            <SongForm
                key={formKey}
                mode="create"
                adminUid={user?.uid}
                submitting={saving}
                onSubmit={handleSubmit}
                onCancel={() => setFormKey((k) => k + 1)}
            />
        </div>
    );

}

export default NuevaCancion;
