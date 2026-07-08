/**
 * 평문 + // 마킹 → 컴파일러 MD 변환
 * 사용자는 MD 문법 대신 원문 붙여넣기 + 최소 마킹만 하면 됨.
 */

const MARKER_RE = /^\/\/\s*(.+)$/;
const TABLE_MARKER_RE = /^\/\/\s*table:(\w+)\s*$/i;
const SECTION_HEADING_RE = /^##\s+/;
const H1_RE = /^#\s+/;
const HTML_COMMENT_RE = /^<!--[\s\S]*?-->$/;
const MD_TABLE_ROW_RE = /^\|(.+)\|$/;
const MD_TABLE_SEP_RE = /^\|[\s\-:|]+\|$/;

const FENCE_MAP = {
  summary: ':::summary',
  'callout:guide': ':::callout guide',
  'callout:warn': ':::callout warn',
  'list:remember': ':::list remember',
  'list:notes': ':::list notes',
  'section-highlight': ':::section-highlight',
  'column-section': ':::column-section',
};

function isPipeTableRow(line) {
  const t = line.trim();
  return MD_TABLE_ROW_RE.test(t) && !MD_TABLE_SEP_RE.test(t);
}

function pipeRowToData(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

function inferTableVariant(headerCells) {
  const joined = headerCells.join(' ');
  if (joined.includes('리스크 구분') || joined.includes('③')) return 'example';
  if (joined.includes('항목 설명') || (headerCells[0]?.includes('항목') && headerCells.length === 2))
    return 'items';
  if (joined.includes('구분') && joined.includes('내용')) return 'category';
  if (headerCells.length >= 4) return 'example';
  return 'category';
}

function convertPipeTable(lines, startIndex) {
  const rows = [];
  let i = startIndex;

  while (i < lines.length && isPipeTableRow(lines[i])) {
    rows.push(pipeRowToData(lines[i]));
    i += 1;
    if (i < lines.length && MD_TABLE_SEP_RE.test(lines[i].trim())) {
      i += 1;
    }
  }

  if (rows.length < 2) {
    return { output: lines.slice(startIndex, i), endIndex: i };
  }

  const [header, ...body] = rows;
  const variant = inferTableVariant(header);

  if (variant === 'example' && header.length >= 5) {
    const converted = body.map((cells) => {
      const [, term, , risk, action] = cells;
      const item = cells[0] || cells[2] || '';
      return `${term || ''} | ${item} | ${risk || ''} | ${action || ''}`.trim();
    });
    return {
      output: [`\`\`\`table:${variant}`, ...converted, '```'],
      endIndex: i,
    };
  }

  const dataRows =
    variant === 'example'
      ? body.map((cells) => cells.filter(Boolean).join(' | '))
      : body.map((cells) => `${cells[0] || ''} | ${cells[1] || ''}`.trim());

  return {
    output: [`\`\`\`table:${variant}`, ...dataRows, '```'],
    endIndex: i,
  };
}

function readMarkerBlock(lines, startIndex, fenceOpen, fenceClose = ':::') {
  const inner = [];
  let i = startIndex + 1;

  while (i < lines.length) {
    const t = lines[i].trim();
    if (t === fenceClose) break;
    if (MARKER_RE.test(t) || TABLE_MARKER_RE.test(t)) break;
    if (SECTION_HEADING_RE.test(t) || H1_RE.test(t)) break;
    inner.push(lines[i]);
    i += 1;
  }

  return { inner, endIndex: i };
}

/**
 * @param {string} rawSource - 사용자 평문 입력
 * @param {{ author?: string, date?: string, title?: string }} meta
 * @returns {string} 컴파일러용 MD
 */
export function normalizeRiskGuideRaw(rawSource, meta = {}) {
  const lines = (rawSource || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let hasFrontmatter = false;
  let hasTitle = false;

  for (const line of lines) {
    if (line.trim().startsWith('---')) hasFrontmatter = true;
    if (H1_RE.test(line.trim())) hasTitle = true;
  }

  if (!hasFrontmatter) {
    out.push('---');
    if (meta.author) out.push(`author: ${meta.author}`);
    if (meta.date) out.push(`date: ${meta.date}`);
    out.push('---', '');
  }

  if (!hasTitle) {
    out.push(`# ${meta.title || '업무 리스크 관리'}`, '');
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || HTML_COMMENT_RE.test(trimmed) || trimmed === '---page---') {
      i += 1;
      continue;
    }

    if (trimmed.startsWith('---') && !hasFrontmatter) {
      while (i < lines.length && lines[i].trim() !== '---') i += 1;
      i += 1;
      continue;
    }

    const tableMarker = trimmed.match(TABLE_MARKER_RE);
    if (tableMarker) {
      const variant = tableMarker[1].toLowerCase();
      const dataRows = [];
      i += 1;
      while (i < lines.length) {
        const row = lines[i].trim();
        if (!row || MARKER_RE.test(row) || SECTION_HEADING_RE.test(row) || H1_RE.test(row)) break;
        if (isPipeTableRow(lines[i])) {
          const converted = convertPipeTable(lines, i);
          dataRows.push(...converted.output.slice(1, -1));
          i = converted.endIndex;
          continue;
        }
        if (row.includes('|')) {
          dataRows.push(row);
          i += 1;
          continue;
        }
        break;
      }
      out.push(`\`\`\`table:${variant}`, ...dataRows, '```', '');
      continue;
    }

    const marker = trimmed.match(MARKER_RE);
    if (marker && !TABLE_MARKER_RE.test(trimmed)) {
      const key = marker[1].trim().toLowerCase();
      const fenceOpen = FENCE_MAP[key];
      if (fenceOpen) {
        out.push(fenceOpen);
        const { inner, endIndex } = readMarkerBlock(lines, i, fenceOpen);
        out.push(...inner);
        out.push(':::', '');
        i = endIndex + 1;
        continue;
      }
    }

    if (isPipeTableRow(line)) {
      const { output, endIndex } = convertPipeTable(lines, i);
      out.push(...output, '');
      i = endIndex;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
        i += 1;
      }
      const label = quoteLines[0]?.replace(/^❖\s*/, '') || '주의사항';
      out.push(':::callout warn', `${label}:`, ...quoteLines.slice(1).map((l) => `- ${l}`), ':::', '');
      continue;
    }

    out.push(line);
    i += 1;
  }

  return out.join('\n').trim();
}

/**
 * rawSource가 있으면 MD로 변환 후 컴파일 입력으로 사용
 */
export function resolveRiskGuideMdSource(formData) {
  if (formData?.rawSource?.trim()) {
    return normalizeRiskGuideRaw(formData.rawSource, {
      author: formData.author,
      date: formData.date,
      title: formData.title,
    });
  }
  return formData?.mdSource?.trim() || '';
}
