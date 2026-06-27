import { useCallback, useEffect, useRef, useState } from 'react';

export const A4_WIDTH = 794;
export const DEFAULT_SCALE = 0.72;

export default function ScaledPreview({ children, maxScale = DEFAULT_SCALE, active = true }) {
  const wrapperRef = useRef(null);
  const outerRef = useRef(null);
  const [scale, setScale] = useState(maxScale);

  const updateScale = useCallback(() => {
    const scrollParent = outerRef.current?.parentElement;
    if (!scrollParent) return;
    const available = scrollParent.clientWidth - 32;
    if (available <= 0) return;
    const computed = Math.min(maxScale, available / A4_WIDTH);
    setScale(Math.max(0.35, computed));
  }, [maxScale]);

  useEffect(() => {
    if (!active) return;
    const scrollParent = outerRef.current?.parentElement;
    if (!scrollParent) return;

    updateScale();
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(updateScale);
    });

    const observer = new ResizeObserver(updateScale);
    observer.observe(scrollParent);
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [maxScale, active, updateScale]);

  useEffect(() => {
    if (!active || !wrapperRef.current || !outerRef.current) return;

    const updateHeight = () => {
      const h = wrapperRef.current.offsetHeight;
      outerRef.current.style.height = `${h * scale}px`;
      outerRef.current.style.width = `${A4_WIDTH * scale}px`;
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [scale, children, active]);

  useEffect(() => {
    if (!active) return;
    outerRef.current?.parentElement?.scrollTo(0, 0);
  }, [scale, active]);

  return (
    <div ref={outerRef} className="preview-scale-outer" style={{ width: `${A4_WIDTH * scale}px` }}>
      <div
        ref={wrapperRef}
        className="preview-scale-wrapper"
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
