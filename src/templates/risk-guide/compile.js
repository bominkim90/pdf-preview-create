const FENCE_OPEN_RE = /^:::[\w-]+(?:\s+[\w-]+)?\s*$/;
const FENCE_CLOSE_RE = /^:::\s*$/;
const TABLE_FENCE_RE = /^```table:(\w+)\s*$/;

export function formatInline(text) {
  if (!text) return '';
  return text
    .replace(/«([^»]+)»/g, '<span class="risk-accent">$1</span>')
    .replace(/‹([^›]+)›/g, '<span class="risk-emphasis">$1</span>')
    .replace(/「([^」]+)」/g, '<span class="risk-quote">$1</span>')
    .replace(/\*\*([^*]+)\*\*/g, '<span class="risk-underline-accent">$1</span>')
    .replace(/<u>([^<]+)<\/u>/g, '<span class="risk-underline-accent">$1</span>');
}

function parseFrontmatter(source) {
  const meta = {};
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { meta, content: source };

  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w+)\s*:\s*(.+)$/);
    if (kv) meta[kv[1].trim()] = kv[2].trim();
  }

  return { meta, content: source.slice(match[0].length) };
}

function readFencedBlock(lines, startIndex) {
  const inner = [];
  let depth = 1;
  let i = startIndex + 1;

  while (i < lines.length && depth > 0) {
    const line = lines[i];
    if (FENCE_OPEN_RE.test(line)) depth += 1;
    else if (FENCE_CLOSE_RE.test(line)) {
      depth -= 1;
      if (depth === 0) {
        i += 1;
        break;
      }
    }
    if (depth > 0) inner.push(line);
    i += 1;
  }

  return { inner: inner.join('\n'), endIndex: i };
}

function readTableFence(lines, startIndex) {
  const opener = lines[startIndex];
  const variantMatch = opener.match(TABLE_FENCE_RE);
  const variant = variantMatch?.[1] || 'category';
  const inner = [];
  let i = startIndex + 1;

  while (i < lines.length && !lines[i].startsWith('```')) {
    inner.push(lines[i]);
    i += 1;
  }

  return { variant, lines: inner.filter((l) => l.trim()), endIndex: i };
}

function parseTableBlock(tableLines) {
  const HEADER_RE = /^@(\w+):\s*(.+)$/;
  const headers = {};
  const dataLines = [];

  for (const line of tableLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(HEADER_RE);
    if (match) {
      const key = match[1].toLowerCase();
      const value = match[2].trim();
      if (key === 'group') {
        const [sub1, sub2] = value.split('|').map((s) => s.trim());
        if (sub1) headers.sub1 = sub1;
        if (sub2) headers.sub2 = sub2;
      } else {
        headers[key] = value;
      }
      continue;
    }

    if (/^\|?[\s-:|]+\|?$/.test(trimmed)) continue;

    dataLines.push(trimmed);
  }

  const rows = dataLines
    .map((line) => line.split('|').map((c) => c.trim()))
    .filter((cells) => cells.some((c) => c));

  return { headers, rows };
}

function parseListAt(lines, startIndex) {
  const items = [];
  let i = startIndex;
  const firstMatch = lines[startIndex].match(/^(\s*)- (.+)$/);
  if (!firstMatch) return { items: [], endIndex: startIndex + 1 };
  const baseIndent = firstMatch[1].length;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    const match = line.match(/^(\s*)- (.+)$/);
    if (!match) break;

    const indent = match[1].length;
    if (indent < baseIndent) break;
    if (indent !== baseIndent) break;

    const children = [];
    let j = i + 1;
    while (j < lines.length) {
      const childLine = lines[j];
      if (!childLine.trim()) {
        j += 1;
        continue;
      }
      const childMatch = childLine.match(/^(\s*)- (.+)$/);
      if (!childMatch) break;
      const childIndent = childMatch[1].length;
      if (childIndent <= baseIndent) break;
      children.push(childMatch[2]);
      j += 1;
    }

    items.push(children.length ? { text: match[2], children } : match[2]);
    i = j;
  }

  return { items, endIndex: i };
}

function renderListItems(items, nested = false) {
  const cls = nested ? ' class="risk-list--nested"' : '';
  return `<ul${cls}>${items
    .map((item) => {
      if (typeof item === 'string') {
        return `<li><span class="risk-bullet">${nested ? '•' : '●'}</span><span class="risk-bullet-text">${formatInline(item)}</span></li>`;
      }
      const childHtml = item.children?.length ? renderListItems(item.children, true) : '';
      return `<li><span class="risk-bullet">${nested ? '•' : '●'}</span><span class="risk-bullet-text">${formatInline(item.text)}</span>${childHtml}</li>`;
    })
    .join('')}</ul>`;
}

