import logo from "../../assets/logo-noBG.png";
import "./Sidebar.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

import {
    House,
    MusicNoteBeamed,
    Activity,
    Flower1,
    Grid3x3GapFill,
    MicFill,
    ListTask,
    BarChart,
    Gear,
    BoxArrowRight,
    PersonFill,
    ChevronDoubleLeft,
    ChevronDoubleRight
} from "react-bootstrap-icons";

import { NavLink } from "react-router-dom";

const COLLAPSED_KEY = "moodifySidebarCollapsed";
// With no saved choice, start collapsed on screens where the full sidebar would crowd the page.
const NARROW_SCREEN = "(max-width: 1100px)";

function loadCollapsed() {
    try {
        const saved = localStorage.getItem(COLLAPSED_KEY);
        if (saved !== null) return saved === "1";
    } catch { /* fall through to the screen-size default */ }
    return window.matchMedia(NARROW_SCREEN).matches;
}

function Sidebar() {
    const { user, profile, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(loadCollapsed);

    function toggleCollapsed() {
        const next = !collapsed;
        setCollapsed(next);
        try {
            localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
        } catch { /* the choice just won't survive a reload */ }
    }

    async function handleLogout() {
        await logout();
        navigate("/login");
    }

    const displayName = profile?.display_name || user?.displayName || "Usuario";
    const photoUrl = profile?.photo_url || user?.photoURL;
    const roleLabel = profile?.role === "dev" ? "Administrador" : "Usuario";
    const initials = displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

    return (
        <aside className={`sidebar${collapsed ? " collapsed" : ""}`}>

            <div className="sidebar-head">
                <Link to="/" className="logo" aria-label="Moodify, ir al Dashboard">
                    <img src={logo} alt="" className="logo-image" />
                </Link>
                <button
                    type="button"
                    className="sidebar-toggle"
                    onClick={toggleCollapsed}
                    aria-expanded={!collapsed}
                    aria-label={collapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
                    title={collapsed ? "Expandir menú" : "Contraer menú"}
                >
                    {collapsed ? <ChevronDoubleRight aria-hidden="true" /> : <ChevronDoubleLeft aria-hidden="true" />}
                </button>
            </div>

            {user ? (
                <Link to={`/perfil/${user.uid}`} className="user-card" title={collapsed ? displayName : undefined}>
                    <div className="avatar">
                        {photoUrl
                            ? <img src={photoUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }} />
                            : initials
                        }
                    </div>
                    <div className="user-info">
                        <h4>{displayName}</h4>
                        <span>{roleLabel}</span>
                    </div>
                </Link>
            ) : (
                <Link to="/login" className="user-card guest" title={collapsed ? "Iniciar sesión" : undefined}>
                    <div className="avatar guest-avatar">
                        <PersonFill aria-hidden="true" />
                    </div>
                    <div className="user-info">
                        <h4>Invitado</h4>
                        <span>Iniciar sesión</span>
                    </div>
                </Link>
            )}

            <div className="sidebar-body">

            <div className="menu-section">

                <span className="section-title">
                    MENÚ
                </span>

                <nav className="sidebar-nav">

                    <NavLink to="/" end className="nav-item" title={collapsed ? "Dashboard" : undefined}>
                        <House />
                        <span>Dashboard</span>
                    </NavLink>

                    {/* Guests already get the emotional map on their dashboard. */}
                    {user && (
                        <NavLink to="/mapa-emocional" className="nav-item" title={collapsed ? "Mapa Emocional" : undefined}>
                            <Grid3x3GapFill />
                            <span>Mapa Emocional</span>
                        </NavLink>
                    )}

                    <NavLink to="/catalogo" className="nav-item" title={collapsed ? "Catálogo" : undefined}>
                        <MusicNoteBeamed />
                        <span>Catálogo</span>
                    </NavLink>

                    <NavLink to="/artistas" className="nav-item" title={collapsed ? "Artistas" : undefined}>
                        <MicFill />
                        <span>Artistas</span>
                    </NavLink>

                    <NavLink to="/analisis" className="nav-item" title={collapsed ? "Análisis" : undefined}>
                        <Activity />
                        <span>Análisis</span>
                    </NavLink>

                    <NavLink to="/bioimpacto" className="nav-item" title={collapsed ? "Bio-impacto" : undefined}>
                        <Flower1 />
                        <span>Bio-impacto</span>
                    </NavLink>

                    {isAdmin && (
                        <NavLink to="/abm" className="nav-item" title={collapsed ? "ABM Canciones" : undefined}>
                            <ListTask />
                            <span>ABM Canciones</span>
                        </NavLink>
                    )}

                </nav>

            </div>

            <div className="menu-section system-section">

            <span className="section-title">
                SISTEMA
            </span>

            <nav className="sidebar-nav">

                <NavLink to="/reportes" className="nav-item" title={collapsed ? "Reportes" : undefined}>
                    <BarChart />
                    <span>Reportes</span>
                </NavLink>

                <NavLink to="/configuracion" className="nav-item" title={collapsed ? "Configuración" : undefined}>
                    <Gear />
                    <span>Configuración</span>
                </NavLink>

                {user && (
                    <button className="nav-item logout-item" onClick={handleLogout} title={collapsed ? "Cerrar sesión" : undefined}>
                        <BoxArrowRight />
                        <span>Cerrar sesión</span>
                    </button>
                )}

            </nav>

        </div>

            </div>

        </aside>
    );
}

export default Sidebar;