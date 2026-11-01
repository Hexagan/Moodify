import { scaleLevel } from "../../utils/moodScale";
import "./ScaleBadge.css";

// Always two decimals, so 0.5 and 0.512 take the same width in a column.
function ScaleBadge({ value, className = "" }) {
    if (value == null) return <span className={`scale-badge ${className}`}>—</span>;
    return <span className={`scale-badge scale-${scaleLevel(value)} ${className}`}>{Number(value).toFixed(2)}</span>;
}

export default ScaleBadge;
