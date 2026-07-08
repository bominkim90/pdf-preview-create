import { useCallback, useEffect, useRef, useState } from 'react';

export const A4_WIDTH = 794;
export const A4_HEIGHT = 1123;
export const DEFAULT_SCALE = 0.72;
const MIN_SCALE = 0.35;

export default function ScaledPreview({ children, maxScale = DEFAULT_SCALE, active = true }) {
  const wrapperRef = useRef(null);
  const outerRef = useRef(null);
  const [scale, setScale] = useState(maxScale);
  // contentH: wrapper의 실제 높이(px). 결정되기 전에는 A4_HEIGHT를 기본값으로
  const [contentH, setContentH] = useState(A4_HEIGHT);

  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : Math.max(MIN_SCALE, maxScale);

  // ── 가로 scale 계산 ─────────────────────────────────────────────────
  const updateScale = useCallback(() => {
    const scrollParent = outerRef.current?.parentElement;
    if (!scrollParent) return;
    const available = scrollParent.clientWidth - 32;
    if (available <= 0) return;
    const computed = Math.min(maxScale, available / A4_WIDTH);
    setScale(Math.max(MIN_SCALE, computed));
  }, [maxScale]);

  useEffect(() => {
    if (!active) return;
    const scrollParent = outerRef.current?.parentElement;
    if (!scrollParent) return;

    updateScale();
    const rafId = requestAnimationFrame(() => requestAnimationFrame(updateScale));

    const observer = new ResizeObserver(updateScale);
    observer.observe(scrollParent);
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [maxScale, active, updateScale]);

  // ── wrapper 높이 측정 → contentH state 반영 ──────────────────────
  useEffect(() => {
    if (!active) return;

    let rafId = 0;
    let observer;

    const measure = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const h = wrapper.offsetHeight;
      if (h > 0) {
        setContentH(Math.max(h, A4_HEIGHT));
      } else {
        // DOM 아직 페인트 전 — 다음 프레임 재시도
        rafId = requestAnimationFrame(measure);
      }
    };

    rafId = requestAnimationFrame(measure);

    const wrapper = wrapperRef.current;
    if (wrapper) {
      observer = new ResizeObserver(measure);
      observer.observe(wrapper);
    }

    return () => {
      cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
  }, [scale, children, active]);

  useEffect(() => {
    if (!active) return;
    outerRef.current?.parentElement?.scrollTo(0, 0);
  }, [scale, active]);

  const scaledW = A4_WIDTH * safeScale;
  const scaledH = contentH * safeScale;

  return (
    <div
      ref={outerRef}
      className="preview-scale-outer"
      style={{ width: `${scaledW}px`, height: `${scaledH}px` }}
    >
      <div
        ref={wrapperRef}
        className="preview-scale-wrapper"
        style={{ transform: `scale(${safeScale})` }}
      >
        {children}
      </div>
    </div>
  );
}
