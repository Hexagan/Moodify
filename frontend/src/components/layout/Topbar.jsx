import "./Topbar.css";
import { Search } from "react-bootstrap-icons";

function Topbar({ title, searchValue, onSearchChange }) {

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

                <button className="add-button">
                    + Agregar canciones
                </button>

            </div>

        </header>
    );

}

export default Topbar;