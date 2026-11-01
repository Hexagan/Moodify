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

        <span className={`status-badge ${className}`}>

            <span className="status-dot"></span>

            {status ?? "—"}

        </span>

    );

}

export default StatusBadge;
