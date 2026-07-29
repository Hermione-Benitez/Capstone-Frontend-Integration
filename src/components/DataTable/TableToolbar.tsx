import React from "react";
import Button from "../Buttons";
import SearchBar from "../SearchBar";
import { FilterConfig, CreateButton, FilterPreset, DensityMode, ColumnDef } from "./types";

export interface TableToolbarProps<T> {
  search: string;
  searchPlaceholder: string;
  handleSearchChange: (val: string) => void;
  filters: FilterConfig[];
  activeFilters: Record<string, string>;
  handleFilterChange: (key: string, val: string) => void;
  totalActiveCount: number;
  clearAllFilters: () => void;
  presets: FilterPreset[];
  showPresets: boolean;
  setShowPresets: React.Dispatch<React.SetStateAction<boolean>>;
  presetPanelRef: React.RefObject<HTMLDivElement | null>;
  presetName: string;
  setPresetName: React.Dispatch<React.SetStateAction<string>>;
  savePreset: () => void;
  applyPreset: (preset: FilterPreset) => void;
  deletePreset: (id: string, e: React.MouseEvent) => void;
  densityToggle: boolean;
  density: DensityMode;
  setDensity: (d: DensityMode) => void;
  columnToggle: boolean;
  colToggleRef: React.RefObject<HTMLDivElement | null>;
  showColToggle: boolean;
  setShowColToggle: React.Dispatch<React.SetStateAction<boolean>>;
  columns: ColumnDef<T>[];
  hiddenCols: Set<string>;
  setHiddenCols: React.Dispatch<React.SetStateAction<Set<string>>>;
  exportable: boolean;
  handleExport: () => void;
  createButtons: CreateButton[];
}

