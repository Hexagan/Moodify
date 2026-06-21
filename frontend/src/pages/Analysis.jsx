import Layout from "../components/layout/Layout";

import "./Analysis.css";

import KpiCard from "../components/dashboard/KpiCard";
import ChartCard from "../components/dashboard/ChartCard";

import TopGenresChart from "../components/analysis/TopGenresChart";
import ExplicitContentChart from "../components/analysis/ExplicitContentChart";
import LoudnessChart from "../components/analysis/LoudnessChart";
import PsychMap from "../components/analysis/PsychMap";

import {
    BarChartLine,
    GraphUpArrow,
    LightningCharge,
    HeartPulse,
    VolumeUp,
    MapFill
} from "react-bootstrap-icons";

function Analysis() {
    return (
        <Layout title="Análisis" subtitle="Perfiles bio-emocionales">

            <div className="analysis-page">

                <div className="kpi-grid">

                    <KpiCard
                        icon={<BarChartLine />}
                        value="22"
                        label="Géneros analizados"
                    />

                    <KpiCard
                        icon={<GraphUpArrow />}
                        value="Pop"
                        label="Género más popular"
                    />

                    <KpiCard
                        icon={<LightningCharge />}
                        value="EDM"
                        label="Mayor energía media"
                    />

                    <KpiCard
                        icon={<HeartPulse />}
                        value="Jazz"
                        label="Mayor potencial relajante"
                    />

                </div>

                <div className="analysis-grid">

                    <ChartCard
                        title="Géneros más populares"
                        icon={<BarChartLine />}
                        badge="Top 6"
                    >
                        <TopGenresChart />
                    </ChartCard>

                    <ChartCard
                        title="Géneros con mayor contenido explícito"
                        icon={<BarChartLine />}
                        badge="Top 6"
                    >
                        <ExplicitContentChart />
                    </ChartCard>

                    <ChartCard
                        title="Loudness promedio por género"
                        icon={<VolumeUp />}
                    >
                        <LoudnessChart />
                    </ChartCard>

                    <ChartCard
                        title="Mapa psicológico: energía vs valencia"
                        icon={<MapFill />}
                    >
                        <PsychMap />
                    </ChartCard>

                </div>

            </div>

        </Layout>
    );
}

export default Analysis;