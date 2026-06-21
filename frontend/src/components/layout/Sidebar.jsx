import logo from "../../assets/logo-noBG.png";
import "./Sidebar.css";

import {
    House,
    MusicNoteBeamed,
    Activity,
    Flower1,
    ListTask,
    BarChart,
    Gear,
    BoxArrowRight
} from "react-bootstrap-icons";

import { NavLink } from "react-router-dom";

function Sidebar() {
    return (
        <aside className="sidebar">

            <div className="logo">
                <img src={logo} alt="Logo" className="logo-image" />
            </div>

            <div className="user-card">

                <div className="avatar">
                    AP
                </div>

                <div className="user-info">
                    <h4>Ana Perez</h4>
                    <span>Investigadora</span>
                </div>

            </div>

            <div className="menu-section">

                <span className="section-title">
                    MENÚ
                </span>

                <nav className="sidebar-nav">

                    <NavLink to="/" end className="nav-item">
                        <House />
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink to="/catalogo" className="nav-item">
                        <MusicNoteBeamed />
                        <span>Catálogo</span>
                    </NavLink>

                    <NavLink to="/analisis" className="nav-item">
                        <Activity />
                        <span>Análisis</span>
                    </NavLink>

                    <NavLink to="/bioimpacto" className="nav-item">
                        <Flower1 />
                        <span>Bio-impacto</span>
                    </NavLink>

                    <NavLink to="/abm" className="nav-item">
                        <ListTask />
                        <span>ABM Canciones</span>
                    </NavLink>

                </nav>

            </div>

            <div className="menu-section">

            <span className="section-title">
                SISTEMA
            </span>

            <nav className="sidebar-nav">

                <span className="nav-item disabled">
                    <BarChart />
                    <span>Reportes</span>
                </span>

                <span className="nav-item disabled">
                    <Gear />
                    <span>Configuración</span>
                </span>

                <span className="nav-item disabled">
                    <BoxArrowRight />
                    <span>Cerrar sesión</span>
                </span>

            </nav>

        </div>

        </aside>
    );
}

export default Sidebar;