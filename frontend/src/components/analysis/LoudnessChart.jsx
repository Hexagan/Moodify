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

<Tooltip
    cursor={false}
    contentStyle={tooltipContentStyle}
    itemStyle={tooltipItemStyle}
    labelStyle={tooltipLabelStyle}
/>

// TODO: replace with FastAPI fetch (GET /analytics/loudness-by-genre)
const data = [
    { genre: "EDM", db: -4.2 },
    { genre: "Rock", db: -5.8 },
    { genre: "Hip-hop", db: -7.1 },
    { genre: "Pop", db: -8.4 },
    { genre: "Jazz", db: -12.6 },
    { genre: "Acústico", db: -16.3 }
];

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
                        dataKey="db"
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