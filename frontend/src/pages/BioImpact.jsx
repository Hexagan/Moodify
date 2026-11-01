import Layout from "../components/layout/Layout";

import "./BioImpact.css";

import ChartCard from "../components/dashboard/ChartCard";
import AcousticChart from "../components/bioimpact/AcousticChart";
import InsightBanner from "../components/bioimpact/InsightBanner";
import AcousticSongsList from "../components/bioimpact/AcousticSongsList";
import GreenhouseBanner from "../components/bioimpact/GreenhouseBanner";
import AcousticRanking from "../components/bioimpact/AcousticRanking";

import { Flower1, MusicNoteList } from "react-bootstrap-icons";

function BioImpact() {
    return (
        <Layout title="Bio-impacto">

            <div className="bioimpact-page">

                <div className="bioimpact-grid">

                    <div className="bioimpact-left">

                        <ChartCard
                            title="Índice acústico: Potencial de estimulación biológica (Plantas)"
                            icon={<Flower1 />}
                            badge="Top 5"
                        >
                            <AcousticChart />
                        </ChartCard>

                        <InsightBanner
                            text="Las canciones con una acusticidad mayor a 0.5 favorecen el crecimiento vegetal según estudios de bioacústica."
                        />

                        <GreenhouseBanner targetId="ranking-acustico" />

                    </div>

                    <ChartCard
                        title="Canciones con mayor índice acústico"
                        icon={<MusicNoteList />}
                        badge="Top 6"
                    >
                        <AcousticSongsList />
                    </ChartCard>

                </div>

                <AcousticRanking id="ranking-acustico" startAfter={6} />

            </div>

        </Layout>
    );
}

export default BioImpact;