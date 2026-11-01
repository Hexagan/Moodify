import "./Topbar.css";
import { Search, BoxArrowInRight } from "react-bootstrap-icons";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

function Topbar({ title, searchValue, onSearchChange }) {

    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();

    return (
        <header className="topbar">

            <h1 className="page-title">
                {title}
            </h1>

            <div className="topbar-actions">

                <div className="search-box">

                    <Search/>

                    <input
                        placeholder="Buscar canciones o artistas"
                        value={searchValue ?? ""}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                    />

                </div>

                {isAdmin && (
                    <button className="add-button" onClick={() => navigate("/abm")}>
                        + Agregar canciones
                    </button>
                )}

                {!user && (
                    <Link to="/login" className="signin-button">
                        <BoxArrowInRight aria-hidden="true" /> Iniciar sesión
                    </Link>
                )}

                <ThemeToggle />

            </div>

        </header>
    );

}

export default Topbar;