export function TableToolbar<T>({
  search,
  searchPlaceholder,
  handleSearchChange,
  filters,
  activeFilters,
  handleFilterChange,
  totalActiveCount,
  clearAllFilters,
  presets,
  showPresets,
  setShowPresets,
  presetPanelRef,
  presetName,
  setPresetName,
  savePreset,
  applyPreset,
  deletePreset,
  densityToggle,
  density,
  setDensity,
  columnToggle,
  colToggleRef,
  showColToggle,
  setShowColToggle,
  columns,
  hiddenCols,
  setHiddenCols,
  exportable,
  handleExport,
  createButtons,
}: TableToolbarProps<T>) {
  return (
    <div className="dt-toolbar">
      <div className="dt-toolbar-left">
        <div className="dt-search-wrap">
          <SearchBar
            id="dt-search-input"
            variant="sm"
            placeholder={searchPlaceholder}
            value={search}
            onChange={handleSearchChange}
            onClear={() => handleSearchChange("")}
          />
        </div>

        {filters.map((f) => (
          <select
            key={f.key}
            className="dt-filter-select"
            aria-label={f.label}
            value={activeFilters[f.key] ?? ""}
            onChange={(e) => handleFilterChange(f.key, e.target.value)}
          >
            <option value="">{f.label}</option>
            {f.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}

        {totalActiveCount > 0 && (
          <span className="dt-filter-count-badge" aria-label={`${totalActiveCount} active filter${totalActiveCount !== 1 ? 's' : ''}`}>
            <i className="ti ti-filter" aria-hidden="true" />
            {totalActiveCount} filter{totalActiveCount !== 1 ? 's' : ''}
            <button
              className="dt-filter-count-clear"
              onClick={clearAllFilters}
              aria-label="Clear all filters"
              title="Clear all filters"
            >
              <i className="ti ti-x" aria-hidden="true" />
            </button>
          </span>
        )}

        {filters.length > 0 && (
          <div className="dt-preset-wrap" ref={presetPanelRef}>
            <Button
              title="Saved filter presets"
              iconOnly
              icon="ti-bookmark"
              variant="ghost"
              size="sm"
              aria-haspopup="true"
              aria-expanded={showPresets}
              onClick={() => setShowPresets((p) => !p)}
            />
            {presets.length > 0 && (
              <span className="dt-preset-count">{presets.length}</span>
            )}

            {showPresets && (
              <div className="dt-preset-panel" role="dialog" aria-label="Filter presets">
                <p className="dt-preset-panel-title">
                  <i className="ti ti-bookmark" aria-hidden="true" /> Saved Presets
                </p>

                <div className="dt-preset-save-row">
                  <input
                    type="text"
                    className="dt-preset-name-input"
                    placeholder="Name this preset…"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && savePreset()}
                    maxLength={40}
                  />
                  <Button
                    title="Save"
                    icon="ti-plus"
                    variant="primary"
                    size="sm"
                    className="dt-preset-save-btn"
                    onClick={savePreset}
                    disabled={!presetName.trim()}
                  />
                </div>

                {presets.length === 0 ? (
                  <p className="dt-preset-empty">No saved presets yet.</p>
                ) : (
                  <ul className="dt-preset-list">
                    {presets.map((preset) => (
                      <li key={preset.id} className="dt-preset-item">
                        <button
                          className="dt-preset-apply"
                          onClick={() => applyPreset(preset)}
                        >
                          <i className="ti ti-filter" aria-hidden="true" />
                          <span className="dt-preset-item-name">{preset.name}</span>
                          {preset.search && (
                            <span className="dt-preset-item-meta">+search</span>
                          )}
                          {Object.keys(preset.filters).length > 0 && (
                            <span className="dt-preset-item-meta">
                              {Object.keys(preset.filters).length} filter{Object.keys(preset.filters).length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </button>
                        <Button
                          title={`Delete preset ${preset.name}`}
                          iconOnly
                          icon="ti-trash"
                          variant="ghost"
                          size="sm"
                          className="dt-preset-delete"
                          onClick={(e) => deletePreset(preset.id, e)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="dt-toolbar-right">
        {densityToggle && (
          <div className="dt-density-group" role="group" aria-label="Row density">
            {(["compact", "regular", "relaxed"] as DensityMode[]).map((d) => (
              <button
                key={d}
                className={`dt-density-btn${
                  density === d ? " dt-density-btn--active" : ""
                }`}
                onClick={() => setDensity(d)}
                title={d.charAt(0).toUpperCase() + d.slice(1)}
                aria-pressed={density === d}
              >
                {d === "compact" && (
                  <i className="ti ti-layout-list" aria-hidden="true" />
                )}
                {d === "regular" && (
                  <i className="ti ti-layout-rows" aria-hidden="true" />
                )}
                {d === "relaxed" && (
                  <i className="ti ti-layout-bottombar" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        )}

        {columnToggle && (
          <div className="dt-col-toggle-wrap" ref={colToggleRef}>
            <Button
              id="dt-col-toggle-btn"
              title="Column visibility"
              iconOnly
              icon="ti-columns"
              variant="secondary"
              size="sm"
              aria-haspopup="true"
              aria-expanded={showColToggle}
              onClick={() => setShowColToggle((p) => !p)}
            />
            {showColToggle && (
              <div
                className="dt-col-panel"
                role="menu"
                aria-labelledby="dt-col-toggle-btn"
              >
                <p className="dt-col-panel-title">Show / Hide Columns</p>
                {columns.map((col) => (
                  <label key={col.key} className="dt-col-item">
                    <input
                      type="checkbox"
                      className="dt-checkbox"
                      checked={!hiddenCols.has(col.key)}
                      onChange={() =>
                        setHiddenCols((prev) => {
                          const n = new Set(prev);
                          n.has(col.key) ? n.delete(col.key) : n.add(col.key);
                          return n;
                        })
                      }
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {exportable && (
          <Button
            id="dt-export-btn"
            title="Export"
            icon="ti-download"
            variant="secondary"
            size="sm"
            onClick={handleExport}
          />
        )}

        {createButtons.map((btn, i) => (
          <Button
            key={i}
            title={btn.label}
            icon={btn.icon}
            variant={btn.variant === "secondary" ? "secondary" : "primary"}
            size="sm"
            onClick={btn.onClick}
          />
        ))}
      </div>
    </div>
  );
}

export default TableToolbar;
