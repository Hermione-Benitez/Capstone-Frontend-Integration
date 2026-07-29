import React, { useState } from "react";

export interface TablePaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions: number[];
  totalRecords: number;
  fromRow: number;
  toRow: number;
  handlePageChange: (p: number) => void;
  handlePageSizeChange: (size: number) => void;
}

export function TablePagination({
  page,
  totalPages,
  pageSize,
  pageSizeOptions,
  totalRecords,
  fromRow,
  toRow,
  handlePageChange,
  handlePageSizeChange,
}: TablePaginationProps) {
  const [pageInputVal, setPageInputVal] = useState("");
  const [pageInputFocused, setPageInputFocused] = useState(false);

  const commitPageInput = () => {
    const n = parseInt(pageInputVal, 10);
    if (!isNaN(n)) {
      const clamped = Math.min(Math.max(1, n), totalPages);
      handlePageChange(clamped);
    }
    setPageInputVal("");
    setPageInputFocused(false);
  };

  const buildPageRange = (): (number | "...")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const visible = new Set<number>();
    visible.add(1);
    visible.add(totalPages);
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      visible.add(i);
    }
    const sorted = [...visible].sort((a, b) => a - b);
    const result: (number | "...")[] = [];
    for (let i = 0; i < sorted.length; i++) {
      result.push(sorted[i]);
      if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) {
        result.push("...");
      }
    }
    return result;
  };

  return (
    <nav
      className="dt-pagination"
      aria-label="Table pagination"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" && page > 1) {
          e.preventDefault();
          handlePageChange(page - 1);
        } else if (e.key === "ArrowRight" && page < totalPages) {
          e.preventDefault();
          handlePageChange(page + 1);
        } else if (e.key === "Home") {
          e.preventDefault();
          handlePageChange(1);
        } else if (e.key === "End") {
          e.preventDefault();
          handlePageChange(totalPages);
        }
      }}
    >
      <span className="dt-page-info">
        {totalRecords === 0
          ? "No records"
          : `Showing ${fromRow}–${toRow} of ${totalRecords.toLocaleString()} records`}
      </span>

      <div className="dt-pagination-controls">
        <span className="dt-page-size-label">Rows per page</span>
        <select
          className="dt-page-size-select"
          value={pageSize}
          aria-label="Rows per page"
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <div className="dt-page-btns" role="group" aria-label="Page navigation">
          <button
            className="dt-page-btn dt-page-btn--icon"
            disabled={page === 1}
            onClick={() => handlePageChange(1)}
            aria-label="First page"
            title="First page"
          >
            <i className="ti ti-chevrons-left" aria-hidden="true" />
          </button>

          <button
            className="dt-page-btn dt-page-btn--icon"
            disabled={page === 1}
            onClick={() => handlePageChange(page - 1)}
            aria-label="Previous page"
            title="Previous page (Left arrow)"
          >
            <i className="ti ti-chevron-left" aria-hidden="true" />
          </button>

          <span className="dt-page-btns-inner">
            {buildPageRange().map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="dt-page-ellipsis" aria-hidden="true">
                  &hellip;
                </span>
              ) : (
                <button
                  key={p}
                  className={`dt-page-btn${p === page ? " dt-page-btn--active" : ""}`}
                  onClick={() => handlePageChange(p as number)}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </button>
              )
            )}
          </span>

          <button
            className="dt-page-btn dt-page-btn--icon"
            disabled={page === totalPages}
            onClick={() => handlePageChange(page + 1)}
            aria-label="Next page"
            title="Next page (Right arrow)"
          >
            <i className="ti ti-chevron-right" aria-hidden="true" />
          </button>

          <button
            className="dt-page-btn dt-page-btn--icon"
            disabled={page === totalPages}
            onClick={() => handlePageChange(totalPages)}
            aria-label="Last page"
            title="Last page"
          >
            <i className="ti ti-chevrons-right" aria-hidden="true" />
          </button>
        </div>

        {totalPages > 1 && (
          <div className="dt-page-jump" aria-label="Jump to page">
            <label htmlFor="dt-page-jump-input" className="dt-page-size-label">
              Go to
            </label>
            <input
              id="dt-page-jump-input"
              type="number"
              min={1}
              max={totalPages}
              className="dt-page-jump-input"
              placeholder={String(page)}
              value={pageInputFocused ? pageInputVal : ""}
              aria-label={`Go to page (1–${totalPages})`}
              onFocus={() => { setPageInputFocused(true); setPageInputVal(""); }}
              onChange={(e) => setPageInputVal(e.target.value)}
              onBlur={commitPageInput}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitPageInput();
                if (e.key === "Escape") { setPageInputVal(""); setPageInputFocused(false); }
              }}
            />
          </div>
        )}
      </div>

      <div className="dt-pagination-mobile" aria-hidden="true">
        <button
          className="dt-page-btn dt-page-btn--icon"
          disabled={page === 1}
          onClick={() => handlePageChange(page - 1)}
          aria-label="Previous page"
        >
          <i className="ti ti-chevron-left" aria-hidden="true" />
        </button>
        <span className="dt-page-mobile-label">
          Page <strong>{page}</strong> of {totalPages}
        </span>
        <button
          className="dt-page-btn dt-page-btn--icon"
          disabled={page === totalPages}
          onClick={() => handlePageChange(page + 1)}
          aria-label="Next page"
        >
          <i className="ti ti-chevron-right" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

export default TablePagination;
