import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import Layout from "../components/layout/Layout";
import "./ABM.css";

import TabSelector from "../components/abm/TabSelector";
import NuevaCancion from "../components/abm/NuevaCancion";
import ModificarCancion from "../components/abm/ModificarCancion";
import EliminarCancion from "../components/abm/EliminarCancion";

function ABM() {

    const location = useLocation();
    const [activeTab, setActiveTab] = useState("nueva");
    const [presetSong, setPresetSong] = useState(null);

    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
        }
        if (location.state?.song) {
            setPresetSong(location.state.song);
        }
    }, [location.state]);

    return (

        <Layout title="ABM" subtitle="Alta - Baja - Modificación">

            <div className="abm-page">

                <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />

                {activeTab === "nueva" && <NuevaCancion />}
                {activeTab === "modificar" && <ModificarCancion presetSong={presetSong} />}
                {activeTab === "eliminar" && <EliminarCancion />}

            </div>

        </Layout>

    );

}

export default ABM;