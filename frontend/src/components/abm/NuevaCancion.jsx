import { useState } from "react";
import SongForm from "./SongForm";
import { crearCancion } from "../../services/api";

function NuevaCancion() {

    const [feedback, setFeedback] = useState(null);
    const [formKey, setFormKey] = useState(0);

    async function handleSubmit(payload) {
        try {
            await crearCancion(payload);
            setFeedback({ type:"success", text:"Canción agregada correctamente." });
            setFormKey((k) => k + 1);
        } catch (err) {
            console.error("Error al crear canción:", err);
            setFeedback({ type:"error", text:"Ocurrió un error al agregar la canción." });
        }
    }

    return (
        <div>
            {feedback && <div className={`abm-feedback ${feedback.type}`}>{feedback.text}</div>}
            <SongForm
                key={formKey}
                mode="create"
                onSubmit={handleSubmit}
                onCancel={() => setFormKey((k) => k + 1)}
            />
        </div>
    );

}

export default NuevaCancion;