function parseBlocks(content) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (trimmed === '---page---') {
      i += 1;
      continue;
    }

    if (FENCE_OPEN_RE.test(trimmed)) {
      const directive = trimmed.slice(3).trim();
      const { inner, endIndex } = readFencedBlock(lines, i);
      const [kind, ...rest] = directive.split(/\s+/);

      if (kind === 'summary') {
        blocks.push({ type: 'summary', content: inner });
      } else if (kind === 'callout') {
        blocks.push({ type: 'callout', variant: rest[0] || 'guide', content: inner });
      } else if (kind === 'list') {
        blocks.push({ type: 'list-block', listClass: rest[0] || 'notes', content: inner });
      } else if (kind === 'section-highlight') {
        blocks.push({ type: 'section-highlight', content: inner });
      } else if (kind === 'column-section') {
        blocks.push({ type: 'column-section', content: inner });
      } else {
        blocks.push({ type: 'paragraph', text: line });
      }

      i = endIndex;
      continue;
    }

    if (TABLE_FENCE_RE.test(trimmed)) {
      const { variant, lines: tableLines, endIndex } = readTableFence(lines, i);
      blocks.push({ type: 'table', variant, ...parseTableBlock(tableLines) });
      i = endIndex + 1;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', text: trimmed.slice(4).trim() });
      i += 1;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', text: trimmed.slice(3).trim() });
      i += 1;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'h1', text: trimmed.slice(2).trim() });
      i += 1;
      continue;
    }

    if (/^- /.test(line)) {
      const { items, endIndex } = parseListAt(lines, i);
      if (items.length) {
        blocks.push({ type: 'list', items });
      }
      i = endIndex > i ? endIndex : i + 1;
      continue;
    }

    if (/^\*\*.+\*\*$/.test(trimmed)) {
      blocks.push({ type: 'strong-paragraph', text: trimmed.slice(2, -2) });
      i += 1;
      continue;
    }

    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !FENCE_OPEN_RE.test(lines[i].trim()) &&
      !TABLE_FENCE_RE.test(lines[i].trim()) &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('- ') &&
      lines[i].trim() !== '---page---'
    ) {
      paraLines.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
  }

  return blocks;
}

function getH3Class(text) {
  if (text.startsWith('③') || text.startsWith('④') || text.includes('리스크 내용') || text.includes('해결')) {
    return 'risk-column-title';
  }
  return 'risk-subheading';
}

function renderCellList(text) {
  return `<ul class="risk-cell-list"><li><span class="risk-bullet">•</span><span class="risk-bullet-text">${formatInline(text)}</span></li></ul>`;
}

function renderColgroup(widths) {
  return `<colgroup>${widths.map((width) => `<col style="width:${width}">`).join('')}</colgroup>`;
}

function renderTable(variant, rows, headers = {}) {
  if (!rows.length) return '';

  if (variant === 'category') {
    const col1 = headers.col1 || '구분';
    const col2 = headers.col2 || '내용';
    const body = rows
      .map(
        ([label, content]) =>
          `<tr><td class="risk-table-cell risk-table-cell--label">${formatInline(label)}</td><td class="risk-table-cell risk-table-cell--content">${renderCellList(content)}</td></tr>`
      )
      .join('');
    return `<table class="risk-table risk-table--category">${renderColgroup(['28mm', '141mm'])}<thead><tr><th>${formatInline(col1)}</th><th>${formatInline(col2)}</th></tr></thead><tbody>${body}</tbody></table>`;
  }

  if (variant === 'items') {
    const col1 = headers.col1 || '항목';
    const col2 = headers.col2 || '항목 설명';
    const body = rows
      .map(
        ([label, content]) =>
          `<tr><td class="risk-table-cell risk-table-cell--label">${formatInline(label)}</td><td class="risk-table-cell risk-table-cell--content">${renderCellList(content)}</td></tr>`
      )
      .join('');
    return `<table class="risk-table risk-table--items">${renderColgroup(['28mm', '141mm'])}<thead><tr><th>${formatInline(col1)}</th><th>${formatInline(col2)}</th></tr></thead><tbody>${body}</tbody></table>`;
  }

  if (variant === 'example') {
    const grouptitle = headers.grouptitle || '리스크 구분';
    const sub1 = headers.sub1 || '① 장기/단기';
    const sub2 = headers.sub2 || '② 항목';
    const col3 = headers.col3 || '③ 리스크 내용';
    const col4 = headers.col4 || '④ 해결 및 대응방안';
    const body = rows
      .map(([term, item, risk, action]) => {
        if (!term && !item) return '';
        return `<tr><td class="risk-table-cell risk-table-cell--term">${formatInline(term || '')}</td><td class="risk-table-cell risk-table-cell--item">${formatInline(item || '')}</td><td class="risk-table-cell risk-table-cell--risk">${renderCellList(risk || '')}</td><td class="risk-table-cell risk-table-cell--action">${renderCellList(action || '')}</td></tr>`;
      })
      .join('');
    return `<table class="risk-table risk-table--example">${renderColgroup(['20mm', '18mm', '64mm', '67mm'])}<thead><tr><th colspan="2">${formatInline(grouptitle)}</th><th rowspan="2">${formatInline(col3)}</th><th rowspan="2">${formatInline(col4)}</th></tr><tr><th>${formatInline(sub1)}</th><th>${formatInline(sub2)}</th></tr></thead><tbody>${body}</tbody></table>`;
  }

  return '';
}

