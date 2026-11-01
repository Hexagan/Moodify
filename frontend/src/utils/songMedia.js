import { updateSongMedia } from "../services/api";

// Pending ABM media edits: files and links picked in the form, sent after the song itself saves.
export const EMPTY_MEDIA = {
    coverFile: null, coverUrl: null, removeCover: false,
    previewFile: null, previewUrl: null, removePreview: false,
    youtube: "", removeYoutube: false,
};

export function hasMediaChanges(media) {
    return Boolean(
        media.coverFile || media.coverUrl || media.removeCover ||
        media.previewFile || media.previewUrl || media.removePreview ||
        media.youtube.trim() || media.removeYoutube
    );
}

export function toMediaRequest(media) {
    return {
        cover: media.coverFile,
        cover_url: media.coverFile ? null : media.coverUrl,
        remove_cover: media.removeCover,
        preview: media.previewFile,
        preview_url: media.previewFile ? null : media.previewUrl,
        remove_preview: media.removePreview,
        youtube: media.youtube.trim(),
        remove_youtube: media.removeYoutube,
    };
}

// Media hangs off the song's track_id, so it can only be saved once the song itself exists.
// Returns without a request when nothing in the media section changed.
export async function saveSongMedia(trackId, adminUid, media) {
    if (!hasMediaChanges(media)) return;
    await updateSongMedia(trackId, adminUid, toMediaRequest(media));
}
