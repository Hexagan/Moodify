import { svgLinkProps } from "../../utils/genreLinks";
import "./genreLinks.css";

// Y-axis tick for the bar charts; recharts passes x, y and payload, onSelect comes from the chart.
function GenreTick({ x, y, payload, onSelect }) {
    return (
        <text
            x={x}
            y={y}
            dy={4}
            textAnchor="end"
            fill="#A6A9C8"
            fontSize={13}
            {...svgLinkProps(payload.value, onSelect)}
        >
            <tspan>{payload.value}</tspan>
        </text>
    );
}

export default GenreTick;
