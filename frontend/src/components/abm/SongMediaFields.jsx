import { useEffect, useMemo } from "react";
import { Image, MusicNoteBeamed, Upload, Trash3, ArrowCounterclockwise, Youtube } from "react-bootstrap-icons";

function useObjectUrl(file) {
    const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
    useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
    return url;
}

const SOURCE_LABELS = { api: "encontrado automáticamente", manual: "cargado a mano", itunes: "Apple Music", deezer: "Deezer" };

// What's stored stays until it's replaced or removed; "Quitar" on a stored value hands it back
// to the automatic lookup (Spotify / Apple Music / Deezer) on save.
function SongMediaFields({ media, existing, onChange }) {

    const coverPreview = useObjectUrl(media.coverFile);
    const audioPreview = useObjectUrl(media.previewFile);

    const cover = coverPreview || media.coverUrl || (media.removeCover ? null : existing?.thumbnail_url);
    const coverIsNew = Boolean(media.coverFile || media.coverUrl);
    const audio = audioPreview || media.previewUrl || (media.removePreview ? null : existing?.preview_url);
    const audioIsNew = Boolean(media.previewFile || media.previewUrl);
    const storedYoutube = media.removeYoutube ? null : existing?.youtube_id;

    function pickFile(field, removeField, e) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (file) onChange({ [field]: file, [removeField]: false });
    }

    return (

        <div className="media-fields">

            <h4>Portada, preview y YouTube</h4>

            <div className="media-row">

                <div className="media-cover">
                    {cover ? <img src={cover} alt="Portada" /> : <Image aria-hidden="true" />}
                </div>

                <div className="media-controls">
                    <span className="media-label">Portada</span>
                    <span className="media-status">
                        {coverIsNew ? "Nueva, se guarda al confirmar"
                            : media.removeCover ? "Se quitará y volverá a buscarse sola"
                            : existing?.thumbnail_url ? "Guardada" : "Sin portada: se buscará automáticamente"}
                    </span>
                    <div className="media-buttons">
                        <label className="media-btn">
                            <Upload aria-hidden="true" /> Subir imagen
                            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => pickFile("coverFile", "removeCover", e)} hidden />
                        </label>
                        {coverIsNew && (
                            <button type="button" className="media-btn" onClick={() => onChange({ coverFile: null, coverUrl: null })}>
                                <ArrowCounterclockwise aria-hidden="true" /> Descartar
                            </button>
                        )}
                        {!coverIsNew && existing?.thumbnail_url && (
                            <button type="button" className="media-btn" onClick={() => onChange({ removeCover: !media.removeCover })}>
                                {media.removeCover ? <><ArrowCounterclockwise aria-hidden="true" /> Mantener</> : <><Trash3 aria-hidden="true" /> Quitar</>}
                            </button>
                        )}
                    </div>
                    <span className="media-hint">JPG, PNG o WEBP, hasta 5 MB.</span>
                </div>

            </div>

            <div className="media-row">

                <div className="media-cover media-audio-icon">
                    <MusicNoteBeamed aria-hidden="true" />
                </div>

                <div className="media-controls">
                    <span className="media-label">Preview de audio</span>
                    <span className="media-status">
                        {audioIsNew ? "Nueva, se guarda al confirmar"
                            : media.removePreview ? "Se quitará y volverá a buscarse sola"
                            : existing?.preview_url ? `Guardada (${SOURCE_LABELS[existing.preview_source] ?? existing.preview_source})`
                            : "Sin preview: se buscará en Apple Music y Deezer"}
                    </span>
                    {audio && <audio className="media-audio" src={audio} controls preload="none" />}
                    <div className="media-buttons">
                        <label className="media-btn">
                            <Upload aria-hidden="true" /> Subir audio
                            <input type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/ogg,audio/wav" onChange={(e) => pickFile("previewFile", "removePreview", e)} hidden />
                        </label>
                        {audioIsNew && (
                            <button type="button" className="media-btn" onClick={() => onChange({ previewFile: null, previewUrl: null })}>
                                <ArrowCounterclockwise aria-hidden="true" /> Descartar
                            </button>
                        )}
                        {!audioIsNew && existing?.preview_url && (
                            <button type="button" className="media-btn" onClick={() => onChange({ removePreview: !media.removePreview })}>
                                {media.removePreview ? <><ArrowCounterclockwise aria-hidden="true" /> Mantener</> : <><Trash3 aria-hidden="true" /> Quitar</>}
                            </button>
                        )}
                    </div>
                    <span className="media-hint">MP3, M4A, OGG o WAV, hasta 15 MB. En el catálogo suenan 10 s desde la mitad.</span>
                </div>

            </div>

            <label htmlFor="media-youtube">
                <Youtube aria-hidden="true" className="media-yt-icon" /> Enlace de YouTube / YouTube Music
            </label>
            <input
                id="media-youtube"
                value={media.youtube}
                onChange={(e) => onChange({ youtube: e.target.value, removeYoutube: false })}
                placeholder="https://music.youtube.com/watch?v=…"
            />
            <span className="media-hint">
                {storedYoutube ? (
                    <>
                        Actual: <a href={`https://music.youtube.com/watch?v=${storedYoutube}`} target="_blank" rel="noreferrer">{storedYoutube}</a>
                        {" "}({SOURCE_LABELS[existing.youtube_source] ?? existing.youtube_source}).{" "}
                        <button type="button" className="media-link-btn" onClick={() => onChange({ removeYoutube: true, youtube: "" })}>Quitar</button>
                    </>
                ) : media.removeYoutube ? (
                    <>
                        Se quitará el video guardado.{" "}
                        <button type="button" className="media-link-btn" onClick={() => onChange({ removeYoutube: false })}>Mantener</button>
                    </>
                ) : "Opcional. Si lo dejás vacío, se busca automáticamente la primera vez que alguien la reproduce."}
            </span>

        </div>

    );

}

export default SongMediaFields;
