import Layout from "../components/layout/Layout";

import "./Dashboard.css";

import KpiCard from "../components/dashboard/KpiCard";
import ChartCard from "../components/dashboard/ChartCard";
import RecentSongsTable from "../components/dashboard/RecentSongsTable";
import GenreDistributionChart from "../components/dashboard/GenreDistributionChart";
import CatalogGrowthChart from "../components/dashboard/CatalogGrowthChart";

import {
    MusicNoteBeamed,
    EmojiSmile,
    LightningCharge,
    Star
} from "react-bootstrap-icons";

function Dashboard() {
    return (
        <Layout title="Dashboard">

            <div className="dashboard-page">

                <div className="kpi-grid">

                    <KpiCard
                        icon={<MusicNoteBeamed />}
                        value="482"
                        label="Canciones Totales"
                    />

                    <KpiCard
                        icon={<EmojiSmile />}
                        value="0.64"
                        label="Valencia media"
                    />

                    <KpiCard
                        icon={<LightningCharge />}
                        value="0.71"
                        label="Energía promedio"
                    />

                    <KpiCard
                        icon={<Star />}
                        value="58.3"
                        label="Popularidad media"
                    />

                </div>

                <div className="dashboard-grid">

                    <ChartCard
                        title="Crecimiento del catálogo"
                        subtitle="Nuevas canciones agregadas por mes"
                    >
                        <CatalogGrowthChart/>

                    </ChartCard>

                    <ChartCard
                        title="Diez Canciones Aleatorias"
                    >
                        <RecentSongsTable />
                    </ChartCard>

                    <ChartCard
                        title="Popularidad promedio por género"
                        subtitle="% del catálogo"
                    >
                        <GenreDistributionChart />
                    </ChartCard>

                </div>

            </div>

        </Layout>
    );
}

export default Dashboard;