import logo from "../../assets/logo-noBG.png";
import "./Sidebar.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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
    const { user, profile, isAdmin, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate("/login");
    }

    const displayName = profile?.display_name || user?.displayName || "Usuario";
    const photoUrl = profile?.photo_url || user?.photoURL;
    const roleLabel = profile?.role === "dev" ? "Administrador" : "Usuario";
    const initials = displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

    return (
        <aside className="sidebar">

            <div className="logo">
                <img src={logo} alt="Logo" className="logo-image" />
            </div>

            <div className="user-card" onClick={() => navigate(`/perfil/${user?.uid}`)} style={{ cursor: "pointer" }}>
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

                    {isAdmin && (
                        <NavLink to="/abm" className="nav-item">
                            <ListTask />
                            <span>ABM Canciones</span>
                        </NavLink>
                    )}

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

                <button className="nav-item logout-item" onClick={handleLogout}>
                    <BoxArrowRight />
                    <span>Cerrar sesión</span>
                </button>

            </nav>

        </div>

        </aside>
    );
}

export default Sidebar;