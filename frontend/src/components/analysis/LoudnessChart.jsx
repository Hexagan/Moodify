import { useState, useEffect } from "react";
import "./LoudnessChart.css";

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
import { getLoudnessByGenre } from "../../services/api";

const colors = ["#a93dff", "#ff4d4d", "#33d1c0", "#ff3da0", "#a93dff", "#3ba9ff"];

const DbLabel = (props) => {

    const { x, y, width, value } = props;

    return (
        <text
            x={x + width + 8}
            y={y + 12}
            fill="#A6A9C8"
            fontSize="13"
        >
            {value} dB
        </text>
    );

};

function LoudnessChart() {

    const [data, setData] = useState([]);

    useEffect(() => {
        getLoudnessByGenre()
            .then(setData)
            .catch((err) => console.error("Error al cargar loudness por género:", err));
    }, []);

    return (

        <div className="loudness-chart">

            <ResponsiveContainer width="100%" height={240}>

                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top:5, right:60, left:0, bottom:5 }}
                >

                    <XAxis type="number" domain={["dataMin", 0]} hide />

                    <YAxis
                        type="category"
                        dataKey="genre"
                        axisLine={false}
                        tickLine={false}
                        width={80}
                        tick={{ fill:"#A6A9C8", fontSize:13 }}
                    />

                    <Tooltip
                        cursor={false}
                        formatter={(v) => `${v} dB`}
                        contentStyle={tooltipContentStyle}
                        itemStyle={tooltipItemStyle}
                        labelStyle={tooltipLabelStyle}
                    />

                    <Bar
                        dataKey="value"
                        radius={[8,8,8,8]}
                        barSize={10}
                        label={<DbLabel />}
                    >
                        {data.map((entry, i) => (
                            <Cell key={i} fill={colors[i % colors.length]} />
                        ))}
                    </Bar>

                </BarChart>

            </ResponsiveContainer>

        </div>

    );

}

export default LoudnessChart;