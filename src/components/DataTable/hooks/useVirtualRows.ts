import { useState, useEffect } from "react";

const VIRTUAL_THRESHOLD = 100; // rows — below this, skip virtualization overhead
const OVERSCAN = 5;           // extra rows rendered above/below viewport

export function useVirtualRows(
  containerRef: React.RefObject<HTMLDivElement | null>,
  rowCount: number,
  rowHeight: number // estimated px per row
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || rowCount <= VIRTUAL_THRESHOLD) return;

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
