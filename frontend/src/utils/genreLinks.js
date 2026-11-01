import { useNavigate } from "react-router-dom";

// Every genre shown in the analysis charts opens the catalogue filtered by it.
export function catalogGenreUrl(genre) {
    return `/catalogo?genero=${encodeURIComponent(genre)}`;
}

export function useOpenGenre() {
    const navigate = useNavigate();
    return (genre) => {
        if (genre) navigate(catalogGenreUrl(genre));
    };
}

// Props that make an SVG element behave like a link: clickable, focusable, Enter to open.
export function svgLinkProps(genre, onSelect) {
    return {
        className: "chart-genre-link",
        role: "link",
        tabIndex: 0,
        "aria-label": `Ver canciones de ${genre} en el catálogo`,
        onClick: () => onSelect(genre),
        onKeyDown: (e) => {
            if (e.key === "Enter") onSelect(genre);
        },
    };
}

// For <Bar onClick>: recharts hands over the bar's item, whose payload is the data row.
export function barGenre(item) {
    return item?.payload?.genre ?? item?.genre;
}
