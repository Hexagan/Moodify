import { useState, useEffect } from "react";
import "./SongsTable.css";

import SongRow from "./SongsRow/SongRow";
import Pagination from "../common/Pagination";

import { getCancionesFull } from "../../services/api";
import { mapCancion } from "../../utils/mapCancion";
import { useDebounce } from "../../hooks/useDebounce";

const PAGE_SIZE = 10;

function SongsTable({ genero, busqueda, sortBy, order, currentPage, onPageChange, totalCount }) {

    const [songs, setSongs] = useState([]);
    const debouncedBusqueda = useDebounce(busqueda, 300);

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    useEffect(() => {
        getCancionesFull({ page: currentPage, pageSize: PAGE_SIZE, sortBy, order, genero, busqueda: debouncedBusqueda })
            .then((data) => setSongs(data.map(mapCancion)))
            .catch((err) => console.error("Error al cargar canciones:", err));
    }, [currentPage, sortBy, order, genero, debouncedBusqueda]);

    return (

        <div className="songs-table">

            <div className="table-header">
                <span>Canción</span>
                <span>Género</span>
                <span>Valencia</span>
                <span>Energía</span>
                <span>Popularidad</span>
                <span>Duración</span>
                <span>Estado</span>
            </div>

            <div className="table-body">
                {songs.map((song) => (
                    <SongRow key={song.id} song={song} />
                ))}
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
            />

        </div>

    );

}

export default SongsTable;