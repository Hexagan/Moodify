import { scaleLevel } from "../../utils/moodScale";
import "./ScaleBadge.css";

function ScaleBadge({ value }) {
    if (value == null) return <span className="scale-badge">—</span>;
    return <span className={`scale-badge scale-${scaleLevel(value)}`}>{value}</span>;
}

export default ScaleBadge;
