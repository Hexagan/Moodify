import { useState, useEffect } from "react";
import SongSearchSelect from "./SongSearchSelect";
import SongForm from "./SongForm";
import { modificarCancion } from "../../services/api";

function ModificarCancion({ presetSong }) {

    const [selectedSong, setSelectedSong] = useState(null);
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        if (presetSong) {
            setSelectedSong(presetSong);
        }
    }, [presetSong]);

    async function handleSubmit(payload) {
        try {
            await modificarCancion(selectedSong.id, payload);
            setFeedback({ type:"success", text:"Canción modificada correctamente." });
        } catch (err) {
            console.error("Error al modificar canción:", err);
            setFeedback({ type:"error", text:"Ocurrió un error al modificar la canción." });
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
                    key={selectedSong.id}
                    mode="edit"
                    initialSong={selectedSong}
                    onSubmit={handleSubmit}
                    onCancel={() => setSelectedSong(null)}
                />
            )}

        </div>
    );

}

export default ModificarCancion;