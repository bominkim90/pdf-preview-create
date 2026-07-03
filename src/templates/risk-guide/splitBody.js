/** 업무 리스크 관리 템플릿 고정 페이지 분할 마커 */
export const RISK_PAGE_BREAK_HTML = '<div class="risk-page-break"></div>';

const PAGE_BREAK_RE =
  /<div[^>]*class="[^"]*risk-page-break[^"]*"[^>]*>\s*<\/div>/gi;

export function hasRiskPageBreaks(body) {
  return PAGE_BREAK_RE.test(body || '');
}

export function splitRiskGuideBody(body) {
  if (!body?.trim()) return [''];
  PAGE_BREAK_RE.lastIndex = 0;
  if (!PAGE_BREAK_RE.test(body)) return null;
  PAGE_BREAK_RE.lastIndex = 0;
  const parts = body
    .split(PAGE_BREAK_RE)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length ? parts : [''];
}
