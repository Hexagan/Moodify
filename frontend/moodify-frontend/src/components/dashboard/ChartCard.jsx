import "./ChartCard.css";

function ChartCard({ title, subtitle, children }) {
    return (
        <div className="chart-card">

            <div className="chart-header">
                <div>
                    <h4>{title}</h4>
                    <span>{subtitle}</span>
                </div>
            </div>

            <div className="chart-content">
                {children}
            </div>

        </div>
    );
}

export default ChartCard;