import "./PsychMap.css";

import {
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    ReferenceArea,
    Tooltip
} from "recharts";

import { tooltipContentStyle, tooltipItemStyle, tooltipLabelStyle } from "../../styles/tooltipStyle";

// TODO: replace with FastAPI fetch (GET /analytics/psych-map)
const points = [
    { genre: "Hardcore", valencia: 15, energia: 88, color: "#ff5c5c" },
    { genre: "Dubstep", valencia: 22, energia: 75, color: "#ff5c5c" },
    { genre: "Alt-rock", valencia: 58, energia: 82, color: "#c9c93c" },
    { genre: "Disco", valencia: 78, energia: 80, color: "#c9c93c" },
    { genre: "Funk", valencia: 76, energia: 56, color: "#c9c93c" },
    { genre: "Gospel", valencia: 14, energia: 16, color: "#33c9a0" },
    { genre: "Jazz", valencia: 36, energia: 22, color: "#33c9a0" },
    { genre: "Rock-n-roll", valencia: 66, energia: 30, color: "#3d8bff" },
    { genre: "Blues", valencia: 72, energia: 18, color: "#3d8bff" }
];

const CustomDot = (props) => {

    const { cx, cy, payload } = props;

    return (
        <g>
            <circle cx={cx} cy={cy} r={5} fill={payload.color} />
            <text x={cx + 9} y={cy + 4} fontSize="12" fill="#E4E6F5">
                {payload.genre}
            </text>
        </g>
    );

};

function PsychMap() {

    return (

        <div className="psych-map">

            <ResponsiveContainer width="100%" height={280}>

                <ScatterChart margin={{ top:10, right:20, left:0, bottom:20 }}>

                    <ReferenceArea x1={0} x2={50} y1={50} y2={100} fill="#7a2b2b" fillOpacity={0.5} label={{ value:"Intensa", position:"insideTopLeft", fill:"#ffb3b3", fontSize:16, fontWeight:700 }}/>
                    <ReferenceArea x1={50} x2={100} y1={50} y2={100} fill="#7a7a2b" fillOpacity={0.5} label={{ value:"Energética", position:"insideTopRight", fill:"#f0e8a0", fontSize:16, fontWeight:700 }}/>
                    <ReferenceArea x1={0} x2={50} y1={0} y2={50} fill="#1f6b56" fillOpacity={0.5} label={{ value:"Relajante", position:"insideBottomLeft", fill:"#9be8d0", fontSize:16, fontWeight:700 }}/>
                    <ReferenceArea x1={50} x2={100} y1={0} y2={50} fill="#23437a" fillOpacity={0.5} label={{ value:"Melancólica", position:"insideBottomRight", fill:"#a9c8f5", fontSize:16, fontWeight:700 }}/>

                    <XAxis
                        type="number"
                        dataKey="valencia"
                        domain={[0,100]}
                        tick={{ fill:"#8b8daa", fontSize:12 }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value:"Valencia emocional (%)", position:"insideBottom", offset:-12, fill:"#8b8daa", fontSize:12 }}
                    />

                    <YAxis
                        type="number"
                        dataKey="energia"
                        domain={[0,100]}
                        tick={{ fill:"#8b8daa", fontSize:12 }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value:"Energía (%)", angle:-90, position:"insideLeft", fill:"#8b8daa", fontSize:12 }}
                    />

                    <ZAxis range={[60,60]} />

                    <Tooltip
                        cursor={false}
                        contentStyle={tooltipContentStyle}
                        itemStyle={tooltipItemStyle}
                        labelStyle={tooltipLabelStyle}
                    />

                    <Scatter data={points} shape={<CustomDot />} />

                </ScatterChart>

            </ResponsiveContainer>

        </div>

    );

}

export default PsychMap;