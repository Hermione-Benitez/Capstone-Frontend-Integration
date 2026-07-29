import { useState, useRef, useCallback } from "react";

export function useColumnResize(
  columns: { key: string; width?: string }[],
  storageKey: string
) {
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}:colWidths`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const dragState = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  const onResizeStart = useCallback(
    (e: React.MouseEvent, colKey: string, currentWidth: number) => {
      e.preventDefault();
      e.stopPropagation();
      dragState.current = { key: colKey, startX: e.clientX, startWidth: currentWidth };

      const onMove = (me: MouseEvent) => {
        if (!dragState.current) return;
        const delta = me.clientX - dragState.current.startX;
        const newWidth = Math.max(60, dragState.current.startWidth + delta);
        setColWidths((prev) => {
          const next = { ...prev, [dragState.current!.key]: newWidth };
          try { localStorage.setItem(`${storageKey}:colWidths`, JSON.stringify(next)); } catch {}
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
    },
    [storageKey]
  );

  const getColWidth = useCallback(
    (colKey: string, fallbackWidth?: string): number => {
      if (colWidths[colKey] !== undefined) return colWidths[colKey];
      if (fallbackWidth) {
        const px = parseInt(fallbackWidth, 10);
        if (!isNaN(px)) return px;
      }
      return 140; // default column width in px
    },
    [colWidths]
  );

  return { colWidths, getColWidth, onResizeStart };
}
