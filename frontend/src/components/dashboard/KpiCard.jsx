import "./KpiCard.css";

function StatCard({ icon, value, label, color }) {

    return (

        <div className="stat-card">

            <div
                className="stat-icon"
                style={{ color }}
            >
                {icon}
            </div>

            <div className="stat-info">

                <h2>{value}</h2>

                <span>{label}</span>

            </div>

        </div>

    );

}

export default StatCard;