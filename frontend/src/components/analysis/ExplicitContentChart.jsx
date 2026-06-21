import "./ExplicitContentChart.css";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Cell
} from "recharts";

import { tooltipContentStyle, tooltipItemStyle, tooltipLabelStyle } from "../../styles/tooltipStyle";

// TODO: replace with FastAPI fetch (GET /analytics/explicit-content)
const data = [
    { genre: "Deathmetal", value: 88 },
    { genre: "Hardcore", value: 76 },
    { genre: "Hard-rock", value: 64 },
    { genre: "Industrial", value: 55 },
    { genre: "Alt-rock", value: 38 },
    { genre: "Metalcore", value: 24 }
];

const colors = ["#a93dff", "#33d17a", "#ff3da0", "#ff9a3d", "#33c97a", "#ff4d4d"];

function ExplicitContentChart() {

    return (

        <div className="explicit-chart">

            <ResponsiveContainer width="100%" height={240}>

                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top:5, right:30, left:0, bottom:5 }}
                >

                    <XAxis type="number" hide />

                    <YAxis
                        type="category"
                        dataKey="genre"
                        axisLine={false}
                        tickLine={false}
                        width={90}
                        tick={{ fill:"#A6A9C8", fontSize:13 }}
                    />

                    <Tooltip
                        cursor={false}
                        contentStyle={tooltipContentStyle}
                        itemStyle={tooltipItemStyle}
                        labelStyle={tooltipLabelStyle}
                        formatter={(v) => `${v}%`}
                    />

                    <Bar dataKey="value" radius={[0,8,8,0]} barSize={14}>
                        {data.map((entry, i) => (
                            <Cell key={i} fill={colors[i % colors.length]} />
                        ))}
                    </Bar>

                </BarChart>

            </ResponsiveContainer>

        </div>

    );

}

export default ExplicitContentChart;