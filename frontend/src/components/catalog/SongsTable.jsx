import { useState, useEffect, useRef } from "react";
import "./SongsTable.css";

import { ArrowUp, ArrowDown, Funnel, FunnelFill, Sliders, ListOl, Infinity as InfinityIcon } from "react-bootstrap-icons";

import SongRow from "./SongsRow/SongRow";
import Pagination from "../common/Pagination";
import ColumnFilterPopover from "./ColumnFilterPopover";

import { getCancionesFull } from "../../services/api";
import { mapCancion } from "../../utils/mapCancion";
import { RANGE_COLUMNS, formatRange } from "../../utils/catalogRanges";

const PAGE_SIZE = 10;
const MODE_KEY = "catalogViewMode";

const FILTER_COLUMNS = Object.keys(RANGE_COLUMNS);

function readSavedMode() {
    try {
        return localStorage.getItem(MODE_KEY) === "infinite" ? "infinite" : "paged";
    } catch {
        return "paged";
    }
}

function SongsTable({ genero, busqueda, estado, sortBy, order, ranges, onSortChange, onRangeChange, onEstadoClick, currentPage, onPageChange, totalCount }) {

    const [mode, setMode] = useState(readSavedMode);
    const [openFilter, setOpenFilter] = useState(null);
    const sentinelRef = useRef(null);
    const filterAnchorRef = useRef(null);

    // Each result is tagged with the request it answers, so "loading" is derived as
    // "the current request has no result yet" - no flags to reset when filters change.
    const filterKey = [genero, busqueda, estado, sortBy, order, JSON.stringify(ranges)].join("|");
    const pagedKey = `${currentPage}|${filterKey}`;
    const [paged, setPaged] = useState({ key: null, songs: [] });
    // The infinite-scroll cursor is tagged with its filters too: new filters mean page 1.
    const [cursor, setCursor] = useState({ key: filterKey, page: 1 });
    const infPage = cursor.key === filterKey ? cursor.page : 1;
    const [infinite, setInfinite] = useState({ key: null, page: 0, songs: [] });

    useEffect(() => {
        if (mode !== "paged") return;
        let cancelled = false;
        getCancionesFull({ page: currentPage, pageSize: PAGE_SIZE, sortBy, order, genero, busqueda, estado, ranges })
            .then((data) => { if (!cancelled) setPaged({ key: pagedKey, songs: data.map(mapCancion) }); })
            .catch((err) => console.error("Error al cargar canciones:", err));
        return () => { cancelled = true; };
    }, [mode, pagedKey, currentPage, sortBy, order, genero, busqueda, estado, ranges]);

    useEffect(() => {
        if (mode !== "infinite") return;
        let cancelled = false;
        getCancionesFull({ page: infPage, pageSize: PAGE_SIZE, sortBy, order, genero, busqueda, estado, ranges })
            .then((data) => {
                if (cancelled) return;
                const batch = data.map(mapCancion);
                setInfinite((prev) => {
                    const base = prev.key === filterKey && infPage > 1 ? prev.songs : [];
                    const seen = new Set(base.map((s) => s.id));
                    return { key: filterKey, page: infPage, songs: [...base, ...batch.filter((s) => !seen.has(s.id))] };
                });
            })
            .catch((err) => console.error("Error al cargar canciones:", err));
        return () => { cancelled = true; };
    }, [mode, infPage, filterKey, sortBy, order, genero, busqueda, estado, ranges]);

    const infiniteCurrent = infinite.key === filterKey;
    const songs = mode === "paged" ? paged.songs : (infiniteCurrent ? infinite.songs : []);
    const loading = mode === "paged" ? paged.key !== pagedKey : !(infiniteCurrent && infinite.page === infPage);
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const hasMore = songs.length < totalCount;
    const canLoadMore = mode === "infinite" && !loading && hasMore;

    useEffect(() => {
        if (!canLoadMore || !sentinelRef.current) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setCursor((c) => ({ key: filterKey, page: (c.key === filterKey ? c.page : 1) + 1 }));
            }
        }, { rootMargin: "600px 0px" });
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [canLoadMore, filterKey]);

    function changeMode(next) {
        if (next === mode) return;
        try { localStorage.setItem(MODE_KEY, next); } catch { /* preference just won't persist */ }
        setMode(next);
    }

    let infiniteStatus = "";
    if (mode === "infinite") {
        if (loading) infiniteStatus = "Cargando más canciones…";
        else if (!hasMore && songs.length > 0) infiniteStatus = "Llegaste al final del catálogo";
    }

    return (

        <div className="songs-table">

            <div className="table-header">
                <span>Canción</span>
                <span aria-hidden="true"></span>
                <span className="col-genre">Género</span>

                {FILTER_COLUMNS.map((field) => {
                    const { label } = RANGE_COLUMNS[field];
                    const sorted = sortBy === field;
                    const range = ranges[field];
                    const open = openFilter === field;
                    const hints = [
                        sorted && RANGE_COLUMNS[field].sortLabels[order],
                        range && formatRange(field, range),
                    ].filter(Boolean);
                    return (
                        <button
                            key={field}
                            ref={open ? filterAnchorRef : undefined}
                            type="button"
                            className={`th-btn col-${field} ${sorted || range ? "active" : ""}`}
                            aria-haspopup="dialog"
                            aria-expanded={open}
                            onClick={() => setOpenFilter(open ? null : field)}
                            title={hints.length ? `${label}: ${hints.join(" · ")}` : `Filtrar u ordenar por ${label.toLowerCase()}`}
                        >
                            <span className="th-label">{label}</span>
                            {sorted && (order === "asc" ? <ArrowUp /> : <ArrowDown />)}
                            {range && <FunnelFill />}
                            {!sorted && !range && <Sliders className="th-hint" />}
                        </button>
                    );
                })}

                <button
                    type="button"
                    className={`th-btn col-estado ${estado ? "active" : ""}`}
                    onClick={onEstadoClick}
                    title={estado ? `Mostrando solo "${estado}" — clic para el siguiente estado` : "Filtrar por estado"}
                >
                    <span className="th-label">{estado ?? "Estado"}</span>
                    {estado ? <FunnelFill /> : <Funnel className="th-hint" />}
                </button>
            </div>

            {openFilter && (
                <ColumnFilterPopover
                    key={openFilter}
                    field={openFilter}
                    anchorRef={filterAnchorRef}
                    sortOrder={sortBy === openFilter ? order : null}
                    range={ranges[openFilter] ?? null}
                    onSort={(dir) => onSortChange(openFilter, dir)}
                    onApplyRange={(range) => onRangeChange(openFilter, range)}
                    onClose={() => setOpenFilter(null)}
                />
            )}

            <div className="table-body">
                {songs.map((song) => (
                    <SongRow key={song.id} song={song} activeGenre={genero} />
                ))}
                {!loading && songs.length === 0 && (
                    <p className="table-empty">No hay canciones que coincidan con estos filtros.</p>
                )}
                {canLoadMore && <div ref={sentinelRef} className="infinite-sentinel" aria-hidden="true" />}
            </div>

            <div className="table-footer">

                <span className="table-footer-info">
                    {mode === "infinite"
                        ? `${songs.length.toLocaleString("es-AR")} de ${totalCount.toLocaleString("es-AR")}`
                        : `Página ${currentPage} de ${totalPages.toLocaleString("es-AR")}`
                    }
                </span>

                {mode === "paged"
                    ? <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
                    : <span className="infinite-status" role="status">{infiniteStatus}</span>
                }

                <div className="view-toggle" role="radiogroup" aria-label="Forma de recorrer el catálogo">
                    <button
                        type="button"
                        role="radio"
                        aria-checked={mode === "paged"}
                        onClick={() => changeMode("paged")}
                    >
                        <ListOl /> Páginas
                    </button>
                    <button
                        type="button"
                        role="radio"
                        aria-checked={mode === "infinite"}
                        onClick={() => changeMode("infinite")}
                    >
                        <InfinityIcon /> Scroll infinito
                    </button>
                </div>

            </div>

        </div>

    );

}

export default SongsTable;
