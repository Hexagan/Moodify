import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusLg } from "react-bootstrap-icons";

import ScrollRow from "../common/ScrollRow";
import PlaylistCard from "./PlaylistCard";
import PlaylistForm from "./PlaylistForm";
import { useSettings } from "../../context/SettingsContext";
import { getUserPlaylists, createPlaylist } from "../../services/api";
import "./Playlists.css";

// A user's playlists as one scrollable row. The owner also gets a "Nueva playlist" tile;
// everyone else only sees what the owner's visibility settings allow them to.
function UserPlaylists({ ownerUid, viewerUid, emptyText }) {

    const { settings } = useSettings();
    const isOwner = Boolean(viewerUid) && viewerUid === ownerUid;
    const requestKey = `${ownerUid}|${viewerUid ?? ""}`;
    const [result, setResult] = useState({ key: null, items: null });
    const [creating, setCreating] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;
        getUserPlaylists(ownerUid, viewerUid)
            .then((items) => { if (!cancelled) setResult({ key: requestKey, items }); })
            .catch(() => { if (!cancelled) setResult({ key: requestKey, items: [] }); });
        return () => { cancelled = true; };
    }, [ownerUid, viewerUid, requestKey]);

    const items = result.key === requestKey ? result.items : null;

    async function handleCreate(data) {
        const created = await createPlaylist({ ...data, owner_uid: ownerUid });
        navigate(`/playlist/${created.id}`);
    }

    if (items === null) return <p className="dash-empty">Cargando playlists…</p>;

    if (creating) {
        return (
            <div className="user-playlists-create">
                <PlaylistForm
                    initial={{ visibility: settings.preferences.defaultPlaylistVisibility }}
                    onSubmit={handleCreate}
                    onCancel={() => setCreating(false)}
                />
            </div>
        );
    }

    if (items.length === 0 && !isOwner) return <p className="dash-empty">{emptyText ?? "No hay playlists para mostrar."}</p>;

    return (
        <ScrollRow label="Playlists" itemWidth={170}>
            {isOwner && (
                <button type="button" className="playlist-new" onClick={() => setCreating(true)}>
                    <span className="playlist-new-tile" aria-hidden="true"><PlusLg /></span>
                    <span>Nueva playlist</span>
                </button>
            )}
            {items.map((p) => <PlaylistCard key={p.id} playlist={p} showVisibility={isOwner} />)}
        </ScrollRow>
    );

}

export default UserPlaylists;
