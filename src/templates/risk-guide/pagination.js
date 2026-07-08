/** A4(1123px) − 상하 패딩(44+28) */
export const RISK_GUIDE_PAGE_INNER_H = 1051;

/** 푸터(로고+페이지번호+padding-top) */
export const RISK_GUIDE_FOOTER_H = 68;

/** 1페이지 헤더: 제목·메타·정의박스 */
export const RISK_GUIDE_FIRST_HEADER_H = 300;

/** 2페이지 이후 헤더 없음 */
export const RISK_GUIDE_CONTINUED_HEADER_H = 0;

/** 본문 가용 너비: 794 − 좌우 패딩(56×2) */
export const RISK_GUIDE_BODY_WIDTH = 682;

export function getRiskGuideBodyLimit(isFirst) {
  const overhead = isFirst
    ? RISK_GUIDE_FIRST_HEADER_H + RISK_GUIDE_FOOTER_H
    : RISK_GUIDE_CONTINUED_HEADER_H + RISK_GUIDE_FOOTER_H;
  return Math.max(80, RISK_GUIDE_PAGE_INNER_H - overhead);
}
