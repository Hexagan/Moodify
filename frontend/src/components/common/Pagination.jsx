import { useState } from "react";
import "./Pagination.css";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";

function getPageNumbers(current, total) {

    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = [1];

    if (current > 3) pages.push("...");

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 2) pages.push("...");

    pages.push(total);

    return pages;

}

function PageJump({ totalPages, onJump, onCancel }) {

    const [value, setValue] = useState("");
    const page = Number(value);
    const valid = Number.isInteger(page) && page >= 1 && page <= totalPages;

    function handleKeyDown(e) {
        if (e.key === "Enter" && valid) onJump(page);
        if (e.key === "Escape") onCancel();
    }

    return (
        <input
            className={`page-jump ${value && !valid ? "invalid" : ""}`}
            type="number"
            inputMode="numeric"
            min={1}
            max={totalPages}
            placeholder={`1–${totalPages}`}
            aria-label={`Ir a la página (1 a ${totalPages}), Enter para confirmar`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={onCancel}
            autoFocus
        />
    );

}

function Pagination({ currentPage, totalPages, onPageChange }) {

    const [jumpingAt, setJumpingAt] = useState(null);
    const pages = getPageNumbers(currentPage, totalPages);

    function jump(page) {
        setJumpingAt(null);
        onPageChange(page);
    }

    return (

        <div className="pagination">

            <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                aria-label="Página anterior"
            >
                <ChevronLeft />
            </button>

            {pages.map((page, i) => (
                page === "..."
                    ? (jumpingAt === i
                        ? <PageJump key={`jump-${i}`} totalPages={totalPages} onJump={jump} onCancel={() => setJumpingAt(null)} />
                        : (
                            <button
                                key={`dots-${i}`}
                                className="page-dots"
                                onClick={() => setJumpingAt(i)}
                                title="Ir a una página"
                                aria-label="Ir a una página específica"
                            >
                                ...
                            </button>
                        ))
                    : (
                        <button
                            key={page}
                            className={`page-btn ${page === currentPage ? "active" : ""}`}
                            onClick={() => onPageChange(page)}
                            aria-current={page === currentPage ? "page" : undefined}
                        >
                            {page}
                        </button>
                    )
            ))}

            <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                aria-label="Página siguiente"
            >
                <ChevronRight />
            </button>

        </div>

    );

}

export default Pagination;
