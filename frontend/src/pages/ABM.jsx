import { useState } from "react";

import Layout from "../components/layout/Layout";
import "./ABM.css";

import TabSelector from "../components/abm/TabSelector";
import NuevaCancion from "../components/abm/NuevaCancion";
import ModificarCancion from "../components/abm/ModificarCancion";
import EliminarCancion from "../components/abm/EliminarCancion";

function ABM() {

    const [activeTab, setActiveTab] = useState("nueva");

    return (

        <Layout title="ABM" subtitle="Alta - Baja - Modificación">

            <div className="abm-page">

                <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />

                {activeTab === "nueva" && <NuevaCancion />}
                {activeTab === "modificar" && <ModificarCancion />}
                {activeTab === "eliminar" && <EliminarCancion />}

            </div>

        </Layout>

    );

}

export default ABM;