import { useState } from "react";
import "./EliminarCancion.css";

import SongSearchSelect from "./SongSearchSelect";
import { Trash, XCircle, ExclamationTriangle } from "react-bootstrap-icons";

import { eliminarCancion } from "../../services/api";

const MOTIVOS = ["Duplicada", "Datos incorrectos", "Fuera de alcance del estudio", "Otro"];

function EliminarCancion() {

    const [selectedSong, setSelectedSong] = useState(null);
    const [motivo, setMotivo] = useState("");
    const [confirmed, setConfirmed] = useState(false);
    const [feedback, setFeedback] = useState(null);

    async function handleDelete() {

        if (!confirmed) {
            setFeedback({ type:"error", text:"Debes confirmar la eliminación antes de continuar." });
            return;
        }

        try {
            await eliminarCancion(selectedSong.id);
            setFeedback({ type:"success", text:"Canción eliminada correctamente." });
            setSelectedSong(null);
            setConfirmed(false);
            setMotivo("");
        } catch (err) {
            console.error("Error al eliminar canción:", err);
            setFeedback({ type:"error", text:"Ocurrió un error al eliminar la canción." });
        }
    }

    return (
        <div>

            <SongSearchSelect
                selectedSong={selectedSong}
                onSelect={(song) => { setSelectedSong(song); setFeedback(null); setConfirmed(false); }}
                variant="red"
            />

            {feedback && <div className={`abm-feedback ${feedback.type}`}>{feedback.text}</div>}

            {selectedSong && (

                <div className="delete-panel">

                    <h4>Eliminar canción</h4>

                    <div className="delete-warning">
                        <strong><ExclamationTriangle /> Acción irreversible</strong>
                        <p>Una vez eliminada, la canción no podrá recuperarse. Todos los experimentos y registros bio-emocionales asociados también serán afectados.</p>
                    </div>

                    <div className="delete-row">

                        <div className="motivo-field">
                            <label>Motivo de baja (opcional)</label>
                            <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                                <option value="">Seleccionar motivo</option>
                                {MOTIVOS.map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        <label className="confirm-checkbox">
                            <input
                                type="checkbox"
                                checked={confirmed}
                                onChange={(e) => setConfirmed(e.target.checked)}
                            />
                            Confirmo que quiero eliminar esta canción del catálogo de manera permanente.
                        </label>

                    </div>

                    <div className="delete-actions">
                        <button className="delete-btn" onClick={handleDelete}>
                            <Trash /> Confirmar eliminación
                        </button>
                        <button className="cancel-btn" onClick={() => { setSelectedSong(null); setConfirmed(false); }}>
                            <XCircle /> Cancelar
                        </button>
                    </div>

                </div>

            )}

        </div>
    );

}

export default EliminarCancion;