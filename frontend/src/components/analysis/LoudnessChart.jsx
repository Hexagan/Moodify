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
import GenreTick from "./GenreTick";
import { barGenre, svgLinkProps, useOpenGenre } from "../../utils/genreLinks";

const colors = ["#a93dff", "#ff4d4d", "#33d1c0", "#ff3da0", "#a93dff", "#3ba9ff"];

const DbLabel = (props) => {

    const { x, y, width, index, data, onSelect } = props;
    const genre = data[index]?.genre;

    return (
        <text
            x={x + width + 8}
            y={y + 12}
            fill="#A6A9C8"
            fontSize="13"
            {...(genre ? svgLinkProps(genre, onSelect) : {})}
        >
            {data[index]?.value} dB
        </text>
    );

};

function LoudnessChart() {

    const [data, setData] = useState([]);
    const openGenre = useOpenGenre();

    useEffect(() => {
        getLoudnessByGenre()
            .then((rows) => {
                // Loudness is negative (dB below full scale), so bars measure the distance above a
                // floor 2 dB under the quietest genre shown: the loudest genre gets the longest bar.
                const floor = Math.floor(Math.min(...rows.map((r) => r.value))) - 2;
                setData(rows.map((r) => ({ ...r, level: r.value - floor })));
            })
            .catch((err) => console.error("Error al cargar loudness por género:", err));
    }, []);

    return (

        <div className="loudness-chart analysis-chart-links">

            <ResponsiveContainer width="100%" height={240}>

                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top:5, right:60, left:10, bottom:5 }}
                >

                    <XAxis type="number" domain={[0, "dataMax"]} hide />

                    <YAxis
                        type="category"
                        dataKey="genre"
                        axisLine={false}
                        tickLine={false}
                        width={110}
                        interval={0}
                        tick={<GenreTick onSelect={openGenre} />}
                    />

                    <Tooltip
                        cursor={false}
                        formatter={(v, name, item) => [`${item.payload.value} dB`, "Loudness"]}
                        contentStyle={tooltipContentStyle}
                        itemStyle={tooltipItemStyle}
                        labelStyle={tooltipLabelStyle}
                    />

                    <Bar
                        onClick={(item) => openGenre(barGenre(item))}
                        dataKey="level"
                        radius={[8,8,8,8]}
                        barSize={10}
                        label={<DbLabel data={data} onSelect={openGenre} />}
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