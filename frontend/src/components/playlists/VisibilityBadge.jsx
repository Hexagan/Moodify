import { VISIBILITY } from "../../utils/playlists";
import "./Playlists.css";

function VisibilityBadge({ visibility }) {
    const meta = VISIBILITY[visibility] ?? VISIBILITY.private;
    const { Icon } = meta;
    return (
        <span className={`visibility-badge ${visibility}`} title={meta.hint}>
            <Icon aria-hidden="true" /> {meta.label}
        </span>
    );
}

export default VisibilityBadge;
