import "./CatalogGrowthChart.css";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from "recharts";

import { tooltipContentStyle, tooltipItemStyle, tooltipLabelStyle } from "../../styles/tooltipStyle";

const data = [
    { month: "Enero", songs: 20 },
    { month: "Febrero", songs: 30 },
    { month: "Marzo", songs: 12 },
    { month: "Abril", songs: 50 },
    { month: "Mayo", songs: 60 },
    { month: "Junio", songs: 40 }
];

function CatalogGrowthChart() {

    return (

        <div className="catalog-chart">

            <ResponsiveContainer
                width="100%"
                height={280}
            >

                <LineChart
                    data={data}
                >

                    <CartesianGrid
                        stroke="#23264a"
                        vertical={false}
                    />

                    <XAxis
                        dataKey="month"
                        tick={{
                            fill:"#8b8daa",
                            fontSize:13
                        }}
                        axisLine={false}
                        tickLine={false}
                    />

                    <YAxis
                        tick={{
                            fill:"#8b8daa",
                            fontSize:13
                        }}
                        axisLine={false}
                        tickLine={false}
                    />

                    <Tooltip
                        contentStyle={tooltipContentStyle}
                        itemStyle={tooltipItemStyle}
                        labelStyle={tooltipLabelStyle}
                    />

                    <Line
                        type="monotone"
                        dataKey="songs"
                        stroke="#c93cff"
                        strokeWidth={4}
                        dot={{
                            r:6,
                            fill:"#c93cff",
                            strokeWidth:0
                        }}
                        activeDot={{
                            r:8
                        }}
                    />

                </LineChart>

            </ResponsiveContainer>

        </div>

    );

}

export default CatalogGrowthChart;