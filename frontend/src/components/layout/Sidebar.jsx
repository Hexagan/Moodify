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

                    <NavLink to="/reportes" className="nav-item">
                        <BarChart />
                        <span>Reportes</span>
                    </NavLink>

                    <NavLink to="/configuracion" className="nav-item">
                        <Gear />
                        <span>Configuración</span>
                    </NavLink>

                    <NavLink to="/logout" className="nav-item">
                        <BoxArrowRight />
                        <span>Cerrar sesión</span>
                    </NavLink>

                </nav>

            </div>

        </aside>
    );
}

export default Sidebar;