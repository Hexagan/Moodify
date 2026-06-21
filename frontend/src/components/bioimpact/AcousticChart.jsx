import "./AcousticChart.css";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip
} from "recharts";

import { tooltipContentStyle, tooltipItemStyle, tooltipLabelStyle } from "../../styles/tooltipStyle";

// TODO: replace with FastAPI fetch (GET /bioimpact/acoustic-index)
const data = [
    { genre: "Jazz", value: 58 },
    { genre: "Rock-n-rol", value: 52 },
    { genre: "Blues", value: 46 },
    { genre: "Gospel", value: 38 },
    { genre: "K-pop", value: 28 }
];

const TreeBar = (props) => {

    const { x, y, width, height } = props;
    const cx = x + width / 2;

    return (
        <g>
            <line
                x1={cx}
                y1={y + height}
                x2={cx}
                y2={y}
                stroke="#ff4d4d"
                strokeWidth={4}
                strokeLinecap="round"
            />
            <circle
                cx={cx}
                cy={y}
                r={9}
                fill="#33d17a"
                stroke="#0f1126"
                strokeWidth={2}
            />
        </g>
    );

};

function AcousticChart() {

    return (

        <div className="acoustic-chart">

            <ResponsiveContainer width="100%" height={260}>

                <BarChart
                    data={data}
                    margin={{ top:20, right:20, left:0, bottom:5 }}
                    barCategoryGap="35%"
                >

                    <XAxis
                        dataKey="genre"
                        axisLine={{ stroke:"#24264d" }}
                        tickLine={false}
                        tick={{ fill:"#A6A9C8", fontSize:13 }}
                        label={{ value:"Género", position:"insideBottom", offset:-2, fill:"#8085aa", fontSize:12 }}
                    />

                    <YAxis
                        domain={[0,60]}
                        ticks={[0,10,20,30,40,50,60]}
                        tickFormatter={(v) => `${v}%`}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill:"#A6A9C8", fontSize:12 }}
                        label={{ value:"Acousticness (%)", angle:-90, position:"insideLeft", fill:"#8085aa", fontSize:12 }}
                    />

                    <Tooltip
                        cursor={false}
                        formatter={(v) => `${v}%`}
                        contentStyle={tooltipContentStyle}
                        itemStyle={tooltipItemStyle}
                        labelStyle={tooltipLabelStyle}
                    />

                    <Bar dataKey="value" shape={<TreeBar />} barSize={4} />

                </BarChart>

            </ResponsiveContainer>

        </div>

    );

}

export default AcousticChart;