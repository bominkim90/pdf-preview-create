import { useEffect, useState } from 'react';
import { splitRiskGuideBody } from '../templates/risk-guide/splitBody';

const PAGE_INNER_H = 960;
const HEADER_BLOCK_H = 230;
const CONTINUED_BLOCK_H = 36;

function getBodyLimit(isFirst) {
  const overhead = isFirst ? HEADER_BLOCK_H : CONTINUED_BLOCK_H;
  return Math.max(80, PAGE_INNER_H - overhead);
}

export default function useBodyChunks(body, measureRef) {
  const [chunks, setChunks] = useState(['']);

  useEffect(() => {
    const fixedChunks = splitRiskGuideBody(body);
    if (fixedChunks) {
      setChunks(fixedChunks);
      return;
    }

    const container = measureRef.current;
    if (!container) return;

    let timerId = null;

    const run = () => {
      const singlePageLimit = getBodyLimit(true);

      const children = [...container.children];
      if (!children.length) {
        setChunks([body || '']);
        return;
      }

      let totalH = 0;
      for (const c of children) totalH += c.offsetHeight;

      if (totalH <= singlePageLimit) {
        setChunks([body || '']);
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
        temp.className = 'doc-body-content';
        temp.style.width = '661px';
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
        const item = flatItems[i];
        const testItems = [...currentPageItems, item];
        const testHtml = renderItems(testItems);
        const h = getTempHeight(testHtml);

        const remainingItems = flatItems.slice(i + 1);

        let limit = getBodyLimit(isFirst);

        if (remainingItems.length > 0) {
          const remainingHtml = renderItems(remainingItems);
          const remainingH = getTempHeight(remainingHtml);
          if (remainingH > 80) {
            limit = PAGE_INNER_H - (isFirst ? HEADER_BLOCK_H : CONTINUED_BLOCK_H);
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

      if (currentPageItems.length > 0) {
        result.push(renderItems(currentPageItems));
      }

      setChunks(result.length ? result : [body || '']);
    };

    const debouncedRun = () => {
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => {
        document.fonts.ready.then(() => requestAnimationFrame(run));
      }, 100);
    };

    debouncedRun();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [body, measureRef]);

  return chunks;
}
