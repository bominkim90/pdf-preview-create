import { formatInline, formatDefaultDate } from './compile';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const H1_RE = /^#\s+(.+)$/m;
const SUMMARY_BLOCK_RE = /^:::summary\r?\n([\s\S]*?)\r?\n:::\s*(?:\r?\n|$)/m;

function parseFrontmatter(source) {
  const meta = {};
  const match = source.match(FRONTMATTER_RE);
  if (!match) return { meta, content: source };

  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w+)\s*:\s*(.+)$/);
    if (kv) meta[kv[1].trim()] = kv[2].trim();
  }

  return { meta, content: source.slice(match[0].length) };
}

function parseSummaryBlock(content) {
  const lines = (content || '').split('\n').filter((l) => l.trim());
  let title = '';
  const paragraphLines = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      title = line.slice(3).trim();
    } else {
      paragraphLines.push(line.trim());
    }
  }

  return {
    summaryTitle: title,
    summaryText: paragraphLines.join('\n\n'),
  };
}

export function parseRiskGuideHeaderFromMd(mdSource) {
  const source = (mdSource || '').trim();
  if (!source) {
    return {
      title: '',
      author: '',
      date: formatDefaultDate(),
      summaryTitle: '',
      summaryText: '',
    };
  }

  const { meta, content } = parseFrontmatter(source);
  const title = content.match(H1_RE)?.[1]?.trim() || '';
  const summaryMatch = content.match(SUMMARY_BLOCK_RE);
  const summary = summaryMatch ? parseSummaryBlock(summaryMatch[1]) : { summaryTitle: '', summaryText: '' };

  return {
    title,
    author: meta.author || '',
    date: meta.date || formatDefaultDate(),
    summaryTitle: summary.summaryTitle,
    summaryText: summary.summaryText,
  };
}

export function stripRiskGuideHeaderFromMd(mdSource) {
  let content = (mdSource || '').trim();
  if (!content) return '';

  const fm = content.match(FRONTMATTER_RE);
  if (fm) content = content.slice(fm[0].length);

  content = content.replace(H1_RE, '').trim();
  content = content.replace(SUMMARY_BLOCK_RE, '').trim();

  return content;
}

export function buildSummaryFromForm(summaryTitle, summaryText) {
  const title = (summaryTitle || '').trim();
  const paragraphs = (summaryText || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => formatInline(p));

  return { title, paragraphs };
}

export function resolveRiskGuideHeader(formData, compiledData = {}) {
  const formTitle = formData?.title?.trim();
  const formAuthor = formData?.author?.trim();
  const formDate = formData?.date?.trim();
  const formSummaryTitle = formData?.summaryTitle?.trim();
  const formSummaryText = formData?.summaryText?.trim();

  const hasFormSummary = Boolean(formSummaryTitle || formSummaryText);

  return {
    title: formTitle || compiledData.title?.trim() || '',
    author: formAuthor || compiledData.author?.trim() || '',
    date: formDate || compiledData.date?.trim() || formatDefaultDate(),
    summary: hasFormSummary
      ? buildSummaryFromForm(formData.summaryTitle, formData.summaryText)
      : compiledData.summary?.paragraphs?.length || compiledData.summary?.title
        ? compiledData.summary
        : { title: '', paragraphs: [] },
  };
}

export function createRiskGuideHeaderDefaults(overrides = {}) {
  return {
    title: '',
    author: '',
    date: formatDefaultDate(),
    summaryTitle: '',
    summaryText: '',
    ...overrides,
  };
}
