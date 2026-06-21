import { useState, useEffect } from "react";
import "./GenreDistributionChart.css";

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
import { getGenreDistribution } from "../../services/api";

const colors = ["#C93CFF", "#FF4D6D", "#38E8C6", "#FFD43B", "#5E72EB"];

const CustomLabel = (props) => {

    const { x, y, width, value } = props;

    return (
        <text x={x + width + 10} y={y + 12} fill="#A6A9C8" fontSize="13">
            {value}%
        </text>
    );

};

function GenreDistributionChart() {

    const [data, setData] = useState([]);

    useEffect(() => {
        getGenreDistribution()
            .then(setData)
            .catch((err) => console.error("Error al cargar distribución por género:", err));
    }, []);

    return (

        <div className="genre-chart">

            <ResponsiveContainer width="100%" height={280}>

                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top:5, right:30, left:20, bottom:5 }}
                >

                    <XAxis type="number" hide />

                    <YAxis
                        type="category"
                        dataKey="genre"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill:"#FFFFFF", fontSize:15 }}
                    />

                    <Tooltip
                        cursor={false}
                        contentStyle={tooltipContentStyle}
                        itemStyle={tooltipItemStyle}
                        labelStyle={tooltipLabelStyle}
                    />

                    <Bar
                        dataKey="value"
                        radius={[8,8,8,8]}
                        barSize={14}
                        label={<CustomLabel/>}
                    >
                        {data.map((entry, index) => (
                            <Cell key={index} fill={colors[index]} />
                        ))}
                    </Bar>

                </BarChart>

            </ResponsiveContainer>

        </div>

    );

}

export default GenreDistributionChart;