import { useState, useEffect } from "react";

import Layout from "../components/layout/Layout";

import GenreFilters from "../components/catalog/GenreFilters";
import SongsTable from "../components/catalog/SongsTable";

import "./Catalog.css";

import { getCancionesCountFull } from "../services/api";
import { useDebounce } from "../hooks/useDebounce";
import { ESTADOS } from "../utils/mapCancion";
import { RANGE_COLUMNS, formatRange } from "../utils/catalogRanges";
import { X } from "react-bootstrap-icons";

function Catalog() {

    const [genero, setGenero] = useState("todos");
    const [estado, setEstado] = useState(null);
    const [sortBy, setSortBy] = useState(null);
    const [order, setOrder] = useState("asc");
    const [ranges, setRanges] = useState({});
    const [busqueda, setBusqueda] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const debouncedBusqueda = useDebounce(busqueda, 300);

    // Any filter change starts back at page 1 - done where each filter changes, not here.
    useEffect(() => {
        getCancionesCountFull({ genero, busqueda: debouncedBusqueda, estado, ranges })
            .then((res) => setTotalCount(res.total))
            .catch((err) => console.error("Error al contar canciones:", err));
    }, [genero, debouncedBusqueda, estado, ranges]);

    function handleSortChange(field, dir) {
        if (dir) {
            setSortBy(field);
            setOrder(dir);
        } else if (sortBy === field) {
            setSortBy(null);
            setOrder("asc");
        }
    }

    function handleRangeChange(field, range) {
        setRanges((prev) => {
            const next = { ...prev };
            if (range) next[field] = range;
            else delete next[field];
            return next;
        });
        setCurrentPage(1);
    }

    function handleEstadoClick() {
        const next = ESTADOS.indexOf(estado) + 1;
        setEstado(next < ESTADOS.length ? ESTADOS[next] : null);
        setCurrentPage(1);
    }

    function handleGenreChange(genre) {
        setGenero(genre);
        setCurrentPage(1);
    }

    function handleSearchChange(text) {
        setBusqueda(text);
        setCurrentPage(1);
    }

    return (

        <Layout
            title="Catálogo"
            searchValue={busqueda}
            onSearchChange={handleSearchChange}
        >

            <div className="catalog-page">

                <div className="catalog-header">
                    <div className="catalog-header-left">
                        <span className="catalog-count">
                            {totalCount.toLocaleString("es-AR")} canciones
                        </span>
                        {Object.entries(ranges).map(([field, range]) => (
                            <button
                                key={field}
                                type="button"
                                className="catalog-range-chip"
                                onClick={() => handleRangeChange(field, null)}
                                title={`Quitar el filtro de ${RANGE_COLUMNS[field].label.toLowerCase()}`}
                            >
                                {RANGE_COLUMNS[field].label}: {formatRange(field, range)}
                                <X aria-hidden="true" />
                            </button>
                        ))}
                    </div>
                    <GenreFilters
                        selectedGenre={genero}
                        onSelectGenre={handleGenreChange}
                    />
                </div>

                <SongsTable
                    genero={genero}
                    busqueda={debouncedBusqueda}
                    estado={estado}
                    sortBy={sortBy}
                    order={order}
                    ranges={ranges}
                    onSortChange={handleSortChange}
                    onRangeChange={handleRangeChange}
                    onEstadoClick={handleEstadoClick}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    totalCount={totalCount}
                />

            </div>

        </Layout>

    );

}

export default Catalog;