function renderCallout(variant, content) {
  const lines = content.split('\n');
  const labelLine = lines[0] || '';
  const label = labelLine.replace(/:$/, '');
  const items = lines
    .slice(1)
    .map((l) => l.trim())
    .filter((l) => l.startsWith('- '))
    .map((l) => l.slice(2));

  const listHtml = items.length
    ? `<ul>${items
        .map(
          (item) =>
            `<li><span class="risk-bullet">•</span><span class="risk-bullet-text">${formatInline(item)}</span></li>`
        )
        .join('')}</ul>`
    : '';

  return `<div class="risk-callout risk-callout--${variant}"><p class="risk-callout-label">${formatInline(label)}</p>${listHtml}</div>`;
}

function renderListBlock(listClass, content) {
  const items = content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('- '))
    .map((l) => l.slice(2));

  return `<ul class="risk-list--${listClass}">${items
    .map(
      (item) =>
        `<li><span class="risk-bullet">●</span><span class="risk-bullet-text">${formatInline(item)}</span></li>`
    )
    .join('')}</ul>`;
}

function renderSummaryBlock(content) {
  const lines = content.split('\n').filter((l) => l.trim());
  let title = '';
  const paragraphs = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      title = line.slice(3).trim();
    } else {
      paragraphs.push(formatInline(line.trim()));
    }
  }

  return { title, paragraphs };
}

function renderBlocksToHtml(blocks) {
  const parts = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'h2':
        parts.push(`<h2><span class="risk-section-label">${formatInline(block.text)}</span></h2>`);
        break;
      case 'h3': {
        const cls = getH3Class(block.text);
        parts.push(`<h3 class="${cls}">${formatInline(block.text)}</h3>`);
        break;
      }
      case 'paragraph':
        parts.push(`<p>${formatInline(block.text)}</p>`);
        break;
      case 'strong-paragraph':
        parts.push(`<p><strong>${formatInline(block.text)}</strong></p>`);
        break;
      case 'list':
        parts.push(renderListItems(block.items));
        break;
      case 'table':
        parts.push(renderTable(block.variant, block.rows, block.headers));
        break;
      case 'callout':
        parts.push(renderCallout(block.variant, block.content));
        break;
      case 'list-block':
        parts.push(renderListBlock(block.listClass, block.content));
        break;
      case 'section-highlight':
        parts.push(
          `<div class="risk-section-highlight">${renderBlocksToHtml(parseBlocks(block.content))}</div>`
        );
        break;
      case 'column-section':
        parts.push(
          `<div class="risk-column-section">${renderBlocksToHtml(parseBlocks(block.content))}</div>`
        );
        break;
      default:
        break;
    }
  }

  return parts.join('\n');
}

export function formatDefaultDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function compileRiskGuideMd(mdSource) {
  const errors = [];
  const source = (mdSource || '').trim();

  if (!source) {
    return {
      success: true,
      errors: [],
      data: {
        title: '',
        author: '',
        date: formatDefaultDate(),
        summary: { title: '', paragraphs: [] },
        body: '',
      },
    };
  }

  try {
    const { meta, content } = parseFrontmatter(source);
    const allBlocks = parseBlocks(content);

    let title = '';
    let summary = { title: '', paragraphs: [] };
    const bodyBlocks = [];

    for (const block of allBlocks) {
      if (block.type === 'h1' && !title) {
        title = block.text;
        continue;
      }
      if (block.type === 'summary') {
        summary = renderSummaryBlock(block.content);
        continue;
      }
      bodyBlocks.push(block);
    }

    const body = renderBlocksToHtml(bodyBlocks);

    return {
      success: errors.length === 0,
      errors,
      data: {
        title: title || '업무 리스크 관리',
        author: meta.author || '',
        date: meta.date || formatDefaultDate(),
        summary,
        body,
      },
    };
  } catch (err) {
    return {
      success: false,
      errors: [err?.message || 'MD 파싱 중 오류가 발생했습니다.'],
      data: {
        title: '',
        author: '',
        date: formatDefaultDate(),
        summary: { title: '', paragraphs: [] },
        body: '',
      },
    };
  }
}
