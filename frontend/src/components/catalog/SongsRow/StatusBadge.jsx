import "./StatusBadge.css";

const statusColors = {

    Relajante: "status-relax",

    Enérgico: "status-energy",

    Eufórico: "status-happy",

    Mixto: "status-mixed",

    Tenso: "status-tense"

};

function StatusBadge({ status }) {

    const className = statusColors[status] || "status-default";

    return (

        <span className={`status-badge ${className}`}>

            <span className="status-dot"></span>

            {status}

        </span>

    );

}

export default StatusBadge;