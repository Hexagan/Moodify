import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./ColumnFilterPopover.css";

import { ArrowUp, ArrowDown } from "react-bootstrap-icons";

import RangeSlider from "../common/RangeSlider";
import { RANGE_COLUMNS, isFullRange } from "../../utils/catalogRanges";

// Mounted fresh on every open, so the draft range starts from whatever is applied.
// Sorting applies at once; the range waits for "Aplicar" so dragging doesn't refetch per step.
function ColumnFilterPopover({ field, anchorRef, sortOrder, range, onSort, onApplyRange, onClose }) {

    const col = RANGE_COLUMNS[field];
    const popoverRef = useRef(null);
    const [draft, setDraft] = useState(range ?? [col.min, col.max]);

    // Positioned straight on the DOM node (not through state) so it can follow the
    // sticky header on every scroll frame without re-rendering.
    useLayoutEffect(() => {
        function place() {
            const anchor = anchorRef.current;
            const pop = popoverRef.current;
            if (!anchor || !pop) return;
            const rect = anchor.getBoundingClientRect();
            const width = pop.offsetWidth;
            const left = Math.min(
                Math.max(8, rect.left + rect.width / 2 - width / 2),
                window.innerWidth - width - 8
            );
            pop.style.top = `${rect.bottom + 8}px`;
            pop.style.left = `${left}px`;
        }
        place();
        window.addEventListener("resize", place);
        window.addEventListener("scroll", place, true);
        return () => {
            window.removeEventListener("resize", place);
            window.removeEventListener("scroll", place, true);
        };
    }, [anchorRef]);

    useEffect(() => {
        popoverRef.current?.querySelector("button, input")?.focus();
    }, []);

    useEffect(() => {
        function handlePointer(e) {
            if (popoverRef.current?.contains(e.target) || anchorRef.current?.contains(e.target)) return;
            onClose();
        }
        function handleKey(e) {
            if (e.key === "Escape") {
                onClose();
                anchorRef.current?.focus();
            }
        }
        document.addEventListener("pointerdown", handlePointer);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("pointerdown", handlePointer);
            document.removeEventListener("keydown", handleKey);
        };
    }, [anchorRef, onClose]);

    function apply() {
        onApplyRange(isFullRange(field, draft) ? null : draft);
        onClose();
    }

    function clear() {
        onApplyRange(null);
        onSort(null);
        onClose();
    }

    const activePreset = col.presets.find((p) => p.range[0] === draft[0] && p.range[1] === draft[1]);

    return createPortal(

        <div
            ref={popoverRef}
            className="column-filter"
            role="dialog"
            aria-label={`Filtrar y ordenar por ${col.label.toLowerCase()}`}
            onKeyDown={(e) => { if (e.key === "Enter" && e.target.type === "range") apply(); }}
        >

            <section>
                <h4>Ordenar</h4>
                <div className="column-filter-sort">
                    {["desc", "asc"].map((dir) => (
                        <button
                            key={dir}
                            type="button"
                            aria-pressed={sortOrder === dir}
                            onClick={() => onSort(sortOrder === dir ? null : dir)}
                        >
                            {dir === "asc" ? <ArrowUp /> : <ArrowDown />}
                            {col.sortLabels[dir]}
                        </button>
                    ))}
                </div>
            </section>

            <section>
                <h4>Rango</h4>
                <div className="column-filter-presets">
                    {col.presets.map((preset) => (
                        <button
                            key={preset.label}
                            type="button"
                            aria-pressed={preset === activePreset}
                            onClick={() => setDraft(preset.range)}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
                <RangeSlider
                    min={col.min}
                    max={col.max}
                    step={col.step}
                    value={draft}
                    onChange={setDraft}
                    format={col.format}
                    label={col.label}
                />
            </section>

            <div className="column-filter-actions">
                <button type="button" className="column-filter-clear" onClick={clear}>
                    Limpiar
                </button>
                <button type="button" className="column-filter-apply" onClick={apply}>
                    Aplicar
                </button>
            </div>

        </div>,

        document.body
    );

}

export default ColumnFilterPopover;
