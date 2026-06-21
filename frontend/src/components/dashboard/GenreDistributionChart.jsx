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

const data = [
    { genre: "Pop", percentage: 24, songs: 116 },
    { genre: "Rock", percentage: 19, songs: 92 },
    { genre: "Hip-hop", percentage: 15, songs: 72 },
    { genre: "EDM", percentage: 12, songs: 58 },
    { genre: "Jazz", percentage: 8, songs: 40 }
];

const colors = [
    "#C93CFF",
    "#FF4D6D",
    "#38E8C6",
    "#FFD43B",
    "#5E72EB"
];

const CustomLabel = (props) => {

    const {
        x,
        y,
        width,
        value,
        index
    } = props;

    return (

        <text
            x={x + width + 10}
            y={y + 12}
            fill="#A6A9C8"
            fontSize="13"
        >

            {value}%

        </text>

    );

};

function GenreDistributionChart() {

    return (

        <div className="genre-chart">

            <ResponsiveContainer
                width="100%"
                height={280}
            >

                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{
                        top:5,
                        right:30,
                        left:20,
                        bottom:5
                    }}
                >

                    <XAxis
                        type="number"
                        hide
                    />

                    <YAxis
                        type="category"
                        dataKey="genre"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                            fill:"#FFFFFF",
                            fontSize:15
                        }}
                    />

                    <Tooltip
                        cursor={false}
                        contentStyle={tooltipContentStyle}
                        itemStyle={tooltipItemStyle}
                        labelStyle={tooltipLabelStyle}
                    />

                    <Bar
                        dataKey="percentage"
                        radius={[8,8,8,8]}
                        barSize={14}
                        label={<CustomLabel/>}
                    >

                        {

                            data.map((entry,index)=>(

                                <Cell
                                    key={index}
                                    fill={colors[index]}
                                />

                            ))

                        }

                    </Bar>

                </BarChart>

            </ResponsiveContainer>

        </div>

    );

}

export default GenreDistributionChart;