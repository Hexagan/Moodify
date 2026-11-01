import { useState, useEffect } from "react";
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
import { getExplicitContent } from "../../services/api";
import GenreTick from "./GenreTick";
import { barGenre, useOpenGenre } from "../../utils/genreLinks";

const colors = ["#a93dff", "#33d17a", "#ff3da0", "#ff9a3d", "#33c97a", "#ff4d4d"];

function ExplicitContentChart() {

    const [data, setData] = useState([]);
    const openGenre = useOpenGenre();

    useEffect(() => {
        getExplicitContent()
            .then(setData)
            .catch((err) => console.error("Error al cargar contenido explícito:", err));
    }, []);

    return (

        <div className="explicit-chart analysis-chart-links">

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
                        tick={<GenreTick onSelect={openGenre} />}
                    />

                    <Tooltip
                        cursor={false}
                        formatter={(v) => `${v}%`}
                        contentStyle={tooltipContentStyle}
                        itemStyle={tooltipItemStyle}
                        labelStyle={tooltipLabelStyle}
                    />

                    <Bar onClick={(item) => openGenre(barGenre(item))} dataKey="value" radius={[0,8,8,0]} barSize={14}>
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