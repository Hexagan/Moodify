import "./GenreFilters.css";
import { Funnel } from "react-bootstrap-icons";

const genres = [
    "Todos",
    "Pop",
    "Rock",
    "Jazz",
    "EDM",
    "Acústico"
];

function GenreFilters() {

    return (

        <div className="genre-filters">

            <div className="genre-buttons">

                {genres.map((genre, index) => (

                    <button
                        key={genre}
                        className={
                            index === 0
                                ? "genre-btn active"
                                : "genre-btn"
                        }
                    >

                        {genre}

                    </button>

                ))}

            </div>

            <button className="filter-btn">

                <Funnel />

                Más filtros

            </button>

        </div>

    );

}

export default GenreFilters;