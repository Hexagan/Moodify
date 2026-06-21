import "./ChartCard.css";

function ChartCard({ title, subtitle, icon, badge, children }) {
    return (
        <div className="chart-card">

            <div className="chart-header">

                <div className="chart-header-title">
                    {icon && <span className="chart-icon">{icon}</span>}
                    <div>
                        <h4>{title}</h4>
                        {subtitle && <span>{subtitle}</span>}
                    </div>
                </div>

                {badge && <span className="chart-badge">{badge}</span>}

            </div>

            <div className="chart-content">
                {children}
            </div>

        </div>
    );
}

export default ChartCard;