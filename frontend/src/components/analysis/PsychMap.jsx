import { useState, useEffect } from "react";
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
import { getPsychMap } from "../../services/api";

function getQuadrantColor(valencia, energia, midValencia, midEnergia) {
    if (valencia < midValencia && energia >= midEnergia) return "#ff5c5c";
    if (valencia >= midValencia && energia >= midEnergia) return "#c9c93c";
    if (valencia < midValencia && energia < midEnergia) return "#33c9a0";
    return "#3d8bff";
}

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

    const [points, setPoints] = useState([]);
    const [midpoint, setMidpoint] = useState({ valencia: 50, energia: 50 });

    useEffect(() => {
        getPsychMap()
            .then((res) => {
                const mv = res.avg_valence;
                const me = res.avg_energy;
                setMidpoint({ valencia: mv, energia: me });

                const withColor = res.points.map((p) => ({
                    ...p,
                    color: getQuadrantColor(p.valencia, p.energia, mv, me)
                }));
                setPoints(withColor);
            })
            .catch((err) => console.error("Error al cargar mapa psicológico:", err));
    }, []);

    return (

        <div className="psych-map">

            <ResponsiveContainer width="100%" height={280}>

                <ScatterChart margin={{ top:10, right:20, left:0, bottom:20 }}>

                    <ReferenceArea x1={0} x2={midpoint.valencia} y1={midpoint.energia} y2={100} fill="#7a2b2b" fillOpacity={0.5} label={{ value:"Intensa", position:"insideTopLeft", fill:"#ffb3b3", fontSize:16, fontWeight:700 }}/>
                    <ReferenceArea x1={midpoint.valencia} x2={100} y1={midpoint.energia} y2={100} fill="#7a7a2b" fillOpacity={0.5} label={{ value:"Energética", position:"insideTopRight", fill:"#f0e8a0", fontSize:16, fontWeight:700 }}/>
                    <ReferenceArea x1={0} x2={midpoint.valencia} y1={0} y2={midpoint.energia} fill="#1f6b56" fillOpacity={0.5} label={{ value:"Relajante", position:"insideBottomLeft", fill:"#9be8d0", fontSize:16, fontWeight:700 }}/>
                    <ReferenceArea x1={midpoint.valencia} x2={100} y1={0} y2={midpoint.energia} fill="#23437a" fillOpacity={0.5} label={{ value:"Melancólica", position:"insideBottomRight", fill:"#a9c8f5", fontSize:16, fontWeight:700 }}/>

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