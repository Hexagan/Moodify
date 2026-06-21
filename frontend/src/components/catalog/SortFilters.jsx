import "./SortFilters.css";
import { ArrowDownUp, ArrowUp, ArrowDown } from "react-bootstrap-icons";

const filters = [
    { label: "Valencia", value: "valencia" },
    { label: "Energía", value: "energia" },
    { label: "Popularidad", value: "popularidad" },
    { label: "Duración", value: "duracion" }
];

function SortFilters({ sortBy, order, onSortClick }) {

    return (

        <div className="sort-filters">

            {filters.map((filter) => {

                const isActive = sortBy === filter.value;

                return (
                    <button
                        key={filter.value}
                        className={isActive ? "sort-button active" : "sort-button"}
                        onClick={() => onSortClick(filter.value)}
                    >
                        {isActive
                            ? (order === "asc" ? <ArrowUp /> : <ArrowDown />)
                            : <ArrowDownUp />
                        }
                        {filter.label}
                    </button>
                );

            })}

        </div>

    );

}

export default SortFilters;