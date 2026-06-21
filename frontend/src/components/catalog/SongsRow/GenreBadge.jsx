import "./GenreBadge.css";

const genreColors = {

    Pop: "genre-pop",

    Rock: "genre-rock",

    Jazz: "genre-jazz",

    EDM: "genre-edm",

    Acústico: "genre-acoustic",

    HipHop: "genre-hiphop",

    Clásica: "genre-classic",

    Electrónica: "genre-electronic"

};

function GenreBadge({ genre }) {

    const className = genreColors[genre] || "genre-default";

    return (

        <span className={`genre-badge ${className}`}>

            {genre}

        </span>

    );

}

export default GenreBadge;