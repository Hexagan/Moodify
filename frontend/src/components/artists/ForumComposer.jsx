import { useEffect, useRef, useState } from "react";
import { Paperclip, XCircleFill, Send } from "react-bootstrap-icons";
import "./Forum.css";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];
const IMAGE_MAX_MB = 5;
const VIDEO_MAX_MB = 25;

function validateFile(file) {
    if (IMAGE_TYPES.includes(file.type)) {
        return file.size > IMAGE_MAX_MB * 1024 * 1024 ? `Las imágenes pueden pesar hasta ${IMAGE_MAX_MB} MB.` : null;
    }
    if (VIDEO_TYPES.includes(file.type)) {
        return file.size > VIDEO_MAX_MB * 1024 * 1024 ? `Los videos pueden pesar hasta ${VIDEO_MAX_MB} MB.` : null;
    }
    return "Formato no admitido. Usá JPG, PNG, GIF, WEBP, MP4 o WEBM.";
}

function ForumComposer({
    authorUid,
    withTitle = false,
    placeholder,
    submitLabel,
    onSubmit,
    onCancel,
    autoFocus = false,
    initialTitle = "",
    initialBody = "",
    existingMedia = null // { url, type } when editing a post that already has an attachment
}) {

    const [title, setTitle] = useState(initialTitle);
    const [body, setBody] = useState(initialBody);
    const [keepExisting, setKeepExisting] = useState(Boolean(existingMedia?.url));
    const [attachment, setAttachment] = useState(null); // { file, url } - url is an object URL for the preview
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const fileInputRef = useRef(null);
    const attachmentRef = useRef(null);

    useEffect(() => { attachmentRef.current = attachment; }, [attachment]);
    useEffect(() => () => {
        if (attachmentRef.current) URL.revokeObjectURL(attachmentRef.current.url);
    }, []);

    function replaceAttachment(next) {
        if (attachment) URL.revokeObjectURL(attachment.url);
        setAttachment(next);
    }

    function handleFile(e) {
        const chosen = e.target.files?.[0];
        e.target.value = "";
        if (!chosen) return;
        const problem = validateFile(chosen);
        setError(problem);
        if (!problem) replaceAttachment({ file: chosen, url: URL.createObjectURL(chosen) });
    }

    const file = attachment?.file;
    const showsExisting = keepExisting && !attachment;
    const canSubmit = !busy && (withTitle ? title.trim().length >= 3 : body.trim() || file || showsExisting);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!canSubmit) return;
        const data = new FormData();
        data.append("author_uid", authorUid);
        if (withTitle) data.append("title", title.trim());
        data.append("body", body.trim());
        if (file) data.append("media", file);
        if (existingMedia?.url && !keepExisting && !file) data.append("remove_media", "true");

        setBusy(true);
        setError(null);
        try {
            await onSubmit(data);
            setTitle("");
            setBody("");
            replaceAttachment(null);
        } catch (err) {
            setError(err.message || "No se pudo publicar. Probá de nuevo.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <form className="forum-composer" onSubmit={handleSubmit}>

            {withTitle && (
                <input
                    className="forum-composer-title"
                    placeholder="Título del hilo"
                    value={title}
                    maxLength={120}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus={autoFocus}
                    aria-label="Título del hilo"
                />
            )}

            <textarea
                className="forum-composer-body"
                placeholder={placeholder}
                value={body}
                maxLength={5000}
                onChange={(e) => setBody(e.target.value)}
                autoFocus={autoFocus && !withTitle}
                aria-label={placeholder}
            />

            {showsExisting && (
                <div className="forum-composer-preview">
                    {existingMedia.type === "video"
                        ? <video src={existingMedia.url} controls muted />
                        : <img src={existingMedia.url} alt="Adjunto actual" />
                    }
                    <button type="button" className="forum-composer-remove" onClick={() => setKeepExisting(false)} aria-label="Quitar el adjunto actual">
                        <XCircleFill />
                    </button>
                </div>
            )}

            {attachment && (
                <div className="forum-composer-preview">
                    {file.type.startsWith("video/")
                        ? <video src={attachment.url} controls muted />
                        : <img src={attachment.url} alt="Adjunto" />
                    }
                    <button type="button" className="forum-composer-remove" onClick={() => replaceAttachment(null)} aria-label="Quitar adjunto">
                        <XCircleFill />
                    </button>
                </div>
            )}

            {error && <p className="forum-composer-error" role="alert">{error}</p>}

            <div className="forum-composer-actions">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={[...IMAGE_TYPES, ...VIDEO_TYPES].join(",")}
                    hidden
                    onChange={handleFile}
                />
                <button type="button" className="forum-attach" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip /> {file || showsExisting ? "Cambiar adjunto" : "Imagen o video"}
                </button>
                <span className="forum-composer-hint">Hasta {IMAGE_MAX_MB} MB por imagen, {VIDEO_MAX_MB} MB por video</span>
                <div className="forum-composer-buttons">
                    {onCancel && (
                        <button type="button" className="forum-btn ghost" onClick={onCancel} disabled={busy}>
                            Cancelar
                        </button>
                    )}
                    <button type="submit" className="forum-btn primary" disabled={!canSubmit}>
                        <Send /> {busy ? "Publicando…" : submitLabel}
                    </button>
                </div>
            </div>

        </form>
    );

}

export default ForumComposer;
