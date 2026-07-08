import { useEffect, useState } from 'react';
import { splitRiskGuideBody } from '../templates/risk-guide/splitBody';
import {
  getRiskGuideBodyLimit,
  RISK_GUIDE_BODY_WIDTH,
  RISK_GUIDE_CONTINUED_HEADER_H,
  RISK_GUIDE_FIRST_HEADER_H,
  RISK_GUIDE_FOOTER_H,
  RISK_GUIDE_PAGE_INNER_H,
} from '../templates/risk-guide/pagination';

const PAGE_INNER_H = 960;
const HEADER_BLOCK_H = 230;
export const RISK_GUIDE_SUMMARY_OVERHEAD = 130;
const CONTINUED_BLOCK_H = 36;
const EMPTY_CHUNK = [''];

function getBodyLimit(isFirst, extraFirstPageOverhead = 0, riskGuideMode = false) {
  if (riskGuideMode) {
    return getRiskGuideBodyLimit(isFirst);
  }
  const overhead = isFirst ? HEADER_BLOCK_H + extraFirstPageOverhead : CONTINUED_BLOCK_H;
  return Math.max(80, PAGE_INNER_H - overhead);
}

export default function useBodyChunks(
  body,
  measureRef,
  {
    extraFirstPageOverhead = 0,
    disableFixedSplits = false,
    riskGuideMode = false,
    measureWidth = 661,
    measureClassName = 'doc-body-content',
  } = {}
) {
  const [chunks, setChunks] = useState(EMPTY_CHUNK);

  useEffect(() => {
    let cancelled = false;
    let timerId = null;

    const safeSetChunks = (next) => {
      if (!cancelled) setChunks(next.length ? next : EMPTY_CHUNK);
    };

    if (!body?.trim()) {
      safeSetChunks(EMPTY_CHUNK);
      return () => {
        cancelled = true;
      };
    }

    if (!disableFixedSplits) {
      const fixedChunks = splitRiskGuideBody(body);
      if (fixedChunks) {
        safeSetChunks(fixedChunks);
        return () => {
          cancelled = true;
        };
      }
    }

    const container = measureRef.current;
    if (!container) {
      safeSetChunks([body]);
      return () => {
        cancelled = true;
      };
    }

    const run = () => {
      if (cancelled) return;

      const singlePageLimit = getBodyLimit(true, extraFirstPageOverhead, riskGuideMode);

      const children = [...container.children];
      if (!children.length) {
        safeSetChunks([body || '']);
        return;
      }

      let totalH = 0;
      for (const c of children) totalH += c.offsetHeight;

      if (totalH <= singlePageLimit) {
        safeSetChunks([body || '']);
        return;
      }

      const getAttributesString = (el) => {
        const attrs = [];
        for (const attr of el.attributes) {
          attrs.push(`${attr.name}="${attr.value.replace(/"/g, '&quot;')}"`);
        }
        return attrs.length ? ' ' + attrs.join(' ') : '';
      };

      const getTempHeight = (html) => {
        const temp = document.createElement('div');
        temp.className = measureClassName;
        temp.style.width = `${measureWidth}px`;
        temp.innerHTML = html;
        container.parentNode.appendChild(temp);
        const h = temp.offsetHeight;
        container.parentNode.removeChild(temp);
        return h;
      };

      const flatItems = [];
      for (const child of children) {
        if (child.tagName === 'UL' || child.tagName === 'OL') {
          const tag = child.tagName.toLowerCase();
          const attrs = getAttributesString(child);
          const listItems = [...child.children];
          for (const li of listItems) {
            flatItems.push({
              type: 'list-item',
              tagName: tag,
              attributes: attrs,
              html: li.outerHTML,
            });
          }
        } else if (child.tagName === 'TABLE') {
          const attrs = getAttributesString(child);
          const thead = child.querySelector('thead');
          const theadHtml = thead ? thead.outerHTML : '';
          const trs = [];
          const allTrs = child.querySelectorAll('tr');
          for (const tr of allTrs) {
            if (!tr.closest('thead')) {
              trs.push(tr);
            }
          }

          if (trs.length > 0) {
            for (const tr of trs) {
              flatItems.push({
                type: 'table-row',
                tagName: 'table',
                attributes: attrs,
                theadHtml: theadHtml,
                html: tr.outerHTML,
              });
            }
          } else {
            flatItems.push({
              type: 'block',
              html: child.outerHTML,
            });
          }
        } else {
          flatItems.push({
            type: 'block',
            html: child.outerHTML,
          });
        }
      }

      const renderItems = (items) => {
        let html = '';
        let currentMode = 'none';
        let currentTag = '';
        let currentAttrs = '';
        let currentThead = '';

        const closeActiveContainer = () => {
          if (currentMode === 'list') {
            html += `</${currentTag}>`;
          } else if (currentMode === 'table') {
            html += `</tbody></${currentTag}>`;
          }
          currentMode = 'none';
          currentTag = '';
          currentAttrs = '';
          currentThead = '';
        };

        for (const item of items) {
          if (item.type === 'list-item') {
            if (
              currentMode !== 'list' ||
              currentTag !== item.tagName ||
              currentAttrs !== item.attributes
            ) {
              closeActiveContainer();
              html += `<${item.tagName}${item.attributes}>`;
              currentMode = 'list';
              currentTag = item.tagName;
              currentAttrs = item.attributes;
            }
            html += item.html;
          } else if (item.type === 'table-row') {
            if (
              currentMode !== 'table' ||
              currentTag !== item.tagName ||
              currentAttrs !== item.attributes ||
              currentThead !== item.theadHtml
            ) {
              closeActiveContainer();
              html += `<${item.tagName}${item.attributes}>`;
              if (item.theadHtml) {
                html += item.theadHtml;
              }
              html += '<tbody>';
              currentMode = 'table';
              currentTag = item.tagName;
              currentAttrs = item.attributes;
              currentThead = item.theadHtml;
            }
            html += item.html;
          } else {
            closeActiveContainer();
            html += item.html;
          }
        }
        closeActiveContainer();
        return html;
      };

      const result = [];
      let currentPageItems = [];
      let isFirst = true;

      for (let i = 0; i < flatItems.length; i++) {
        if (cancelled) return;

        const item = flatItems[i];
        const testItems = [...currentPageItems, item];
        const testHtml = renderItems(testItems);
        const h = getTempHeight(testHtml);

        const remainingItems = flatItems.slice(i + 1);

        let limit = getBodyLimit(isFirst, extraFirstPageOverhead, riskGuideMode);

        if (remainingItems.length > 0) {
          const remainingHtml = renderItems(remainingItems);
          const remainingH = getTempHeight(remainingHtml);
          if (remainingH > 80) {
            const pageInner = riskGuideMode ? RISK_GUIDE_PAGE_INNER_H : PAGE_INNER_H;
            const continuedOverhead = riskGuideMode
              ? RISK_GUIDE_CONTINUED_HEADER_H + RISK_GUIDE_FOOTER_H
              : CONTINUED_BLOCK_H;
            const firstOverhead = riskGuideMode
              ? RISK_GUIDE_FIRST_HEADER_H + RISK_GUIDE_FOOTER_H
              : HEADER_BLOCK_H + extraFirstPageOverhead;
            limit = pageInner - (isFirst ? firstOverhead : continuedOverhead);
          }
        }

        if (h > limit && currentPageItems.length > 0) {
          result.push(renderItems(currentPageItems));
          currentPageItems = [item];
          isFirst = false;
        } else {
          currentPageItems.push(item);
        }
      }

      if (cancelled) return;

      if (currentPageItems.length > 0) {
        result.push(renderItems(currentPageItems));
      }

      safeSetChunks(result.length ? result : [body || '']);
    };

    const debouncedRun = () => {
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => {
        document.fonts.ready.then(() => {
          if (!cancelled) requestAnimationFrame(run);
        });
      }, 100);
    };

    debouncedRun();

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [
    body,
    measureRef,
    extraFirstPageOverhead,
    disableFixedSplits,
    riskGuideMode,
    measureWidth,
    measureClassName,
  ]);

  return chunks;
}
