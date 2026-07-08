import {
  createRiskGuideHeaderDefaults,
  parseRiskGuideHeaderFromMd,
  stripRiskGuideHeaderFromMd,
} from './headerFields';

const SUMMARY_BOX_RE = /<div[^>]*class="[^"]*risk-summary-box[^"]*"[^>]*>[\s\S]*?<\/div>\s*/i;

export const DEFAULT_RISK_SUMMARY = {
  title: '업무 리스크란?',
  paragraphs: [
    `업무 수행 과정에서 일정, 품질, 비용, 규정 준수, 대외 신뢰 등에 부정적인 영향을 줄 수 있는 <span class="risk-accent">'아직 발생하지 않았지만 발생 가능성이 있는 위험 요소'</span> 를 말합니다.`,
    '이미 문제가 발생한 뒤 처리하는 "이슈"와 달리, "리스크"는 문제가 되기 전에 미리 공유하고 대응하기 위한 항목입니다.',
  ],
};

function extractSummaryFromBody(body) {
  const match = body?.match(
    /<div[^>]*class="[^"]*risk-summary-box[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  );
  if (!match) return null;

  const inner = match[1];
  const titleMatch = inner.match(/<strong>([^<]*)<\/strong>/);
  const paragraphs = [...inner.matchAll(/<p(?![^>]*risk-summary-title)[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => m[1].trim())
    .filter(Boolean);

  if (!paragraphs.length) return null;

  return {
    title: titleMatch?.[1]?.trim() || DEFAULT_RISK_SUMMARY.title,
    paragraphs,
  };
}

export function stripSummaryFromBody(body) {
  if (!body) return '';
  return body.replace(SUMMARY_BOX_RE, '').trim();
}

export function normalizeRiskSummary(summary, body) {
  const paragraphs = Array.isArray(summary?.paragraphs) ? summary.paragraphs : [];
  if (summary?.title?.trim() || paragraphs.length > 0) {
    return {
      title: summary?.title || '',
      paragraphs,
    };
  }

  const extracted = extractSummaryFromBody(body);
  if (extracted) return extracted;

  return { title: '', paragraphs: [] };
}

export function normalizeLegacyRiskGuideFormData(formData) {
  const summary = normalizeRiskSummary(formData?.summary, formData?.body);
  const body = stripSummaryFromBody(formData?.body || '');

  return {
    success: Boolean(formData?.title?.trim() || body),
    errors: [],
    data: {
      title: formData?.title || '',
      author: formData?.author || '',
      date: formData?.date || '',
      summary,
      body,
    },
  };
}

export function migrateLegacyMdSource(formData) {
  const mdSource = formData?.mdSource?.trim();
  if (!mdSource) return formData;

  const hasHeaderInput =
    formData.title?.trim() ||
    formData.summaryTitle?.trim() ||
    formData.summaryText?.trim();

  if (hasHeaderInput) return formData;

  const hasLegacyHeader = /^#\s+/m.test(mdSource) || /^:::summary\r?\n/m.test(mdSource);
  if (!hasLegacyHeader) return formData;

  const parsed = parseRiskGuideHeaderFromMd(mdSource);
  const bodyMd = stripRiskGuideHeaderFromMd(mdSource);

  return {
    ...formData,
    ...parsed,
    mdSource: bodyMd,
  };
}

export function normalizeRiskGuideFormData(formData) {
  if (!formData || formData.templateId !== 'risk-guide') return formData;

  const withHeaderFields = ensureRiskGuideHeaderFields(formData);
  const migrated = migrateLegacyMdSource(withHeaderFields);

  if (migrated.mdSource?.trim()) {
    return { ...migrated, templateId: 'risk-guide' };
  }

  const legacy = normalizeLegacyRiskGuideFormData(migrated);
  if (legacy.success && legacy.data.body) {
    return {
      ...migrated,
      templateId: 'risk-guide',
      mdSource: '',
      ...legacy.data,
      ...ensureRiskGuideHeaderFields({
        ...migrated,
        ...legacy.data,
      }),
    };
  }

  return {
    ...migrated,
    templateId: 'risk-guide',
    mdSource: migrated.mdSource || '',
  };
}

function stripHtml(text) {
  return (text || '').replace(/<[^>]+>/g, '').trim();
}

function ensureRiskGuideHeaderFields(formData) {
  if (!formData) return formData;

  const hasSummaryFields =
    formData.summaryTitle !== undefined || formData.summaryText !== undefined;

  if (hasSummaryFields) return formData;

  if (formData.summary) {
    return {
      ...formData,
      summaryTitle: formData.summary.title || '',
      summaryText: (formData.summary.paragraphs || []).map(stripHtml).filter(Boolean).join('\n\n'),
    };
  }

  return {
    ...createRiskGuideHeaderDefaults(),
    ...formData,
  };
}
