import { useState, useEffect } from "react";
import Layout from "../components/layout/Layout";

import "./Dashboard.css";

import KpiCard from "../components/dashboard/KpiCard";
import ChartCard from "../components/dashboard/ChartCard";
import RecentSongsTable from "../components/dashboard/RecentSongsTable";
import GenreDistributionChart from "../components/dashboard/GenreDistributionChart";
import CatalogGrowthChart from "../components/dashboard/CatalogGrowthChart";
import StarRating from "../components/common/StarRating";

import { getKpis } from "../services/api";

import {
    MusicNoteBeamed,
    EmojiSmile,
    LightningCharge,
    Star
} from "react-bootstrap-icons";

function Dashboard() {

    const [kpis, setKpis] = useState(null);

    useEffect(() => {
        getKpis()
            .then(setKpis)
            .catch((err) => console.error("Error al cargar KPIs:", err));
    }, []);

    return (
        <Layout title="Dashboard">

            <div className="dashboard-page">

                <div className="kpi-grid">

                    <KpiCard
                        icon={<MusicNoteBeamed />}
                        value={kpis ? kpis.total_songs.toLocaleString() : "..."}
                        label="Canciones Totales"
                    />

                    <KpiCard
                        icon={<EmojiSmile />}
                        value={kpis ? kpis.avg_valence : "..."}
                        label="Valencia media"
                    />

                    <KpiCard
                        icon={<LightningCharge />}
                        value={kpis ? kpis.avg_energy : "..."}
                        label="Energía promedio"
                    />

                    <KpiCard
                        icon={<Star />}
                        value={kpis ? kpis.avg_popularity : "..."}
                        label="Popularidad media"
                        extra={kpis && <StarRating value={kpis.avg_popularity} />}
                    />

                </div>

                <div className="dashboard-grid">

                    <ChartCard
                        title="Crecimiento del catálogo"
                        subtitle="Nuevas canciones agregadas por mes"
                    >
                        <CatalogGrowthChart/>
                    </ChartCard>

                    <ChartCard title="Diez Canciones Aleatorias">
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