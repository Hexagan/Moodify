import { upload } from "@vercel/blob/client";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// The hosted backend runs on Vercel functions, which reject request bodies over 4.5 MB, so
// there files go straight from the browser to Vercel Blob and the form carries only the URL.
// Locally (no Blob store) they're sent with the form as before.
let directPromise = null;

function directUploads() {
    if (!directPromise) {
        directPromise = fetch(`${BASE_URL}/subidas/config`)
            .then((res) => res.json())
            .then((config) => Boolean(config.direct))
            .catch(() => {
                directPromise = null;
                return false;
            });
    }
    return directPromise;
}

function blobName(file) {
    const ext = /\.([a-z0-9]{1,5})$/i.exec(file.name)?.[1]?.toLowerCase() ?? "bin";
    return `${crypto.randomUUID().replaceAll("-", "")}.${ext}`;
}

// Adds `file` to the form as `field`, or uploads it first and adds its URL as `${field}_blob`.
// folder: "avatars" | "songs" | "forum" (the backend decides who may upload what where).
export async function appendUpload(formData, field, file, { folder, uid }) {
    if (!file) return;
    if (!(await directUploads())) {
        formData.append(field, file);
        return;
    }
    try {
        const blob = await upload(`${folder}/${blobName(file)}`, file, {
            access: "public",
            handleUploadUrl: `${BASE_URL}/subidas/token`,
            clientPayload: JSON.stringify({ folder, uid }),
            contentType: file.type || undefined,
        });
        formData.append(`${field}_blob`, blob.url);
    } catch {
        throw new Error("No se pudo subir el archivo. Revisá el formato y el tamaño, y probá de nuevo.");
    }
}
