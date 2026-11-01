import "./StatusBadge.css";

const statusClasses = {
    Enérgico: "status-energico",
    Intenso: "status-intenso",
    Relajante: "status-relajante",
    Melancólico: "status-melancolico",
    Mixto: "status-mixto"
};

function StatusBadge({ status }) {

    const className = statusClasses[status] || "status-default";

    return (

        <span className={`status-badge ${className}`} title={status ?? undefined}>

            <span className="status-dot"></span>

            <span className="status-label">{status ?? "—"}</span>

        </span>

    );

}

export default StatusBadge;
