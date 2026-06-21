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

function Pagination({ currentPage, totalPages, onPageChange }) {

    const pages = getPageNumbers(currentPage, totalPages);

    return (

        <div className="pagination">

            <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                <ChevronLeft />
            </button>

            {pages.map((page, i) => (
                page === "..."
                    ? <span key={`dots-${i}`} className="page-dots">...</span>
                    : (
                        <button
                            key={page}
                            className={`page-btn ${page === currentPage ? "active" : ""}`}
                            onClick={() => onPageChange(page)}
                        >
                            {page}
                        </button>
                    )
            ))}

            <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                <ChevronRight />
            </button>

        </div>

    );

}

export default Pagination;