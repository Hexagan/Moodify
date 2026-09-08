import "./Topbar.css";
import { Search } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Topbar({ title, searchValue, onSearchChange }) {

    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    return (
        <header className="topbar">

            <h1 className="page-title">
                {title}
            </h1>

            <div className="topbar-actions">

                <div className="search-box">

                    <Search/>

                    <input
                        placeholder="Buscar canciones"
                        value={searchValue ?? ""}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                    />

                </div>

                {isAdmin && (
                    <button className="add-button" onClick={() => navigate("/abm")}>
                        + Agregar canciones
                    </button>
                )}

            </div>

        </header>
    );

}

export default Topbar;