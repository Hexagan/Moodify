import { useState, useEffect } from "react";

import Layout from "../components/layout/Layout";

import GenreFilters from "../components/catalog/GenreFilters";
import SortFilters from "../components/catalog/SortFilters";
import SongsTable from "../components/catalog/SongsTable";

import "./Catalog.css";

import { getCancionesCountFull } from "../services/api";
import { useDebounce } from "../hooks/useDebounce";

function Catalog() {

    const [genero, setGenero] = useState("todos");
    const [sortBy, setSortBy] = useState(null);
    const [order, setOrder] = useState("asc");
    const [busqueda, setBusqueda] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const debouncedBusqueda = useDebounce(busqueda, 300);

    useEffect(() => {
        getCancionesCountFull({ genero, busqueda: debouncedBusqueda })
            .then((res) => setTotalCount(res.total))
            .catch((err) => console.error("Error al contar canciones:", err));
    }, [genero, debouncedBusqueda]);

    useEffect(() => {
        setCurrentPage(1);
    }, [genero, debouncedBusqueda]);

    useEffect(() => {
        getCancionesCountFull({ genero, busqueda })
            .then((res) => setTotalCount(res.total))
            .catch((err) => console.error("Error al contar canciones:", err));
    }, [genero, busqueda]);

    useEffect(() => {
        setCurrentPage(1);
    }, [genero, busqueda]);

    function handleSortClick(field) {
        if (sortBy === field) {
            setOrder(order === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setOrder("asc");
        }
    }

    return (

        <Layout
            title="Catálogo"
            searchValue={busqueda}
            onSearchChange={setBusqueda}
        >

            <div className="catalog-page">

                <div className="catalog-header">
                    <span className="catalog-count">
                        {totalCount} canciones
                    </span>
                </div>

                <GenreFilters
                    selectedGenre={genero}
                    onSelectGenre={setGenero}
                />

                <SortFilters
                    sortBy={sortBy}
                    order={order}
                    onSortClick={handleSortClick}
                />

                <SongsTable
                    genero={genero}
                    busqueda={debouncedBusqueda}
                    sortBy={sortBy}
                    order={order}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    totalCount={totalCount}
                />

            </div>

        </Layout>

    );

}

export default Catalog;