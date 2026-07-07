import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo, useRef, useEffect, useCallback, } from "react";
import Button from "./Buttons";
import Dropdown from "./Dropdown";
import ConfirmModal from "./ConfirmModal";
import { useToast } from "./ToastContext";
import "./DataTable.css";
// ─── Row Virtualization Hook ──────────────────────────────────────────────────
// Zero-dependency windowing: only renders rows visible in the scroll viewport.
// Falls back to full render when rowCount ≤ VIRTUAL_THRESHOLD.
const VIRTUAL_THRESHOLD = 100; // rows — below this, skip virtualization overhead
const OVERSCAN = 5; // extra rows rendered above/below viewport
function useVirtualRows(containerRef, rowCount, rowHeight // estimated px per row
) {
    const [scrollTop, setScrollTop] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(600);
    useEffect(() => {
        const el = containerRef.current;
        if (!el || rowCount <= VIRTUAL_THRESHOLD)
            return;
        const onScroll = () => setScrollTop(el.scrollTop);
        const ro = new ResizeObserver(() => setViewportHeight(el.clientHeight));
        el.addEventListener("scroll", onScroll, { passive: true });
        ro.observe(el);
        setViewportHeight(el.clientHeight);
        return () => {
            el.removeEventListener("scroll", onScroll);
            ro.disconnect();
        };
    }, [containerRef, rowCount]);
    if (rowCount <= VIRTUAL_THRESHOLD) {
        // No virtualization — render everything
        return { virtualStart: 0, virtualEnd: rowCount, totalHeight: null, offsetY: 0 };
    }
    const totalHeight = rowCount * rowHeight;
    const rawStart = Math.floor(scrollTop / rowHeight) - OVERSCAN;
    const virtualStart = Math.max(0, rawStart);
    const rawEnd = Math.ceil((scrollTop + viewportHeight) / rowHeight) + OVERSCAN;
    const virtualEnd = Math.min(rowCount, rawEnd);
    const offsetY = virtualStart * rowHeight;
    return { virtualStart, virtualEnd, totalHeight, offsetY };
}
// ─── Column Resize Hook ───────────────────────────────────────────────────────
// Drag-to-resize: tracks pointer delta and updates per-column width in local state.
function useColumnResize(columns, storageKey) {
    const [colWidths, setColWidths] = useState(() => {
        try {
            const saved = localStorage.getItem(`${storageKey}:colWidths`);
            return saved ? JSON.parse(saved) : {};
        }
        catch {
            return {};
        }
    });
    const dragState = useRef(null);
    const onResizeStart = useCallback((e, colKey, currentWidth) => {
        e.preventDefault();
        e.stopPropagation();
        dragState.current = { key: colKey, startX: e.clientX, startWidth: currentWidth };
        const onMove = (me) => {
            if (!dragState.current)
                return;
            const delta = me.clientX - dragState.current.startX;
            const newWidth = Math.max(60, dragState.current.startWidth + delta);
            setColWidths((prev) => {
                const next = { ...prev, [dragState.current.key]: newWidth };
                try {
                    localStorage.setItem(`${storageKey}:colWidths`, JSON.stringify(next));
                }
                catch { }
                return next;
            });
        };
        const onUp = () => {
            dragState.current = null;
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    }, [storageKey]);
    const getColWidth = useCallback((colKey, fallbackWidth) => {
        if (colWidths[colKey] !== undefined)
            return colWidths[colKey];
        if (fallbackWidth) {
            const px = parseInt(fallbackWidth, 10);
            if (!isNaN(px))
                return px;
        }
        return 140; // default column width in px
    }, [colWidths]);
    return { colWidths, getColWidth, onResizeStart };
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
function getValue(row, key) {
    return row[key];
}
function matchesSearch(row, query, fields) {
    if (!query.trim())
        return true;
    const q = query.toLowerCase();
    const keys = fields ? fields : Object.keys(row);
    return keys.some((k) => {
        const v = getValue(row, k);
        return v != null && String(v).toLowerCase().includes(q);
    });
}
function defaultCSVExport(rows, cols) {
    const header = cols.map((c) => `"${c.label}"`).join(",");
    const body = rows.map((row) => cols.map((c) => `"${String(getValue(row, c.key) ?? "").replace(/"/g, '""')}"`).join(","));
    const csv = [header, ...body].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
function ActionMenu({ row, actions }) {
    const visible = actions.filter((a) => !a.hidden?.(row));
    if (visible.length === 0)
        return null;
    const dropdownItems = visible.map((action, index) => ({
        key: `${action.label}-${index}`,
        label: action.label,
        onClick: () => action.onClick(row),
        variant: action.variant,
    }));
    return (_jsx("div", { className: "dt-action-wrap", children: _jsx(Dropdown, { items: dropdownItems, align: "right", placement: "bottom", panelClassName: "dt-dropdown-panel" }) }));
}
// ─── Main Component ───────────────────────────────────────────────────────────
export function DataTable({ rowKey, data, columns, actions = [], searchPlaceholder = "Search\u2026", searchFields, filters = [], createButtons = [], bulkActions = [], pageSizeOptions = [10, 25, 50], defaultPageSize = 10, emptyMessage = "No records found.", selectable = false, onSelectionChange, className = "", loading = false, exportable = false, onExport, columnToggle = false, densityToggle = false, 
// Server-side props
serverSide = false, totalCount, onPageChange, onPageSizeChange, onSortChange, onSearchChange, onFilterChange, }) {
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [activeFilters, setActiveFilters] = useState({});
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [selected, setSelected] = useState(new Set());
    const [selectAllMatching, setSelectAllMatching] = useState(false);
    // ── Toolbar State — persisted to localStorage ──────────────────────────────
    // Key is scoped to the table's column set so different tables don't collide.
    const tableStorageKey = useMemo(() => `dt:${columns.map((c) => c.key).join("-")}`, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // intentionally computed once — column keys are stable
    );
    const [hiddenCols, setHiddenCols] = useState(() => {
        // 1. Try localStorage first
        try {
            const saved = localStorage.getItem(`${tableStorageKey}:hiddenCols`);
            if (saved)
                return new Set(JSON.parse(saved));
        }
        catch { }
        // 2. Fall back to defaultVisible flags
        const h = new Set();
        columns.forEach((c) => {
            if (c.defaultVisible === false)
                h.add(c.key);
        });
        return h;
    });
    const [showColToggle, setShowColToggle] = useState(false);
    const [density, setDensity] = useState(() => {
        try {
            const saved = localStorage.getItem(`${tableStorageKey}:density`);
            if (saved && ["compact", "regular", "relaxed"].includes(saved))
                return saved;
        }
        catch { }
        return "regular";
    });
    const [confirm, setConfirm] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const colToggleRef = useRef(null);
    // ── Filter Presets ─────────────────────────────────────────────────────────
    const [presets, setPresets] = useState(() => {
        try {
            const saved = localStorage.getItem(`${tableStorageKey}:presets`);
            return saved ? JSON.parse(saved) : [];
        }
        catch {
            return [];
        }
    });
    const [showPresets, setShowPresets] = useState(false);
    const [presetName, setPresetName] = useState("");
    const presetPanelRef = useRef(null);
    // Close preset panel on outside click
    useEffect(() => {
        function handler(e) {
            if (presetPanelRef.current && !presetPanelRef.current.contains(e.target)) {
                setShowPresets(false);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);
    const persistPresets = (next) => {
        setPresets(next);
        try {
            localStorage.setItem(`${tableStorageKey}:presets`, JSON.stringify(next));
        }
        catch { }
    };
    const savePreset = () => {
        const name = presetName.trim();
        if (!name)
            return;
        const preset = {
            id: Date.now().toString(),
            name,
            search: search,
            filters: { ...activeFilters },
            sortKey: sortKey,
            sortDir: sortDir,
        };
        persistPresets([...presets, preset]);
        setPresetName("");
        setShowPresets(false);
    };
    const applyPreset = (preset) => {
        setSearch(preset.search);
        setActiveFilters(preset.filters);
        setSortKey(preset.sortKey);
        setSortDir(preset.sortDir);
        setPage(1);
        onSearchChange?.(preset.search);
        onFilterChange?.(preset.filters);
        onSortChange?.(preset.sortKey, preset.sortDir);
        onPageChange?.(1);
        setShowPresets(false);
    };
    const deletePreset = (id, e) => {
        e.stopPropagation();
        persistPresets(presets.filter((p) => p.id !== id));
    };
    // Persist presets on change handled by persistPresets() directly.
    // ── Virtualization ─────────────────────────────────────────────────────────
    const tableWrapRef = useRef(null);
    // Estimate row height based on density
    const estimatedRowHeight = density === "compact" ? 38 : density === "relaxed" ? 58 : 46;
    // ── Column Resize ──────────────────────────────────────────────────────────
    const { getColWidth, onResizeStart } = useColumnResize(columns, tableStorageKey);
    // ── Outside click closes col-toggle ──────────────────────────────────────────
    useEffect(() => {
        function handler(e) {
            if (colToggleRef.current && !colToggleRef.current.contains(e.target)) {
                setShowColToggle(false);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);
    // ── Visible columns ───────────────────────────────────────────────────────────
    const visibleColumns = useMemo(() => columns.filter((c) => !hiddenCols.has(c.key)), [columns, hiddenCols]);
    // ── Filter + Search + Sort ────────────────────────────────────────────────────
    const processed = useMemo(() => {
        if (serverSide)
            return data;
        let rows = [...data];
        rows = rows.filter((r) => matchesSearch(r, search, searchFields));
        Object.entries(activeFilters).forEach(([key, val]) => {
            if (!val)
                return;
            rows = rows.filter((r) => String(getValue(r, key)) === val);
        });
        if (sortKey && sortDir) {
            rows.sort((a, b) => {
                const va = String(getValue(a, sortKey) ?? "");
                const vb = String(getValue(b, sortKey) ?? "");
                const cmp = va.localeCompare(vb, undefined, { numeric: true });
                return sortDir === "asc" ? cmp : -cmp;
            });
        }
        return rows;
    }, [data, search, activeFilters, sortKey, sortDir, searchFields, serverSide]);
    // ── Pagination ────────────────────────────────────────────────────────────────
    const totalPages = Math.max(1, Math.ceil((serverSide ? (totalCount ?? data.length) : processed.length) / pageSize));
    useEffect(() => {
        if (page > totalPages)
            setPage(totalPages);
    }, [page, totalPages]);
    const paginated = useMemo(() => {
        if (serverSide)
            return data;
        const start = (page - 1) * pageSize;
        return processed.slice(start, start + pageSize);
    }, [processed, page, pageSize, serverSide, data]);
    // ── Selection ─────────────────────────────────────────────────────────────────
    const pageKeys = paginated.map((r) => r[rowKey]);
    const allMatchingKeys = processed.map((r) => r[rowKey]);
    const allPageSelected = pageKeys.length > 0 && pageKeys.every((k) => selected.has(k));
    const somePageSelected = pageKeys.some((k) => selected.has(k));
    const toggleRow = useCallback((key) => {
        setSelectAllMatching(false);
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            onSelectionChange?.([...next]);
            return next;
        });
    }, [onSelectionChange]);
    const toggleAll = useCallback(() => {
        setSelectAllMatching(false);
        setSelected((prev) => {
            const next = new Set(prev);
            if (allPageSelected) {
                pageKeys.forEach((k) => next.delete(k));
            }
            else {
                pageKeys.forEach((k) => next.add(k));
            }
            onSelectionChange?.([...next]);
            return next;
        });
    }, [allPageSelected, pageKeys, onSelectionChange]);
    const selectAll = useCallback(() => {
        setSelectAllMatching(true);
        const next = new Set(allMatchingKeys);
        setSelected(next);
        onSelectionChange?.([...next]);
    }, [allMatchingKeys, onSelectionChange]);
    const clearSelection = useCallback(() => {
        setSelectAllMatching(false);
        setSelected(new Set());
        onSelectionChange?.([]);
    }, [onSelectionChange]);
    const selectedCount = selectAllMatching ? allMatchingKeys.length : selected.size;
    // ── Pagination helpers ─────────────────────────────────────────────────────────
    /**
     * Builds the visible page range with proper ellipsis:
     *   1 … 47 48 49 … 100
     * Rules:
     *   - Always show page 1 and totalPages
     *   - Always show [page-1, page, page+1] (window of 3)
     *   - Insert ‘…’ wherever there is a gap > 1
     */
    const buildPageRange = () => {
        if (totalPages <= 7) {
            // Small page count — just show all
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const visible = new Set();
        // Always include first and last
        visible.add(1);
        visible.add(totalPages);
        // Include window of 3 around current page
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
            visible.add(i);
        }
        const sorted = [...visible].sort((a, b) => a - b);
        const result = [];
        for (let i = 0; i < sorted.length; i++) {
            result.push(sorted[i]);
            if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) {
                result.push("...");
            }
        }
        return result;
    };
    // Direct page input
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
    // ── Persist toolbar state to localStorage ────────────────────────────────────
    useEffect(() => {
        try {
            localStorage.setItem(`${tableStorageKey}:density`, density);
        }
        catch { }
    }, [density, tableStorageKey]);
    useEffect(() => {
        try {
            localStorage.setItem(`${tableStorageKey}:hiddenCols`, JSON.stringify([...hiddenCols]));
        }
        catch { }
    }, [hiddenCols, tableStorageKey]);
    // ── Sort ──────────────────────────────────────────────────────────────────────
    const handleSort = (key) => {
        let nextKey = key;
        let nextDir = "asc";
        if (sortKey !== key) {
            setSortKey(key);
            setSortDir("asc");
        }
        else if (sortDir === "asc") {
            setSortDir("desc");
            nextDir = "desc";
        }
        else {
            setSortKey(null);
            setSortDir(null);
            nextKey = null;
            nextDir = null;
        }
        setPage(1);
        onSortChange?.(nextKey, nextDir);
        onPageChange?.(1);
    };
    const sortIcon = (key) => {
        if (sortKey !== key)
            return _jsx("i", { className: "ti ti-selector dt-sort-icon", "aria-hidden": "true" });
        if (sortDir === "asc")
            return (_jsx("i", { className: "ti ti-sort-ascending dt-sort-icon dt-sort-icon--active", "aria-hidden": "true" }));
        return (_jsx("i", { className: "ti ti-sort-descending dt-sort-icon dt-sort-icon--active", "aria-hidden": "true" }));
    };
    // ── Pagination helpers ─────────────────────────────────────────────────────────
    const pageRange = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || Math.abs(i - page) <= 1)
                pages.push(i);
            else if (pages[pages.length - 1] !== "...")
                pages.push("...");
        }
        return pages;
    };
    const totalRecords = serverSide ? (totalCount ?? data.length) : processed.length;
    const fromRow = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
    const toRow = Math.min(page * pageSize, totalRecords);
    const showActions = actions.length > 0;
    const hasActiveFilters = !!(search || Object.values(activeFilters).some(Boolean));
    const totalCols = visibleColumns.length + (selectable ? 1 : 0) + (showActions ? 1 : 0);
    // ── Derived display values ─────────────────────────────────────────────────
    // Count of active filter dropdowns (excludes search, which has its own chip)
    const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;
    // Total badges: search counts as 1, each active filter counts as 1
    const totalActiveCount = (search ? 1 : 0) + activeFilterCount;
    // Human-readable sort label for the sort chip
    const sortLabel = useMemo(() => {
        if (!sortKey || !sortDir)
            return null;
        const col = columns.find((c) => c.key === sortKey);
        const dirLabel = sortDir === "asc" ? "↑ A→Z" : "↓ Z→A";
        return col ? `${col.label} ${dirLabel}` : `${sortKey} ${dirLabel}`;
    }, [sortKey, sortDir, columns]);
    // True when all filters+search are active but produced 0 results
    const hasNoResults = !loading && !serverSide && hasActiveFilters && processed.length === 0;
    // ── Operation Handlers ─────────────────────────────────────────────────────────
    const handlePageChange = (p) => {
        setPage(p);
        onPageChange?.(p);
    };
    const handlePageSizeChange = (size) => {
        setPageSize(size);
        setPage(1);
        onPageSizeChange?.(size);
        onPageChange?.(1);
    };
    const handleSearchChange = (val) => {
        setSearch(val);
        setPage(1);
        onSearchChange?.(val);
        onPageChange?.(1);
    };
    const handleFilterChange = (key, val) => {
        const nextFilters = { ...activeFilters, [key]: val };
        if (!val) {
            delete nextFilters[key];
        }
        setActiveFilters(nextFilters);
        setPage(1);
        onFilterChange?.(nextFilters);
        onPageChange?.(1);
    };
    const removeFilter = (key) => {
        const nextFilters = { ...activeFilters };
        delete nextFilters[key];
        setActiveFilters(nextFilters);
        setPage(1);
        onFilterChange?.(nextFilters);
        onPageChange?.(1);
    };
    const clearAllFilters = () => {
        setSearch("");
        setActiveFilters({});
        setPage(1);
        onSearchChange?.("");
        onFilterChange?.({});
        onPageChange?.(1);
    };
    // ── Bulk action ────────────────────────────────────────────────────────────────
    const handleBulkAction = (action) => {
        const keys = selectAllMatching ? allMatchingKeys : [...selected];
        if (action.destructive) {
            setConfirm({
                message: `You are about to delete ${keys.length} record${keys.length !== 1 ? "s" : ""}. This cannot be undone.`,
                onConfirm: () => {
                    action.onClick(keys);
                    clearSelection();
                    setConfirm(null);
                    toast.error(`${keys.length} record${keys.length !== 1 ? "s" : ""} deleted.`);
                },
            });
        }
        else {
            const snapshot = [...keys];
            action.onClick(keys);
            clearSelection();
            if (action.undoable) {
                toast.success(`Action applied to ${keys.length} record${keys.length !== 1 ? "s" : ""}.`, "Success", "Undo", () => {
                    const restored = new Set(snapshot);
                    setSelected(restored);
                    onSelectionChange?.([...restored]);
                });
            }
            else {
                toast.success(`Action applied to ${keys.length} record${keys.length !== 1 ? "s" : ""}.`);
            }
        }
    };
    // ── Export ─────────────────────────────────────────────────────────────────────
    const handleExport = () => {
        const rows = selectAllMatching || selected.size === 0
            ? processed
            : processed.filter((r) => selected.has(r[rowKey]));
        if (onExport) {
            onExport(rows, visibleColumns);
        }
        else {
            defaultCSVExport(rows, visibleColumns);
        }
        toast.success(`Exported ${rows.length} record${rows.length !== 1 ? "s" : ""} to CSV.`);
    };
    const densityClass = {
        compact: "dt-root--compact",
        regular: "",
        relaxed: "dt-root--relaxed",
    }[density];
    // ── Virtualization window ─────────────────────────────────────────────────
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { virtualStart, virtualEnd, totalHeight, offsetY } = useVirtualRows(tableWrapRef, paginated.length, estimatedRowHeight);
    const virtualRows = paginated.slice(virtualStart, virtualEnd);
    // ── Render ─────────────────────────────────────────────────────────────────────
    return (_jsxs("div", { className: `dt-root ${densityClass} ${className}`, children: [_jsxs("div", { className: "dt-toolbar", children: [_jsxs("div", { className: "dt-toolbar-left", children: [_jsxs("div", { className: "dt-search-wrap", children: [_jsx("i", { className: "ti ti-search dt-search-icon", "aria-hidden": "true" }), _jsx("input", { id: "dt-search-input", type: "text", className: "dt-search", placeholder: searchPlaceholder, value: search, onChange: (e) => handleSearchChange(e.target.value), "aria-label": "Search records" }), search && (_jsx("button", { className: "dt-search-clear", "aria-label": "Clear search", onClick: () => handleSearchChange(""), children: _jsx("i", { className: "ti ti-x", "aria-hidden": "true" }) }))] }), filters.map((f) => (_jsxs("select", { className: "dt-filter-select", "aria-label": f.label, value: activeFilters[f.key] ?? "", onChange: (e) => handleFilterChange(f.key, e.target.value), children: [_jsx("option", { value: "", children: f.label }), f.options.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))] }, f.key))), totalActiveCount > 0 && (_jsxs("span", { className: "dt-filter-count-badge", "aria-label": `${totalActiveCount} active filter${totalActiveCount !== 1 ? 's' : ''}`, children: [_jsx("i", { className: "ti ti-filter", "aria-hidden": "true" }), totalActiveCount, " filter", totalActiveCount !== 1 ? 's' : '', _jsx("button", { className: "dt-filter-count-clear", onClick: clearAllFilters, "aria-label": "Clear all filters", title: "Clear all filters", children: _jsx("i", { className: "ti ti-x", "aria-hidden": "true" }) })] })), filters.length > 0 && (_jsxs("div", { className: "dt-preset-wrap", ref: presetPanelRef, children: [_jsxs("button", { className: "dt-btn dt-btn--ghost dt-btn--icon", title: "Saved filter presets", "aria-label": "Saved filter presets", "aria-haspopup": "true", "aria-expanded": showPresets, onClick: () => setShowPresets((p) => !p), children: [_jsx("i", { className: "ti ti-bookmark", "aria-hidden": "true" }), presets.length > 0 && (_jsx("span", { className: "dt-preset-count", children: presets.length }))] }), showPresets && (_jsxs("div", { className: "dt-preset-panel", role: "dialog", "aria-label": "Filter presets", children: [_jsxs("p", { className: "dt-preset-panel-title", children: [_jsx("i", { className: "ti ti-bookmark", "aria-hidden": "true" }), " Saved Presets"] }), _jsxs("div", { className: "dt-preset-save-row", children: [_jsx("input", { type: "text", className: "dt-preset-name-input", placeholder: "Name this preset\u2026", value: presetName, onChange: (e) => setPresetName(e.target.value), onKeyDown: (e) => e.key === "Enter" && savePreset(), maxLength: 40 }), _jsxs("button", { className: "dt-btn dt-btn--primary dt-preset-save-btn", onClick: savePreset, disabled: !presetName.trim(), title: "Save current filters as preset", children: [_jsx("i", { className: "ti ti-plus", "aria-hidden": "true" }), " Save"] })] }), presets.length === 0 ? (_jsx("p", { className: "dt-preset-empty", children: "No saved presets yet." })) : (_jsx("ul", { className: "dt-preset-list", children: presets.map((preset) => (_jsxs("li", { className: "dt-preset-item", children: [_jsxs("button", { className: "dt-preset-apply", onClick: () => applyPreset(preset), children: [_jsx("i", { className: "ti ti-filter", "aria-hidden": "true" }), _jsx("span", { className: "dt-preset-item-name", children: preset.name }), preset.search && (_jsx("span", { className: "dt-preset-item-meta", children: "+search" })), Object.keys(preset.filters).length > 0 && (_jsxs("span", { className: "dt-preset-item-meta", children: [Object.keys(preset.filters).length, " filter", Object.keys(preset.filters).length !== 1 ? 's' : ''] }))] }), _jsx("button", { className: "dt-preset-delete", onClick: (e) => deletePreset(preset.id, e), "aria-label": `Delete preset ${preset.name}`, title: "Delete preset", children: _jsx("i", { className: "ti ti-trash", "aria-hidden": "true" }) })] }, preset.id))) }))] }))] }))] }), _jsxs("div", { className: "dt-toolbar-right", children: [densityToggle && (_jsx("div", { className: "dt-density-group", role: "group", "aria-label": "Row density", children: ["compact", "regular", "relaxed"].map((d) => (_jsxs("button", { className: `dt-density-btn${density === d ? " dt-density-btn--active" : ""}`, onClick: () => setDensity(d), title: d.charAt(0).toUpperCase() + d.slice(1), "aria-pressed": density === d, children: [d === "compact" && (_jsx("i", { className: "ti ti-layout-list", "aria-hidden": "true" })), d === "regular" && (_jsx("i", { className: "ti ti-layout-rows", "aria-hidden": "true" })), d === "relaxed" && (_jsx("i", { className: "ti ti-layout-bottombar", "aria-hidden": "true" }))] }, d))) })), columnToggle && (_jsxs("div", { className: "dt-col-toggle-wrap", ref: colToggleRef, children: [_jsx("button", { id: "dt-col-toggle-btn", className: "dt-btn dt-btn--icon", title: "Column visibility", "aria-haspopup": "true", "aria-expanded": showColToggle, onClick: () => setShowColToggle((p) => !p), children: _jsx("i", { className: "ti ti-columns", "aria-hidden": "true" }) }), showColToggle && (_jsxs("div", { className: "dt-col-panel", role: "menu", "aria-labelledby": "dt-col-toggle-btn", children: [_jsx("p", { className: "dt-col-panel-title", children: "Show / Hide Columns" }), columns.map((col) => (_jsxs("label", { className: "dt-col-item", children: [_jsx("input", { type: "checkbox", className: "dt-checkbox", checked: !hiddenCols.has(col.key), onChange: () => setHiddenCols((prev) => {
                                                            const n = new Set(prev);
                                                            n.has(col.key) ? n.delete(col.key) : n.add(col.key);
                                                            return n;
                                                        }) }), _jsx("span", { children: col.label })] }, col.key)))] }))] })), exportable && (_jsxs("button", { id: "dt-export-btn", className: "dt-btn dt-btn--secondary", onClick: handleExport, title: "Export to CSV", children: [_jsx("i", { className: "ti ti-download", "aria-hidden": "true" }), " Export"] })), createButtons.map((btn, i) => (_jsx(Button, { title: btn.label, variant: btn.variant === "secondary" ? "secondary" : "primary", size: "sm", onClick: btn.onClick }, i)))] })] }), (hasActiveFilters || sortLabel) && (_jsxs("div", { className: "dt-filter-chips", "aria-label": "Active filters", children: [search && (_jsxs("span", { className: "dt-chip", children: [_jsx("i", { className: "ti ti-search", "aria-hidden": "true" }), "Search: ", _jsx("strong", { children: search }), _jsx("button", { className: "dt-chip-remove", "aria-label": "Clear search", onClick: () => handleSearchChange(""), children: _jsx("i", { className: "ti ti-x", "aria-hidden": "true" }) })] })), Object.entries(activeFilters).map(([key, val]) => {
                        if (!val)
                            return null;
                        const filterDef = filters.find((f) => f.key === key);
                        const optLabel = filterDef?.options.find((o) => o.value === val)?.label ?? val;
                        return (_jsxs("span", { className: "dt-chip", children: [_jsx("i", { className: "ti ti-filter", "aria-hidden": "true" }), filterDef?.label, ": ", _jsx("strong", { children: optLabel }), _jsx("button", { className: "dt-chip-remove", "aria-label": `Remove ${filterDef?.label} filter`, onClick: () => removeFilter(key), children: _jsx("i", { className: "ti ti-x", "aria-hidden": "true" }) })] }, key));
                    }), sortLabel && (_jsxs("span", { className: "dt-chip dt-chip--sort", children: [_jsx("i", { className: "ti ti-arrows-sort", "aria-hidden": "true" }), "Sorted by: ", _jsx("strong", { children: sortLabel }), _jsx("button", { className: "dt-chip-remove", "aria-label": "Clear sort", onClick: () => {
                                    setSortKey(null);
                                    setSortDir(null);
                                    onSortChange?.(null, null);
                                }, children: _jsx("i", { className: "ti ti-x", "aria-hidden": "true" }) })] })), (hasActiveFilters) && (_jsxs("button", { className: "dt-btn dt-btn--ghost dt-chip-clear-all", onClick: clearAllFilters, children: [_jsx("i", { className: "ti ti-refresh", "aria-hidden": "true" }), " Clear all"] }))] })), hasNoResults && (_jsxs("div", { className: "dt-no-results-banner", role: "status", "aria-live": "polite", children: [_jsxs("div", { className: "dt-no-results-left", children: [_jsx("i", { className: "ti ti-search-off dt-no-results-icon", "aria-hidden": "true" }), _jsxs("span", { className: "dt-no-results-text", children: ["No results for", " ", search && _jsxs("strong", { children: ["\u201C", search, "\u201D"] }), search && activeFilterCount > 0 && " with ", activeFilterCount > 0 && (_jsxs("strong", { children: [activeFilterCount, " active filter", activeFilterCount !== 1 ? "s" : ""] }))] })] }), _jsxs("button", { className: "dt-no-results-clear", onClick: clearAllFilters, "aria-label": "Clear all filters and search", children: [_jsx("i", { className: "ti ti-x", "aria-hidden": "true" }), " Clear filters"] })] })), selectable && selectedCount > 0 && (_jsxs("div", { className: "dt-bulk-bar", role: "toolbar", "aria-label": "Bulk actions", children: [_jsxs("div", { className: "dt-bulk-bar-left", children: [_jsxs("span", { className: "dt-bulk-count", children: [_jsx("i", { className: "ti ti-checkbox", "aria-hidden": "true" }), _jsx("strong", { children: selectedCount }), " row", selectedCount !== 1 ? "s" : "", " ", "selected"] }), !selectAllMatching && allMatchingKeys.length > pageSize && (_jsxs("button", { className: "dt-bulk-select-all", onClick: selectAll, children: ["Select all ", _jsx("strong", { children: allMatchingKeys.length }), " matching results"] })), selectAllMatching && (_jsxs("span", { className: "dt-bulk-all-badge", children: [_jsx("i", { className: "ti ti-check", "aria-hidden": "true" }), "All ", allMatchingKeys.length, " results selected"] }))] }), _jsxs("div", { className: "dt-bulk-actions", children: [bulkActions.map((action, i) => (_jsxs("button", { className: `dt-btn${action.variant === "danger" ? " dt-btn--danger" : " dt-btn--secondary"}`, onClick: () => handleBulkAction(action), children: [action.icon && _jsx("i", { className: `ti ${action.icon}`, "aria-hidden": "true" }), action.label] }, i))), _jsxs("button", { className: "dt-btn dt-btn--ghost", onClick: clearSelection, "aria-label": "Clear selection", children: [_jsx("i", { className: "ti ti-x", "aria-hidden": "true" }), " Deselect"] })] })] })), _jsx("div", { className: "dt-table-wrap", ref: tableWrapRef, children: _jsxs("table", { className: "dt-table", "aria-label": "Data table", children: [_jsx("thead", { children: _jsxs("tr", { children: [selectable && (_jsx("th", { className: "dt-th dt-th--check dt-th--sticky-left", children: _jsx("input", { type: "checkbox", className: "dt-checkbox", checked: allPageSelected, ref: (el) => {
                                                if (el)
                                                    el.indeterminate = somePageSelected && !allPageSelected;
                                            }, onChange: toggleAll, "aria-label": "Select all on this page" }) })), visibleColumns.map((col) => {
                                        const resolvedWidth = getColWidth(col.key, col.width);
                                        return (_jsxs("th", { className: [
                                                "dt-th",
                                                col.sortable ? "dt-th--sortable" : "",
                                                sortKey === col.key ? "dt-th--sorted" : "",
                                                col.frozen ? "dt-th--frozen" : "",
                                            ]
                                                .filter(Boolean)
                                                .join(" "), style: {
                                                width: resolvedWidth,
                                                minWidth: resolvedWidth,
                                                maxWidth: resolvedWidth,
                                                textAlign: col.align ?? "left",
                                                ...(col.frozen ? { left: selectable ? "40px" : "0" } : {}),
                                            }, onClick: col.sortable ? () => handleSort(col.key) : undefined, "aria-sort": col.sortable
                                                ? sortKey === col.key
                                                    ? sortDir === "asc"
                                                        ? "ascending"
                                                        : "descending"
                                                    : "none"
                                                : undefined, scope: "col", children: [_jsxs("span", { className: "dt-th-inner", children: [col.label, col.sortable && sortIcon(col.key)] }), _jsx("span", { className: "dt-resize-handle", onMouseDown: (e) => onResizeStart(e, col.key, resolvedWidth), "aria-hidden": "true", title: "Drag to resize column" })] }, col.key));
                                    }), showActions && (_jsx("th", { className: "dt-th dt-th--actions", style: { textAlign: "right" }, children: "Actions" }))] }) }), _jsx("tbody", { children: loading ? (Array.from({ length: pageSize }).map((_, i) => (_jsxs("tr", { className: "dt-row dt-row--skeleton", children: [selectable && (_jsx("td", { className: "dt-td dt-td--check", children: _jsx("div", { className: "dt-skeleton dt-skeleton--sm" }) })), visibleColumns.map((col) => (_jsx("td", { className: "dt-td", children: _jsx("div", { className: "dt-skeleton", style: {
                                                width: `${55 + ((i * 17 + col.key.length * 7) % 35)}%`,
                                            } }) }, col.key))), showActions && (_jsx("td", { className: "dt-td", children: _jsx("div", { className: "dt-skeleton dt-skeleton--sm", style: { marginLeft: "auto" } }) }))] }, i)))) : paginated.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: totalCols, className: "dt-td dt-empty", children: _jsxs("div", { className: "dt-empty-inner", children: [_jsx("div", { className: "dt-empty-icon-wrap", children: _jsx("i", { className: "ti ti-inbox", "aria-hidden": "true" }) }), _jsx("p", { className: "dt-empty-title", children: hasActiveFilters ? "No results match your filters" : emptyMessage }), _jsx("p", { className: "dt-empty-sub", children: hasActiveFilters
                                                    ? "Try adjusting or removing your active filters."
                                                    : "Create a new record to get started." }), hasActiveFilters && (_jsxs("button", { className: "dt-btn dt-btn--secondary dt-empty-action", onClick: clearAllFilters, children: [_jsx("i", { className: "ti ti-refresh", "aria-hidden": "true" }), " Clear Filters"] }))] }) }) })) : (_jsxs(_Fragment, { children: [totalHeight !== null && offsetY > 0 && (_jsx("tr", { "aria-hidden": "true", style: { height: offsetY }, children: _jsx("td", { colSpan: totalCols, style: { padding: 0, border: 0 } }) })), virtualRows.map((row) => {
                                        const key = row[rowKey];
                                        const isSelected = selectAllMatching || selected.has(key);
                                        return (_jsxs("tr", { className: `dt-row${isSelected ? " dt-row--selected" : ""}`, "aria-selected": selectable ? isSelected : undefined, children: [selectable && (_jsx("td", { className: "dt-td dt-td--check dt-td--sticky-left", children: _jsx("input", { type: "checkbox", className: "dt-checkbox", checked: isSelected, onChange: () => toggleRow(key), "aria-label": `Select row ${key}` }) })), visibleColumns.map((col) => (_jsx("td", { className: ["dt-td", col.frozen ? "dt-td--frozen" : ""]
                                                        .filter(Boolean)
                                                        .join(" "), style: {
                                                        textAlign: col.align ?? "left",
                                                        ...(col.frozen ? { left: selectable ? "40px" : "0" } : {}),
                                                    }, children: col.render
                                                        ? col.render(row)
                                                        : String(getValue(row, col.key) ?? "\u2014") }, col.key))), showActions && (_jsx("td", { className: "dt-td dt-td--actions", children: _jsx(ActionMenu, { row: row, actions: actions }) }))] }, key));
                                    }), totalHeight !== null && (() => {
                                        const bottomSpace = totalHeight - offsetY - (virtualEnd - virtualStart) * estimatedRowHeight;
                                        return bottomSpace > 0 ? (_jsx("tr", { "aria-hidden": "true", style: { height: bottomSpace }, children: _jsx("td", { colSpan: totalCols, style: { padding: 0, border: 0 } }) })) : null;
                                    })()] })) })] }) }), _jsxs("nav", { className: "dt-pagination", "aria-label": "Table pagination", onKeyDown: (e) => {
                    // Keyboard arrow navigation — only when focus is inside pagination nav
                    if (e.key === "ArrowLeft" && page > 1) {
                        e.preventDefault();
                        handlePageChange(page - 1);
                    }
                    else if (e.key === "ArrowRight" && page < totalPages) {
                        e.preventDefault();
                        handlePageChange(page + 1);
                    }
                    else if (e.key === "Home") {
                        e.preventDefault();
                        handlePageChange(1);
                    }
                    else if (e.key === "End") {
                        e.preventDefault();
                        handlePageChange(totalPages);
                    }
                }, children: [_jsx("span", { className: "dt-page-info", children: totalRecords === 0
                            ? "No records"
                            : `Showing ${fromRow}–${toRow} of ${totalRecords.toLocaleString()} records` }), _jsxs("div", { className: "dt-pagination-controls", children: [_jsx("span", { className: "dt-page-size-label", children: "Rows per page" }), _jsx("select", { className: "dt-page-size-select", value: pageSize, "aria-label": "Rows per page", onChange: (e) => handlePageSizeChange(Number(e.target.value)), children: pageSizeOptions.map((n) => (_jsx("option", { value: n, children: n }, n))) }), _jsxs("div", { className: "dt-page-btns", role: "group", "aria-label": "Page navigation", children: [_jsx("button", { className: "dt-page-btn dt-page-btn--icon", disabled: page === 1, onClick: () => handlePageChange(1), "aria-label": "First page", title: "First page", children: _jsx("i", { className: "ti ti-chevrons-left", "aria-hidden": "true" }) }), _jsx("button", { className: "dt-page-btn dt-page-btn--icon", disabled: page === 1, onClick: () => handlePageChange(page - 1), "aria-label": "Previous page", title: "Previous page (Left arrow)", children: _jsx("i", { className: "ti ti-chevron-left", "aria-hidden": "true" }) }), _jsx("span", { className: "dt-page-btns-inner", children: buildPageRange().map((p, i) => p === "..." ? (_jsx("span", { className: "dt-page-ellipsis", "aria-hidden": "true", children: "\u2026" }, `ellipsis-${i}`)) : (_jsx("button", { className: `dt-page-btn${p === page ? " dt-page-btn--active" : ""}`, onClick: () => handlePageChange(p), "aria-label": `Page ${p}`, "aria-current": p === page ? "page" : undefined, children: p }, p))) }), _jsx("button", { className: "dt-page-btn dt-page-btn--icon", disabled: page === totalPages, onClick: () => handlePageChange(page + 1), "aria-label": "Next page", title: "Next page (Right arrow)", children: _jsx("i", { className: "ti ti-chevron-right", "aria-hidden": "true" }) }), _jsx("button", { className: "dt-page-btn dt-page-btn--icon", disabled: page === totalPages, onClick: () => handlePageChange(totalPages), "aria-label": "Last page", title: "Last page", children: _jsx("i", { className: "ti ti-chevrons-right", "aria-hidden": "true" }) })] }), totalPages > 1 && (_jsxs("div", { className: "dt-page-jump", "aria-label": "Jump to page", children: [_jsx("label", { htmlFor: "dt-page-jump-input", className: "dt-page-size-label", children: "Go to" }), _jsx("input", { id: "dt-page-jump-input", type: "number", min: 1, max: totalPages, className: "dt-page-jump-input", placeholder: String(page), value: pageInputFocused ? pageInputVal : "", "aria-label": `Go to page (1–${totalPages})`, onFocus: () => { setPageInputFocused(true); setPageInputVal(""); }, onChange: (e) => setPageInputVal(e.target.value), onBlur: commitPageInput, onKeyDown: (e) => {
                                            if (e.key === "Enter")
                                                commitPageInput();
                                            if (e.key === "Escape") {
                                                setPageInputVal("");
                                                setPageInputFocused(false);
                                            }
                                        } })] }))] }), _jsxs("div", { className: "dt-pagination-mobile", "aria-hidden": "true", children: [_jsx("button", { className: "dt-page-btn dt-page-btn--icon", disabled: page === 1, onClick: () => handlePageChange(page - 1), "aria-label": "Previous page", children: _jsx("i", { className: "ti ti-chevron-left", "aria-hidden": "true" }) }), _jsxs("span", { className: "dt-page-mobile-label", children: ["Page ", _jsx("strong", { children: page }), " of ", totalPages] }), _jsx("button", { className: "dt-page-btn dt-page-btn--icon", disabled: page === totalPages, onClick: () => handlePageChange(page + 1), "aria-label": "Next page", children: _jsx("i", { className: "ti ti-chevron-right", "aria-hidden": "true" }) })] })] }), confirm && (_jsx(ConfirmModal, { isOpen: !!confirm, title: "Confirm Action", message: confirm.message, variant: "danger", confirmLabel: "Confirm Delete", loading: confirmLoading, onCancel: () => {
                    if (!confirmLoading)
                        setConfirm(null);
                }, onConfirm: async () => {
                    setConfirmLoading(true);
                    try {
                        // Simulate API request delay for visual spinner feedback
                        await new Promise((resolve) => setTimeout(resolve, 1200));
                        confirm.onConfirm();
                    }
                    finally {
                        setConfirmLoading(false);
                        setConfirm(null);
                    }
                } }))] }));
}
export default DataTable;
//# sourceMappingURL=DataTable.js.map