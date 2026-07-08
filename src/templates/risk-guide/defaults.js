import exampleMd from './example.md?raw';
import { compileRiskGuideMd } from './compile';
import { resolveRiskGuideMdSource } from './normalizeToMd';
import {
  normalizeLegacyRiskGuideFormData,
  normalizeRiskGuideFormData,
  migrateLegacyMdSource,
} from './migrateRiskGuide';
import {
  createRiskGuideHeaderDefaults,
  parseRiskGuideHeaderFromMd,
  resolveRiskGuideHeader,
  stripRiskGuideHeaderFromMd,
} from './headerFields';

export const RISK_GUIDE_EXAMPLE_MD = exampleMd.trim();
const RISK_GUIDE_EXAMPLE_HEADER = parseRiskGuideHeaderFromMd(RISK_GUIDE_EXAMPLE_MD);
const RISK_GUIDE_EXAMPLE_BODY_MD = stripRiskGuideHeaderFromMd(RISK_GUIDE_EXAMPLE_MD);

export function createRiskGuideFormData(overrides = {}, { useExample = true } = {}) {
  const exampleFields = useExample
    ? {
        ...RISK_GUIDE_EXAMPLE_HEADER,
        mdSource: RISK_GUIDE_EXAMPLE_BODY_MD,
      }
    : {
        ...createRiskGuideHeaderDefaults(),
        mdSource: '',
      };

  return normalizeRiskGuideFormData({
    templateId: 'risk-guide',
    orgName: 'iStaging Asia',
    recipient: '',
    via: '',
    sender: '',
    retention: '1년',
    attachedFileName: '',
    reviewer: '',
    approver: '',
    department: '',
    docNumber: '',
    classification: '일반문서',
    showApproval: false,
    showSeal: false,
    ...exampleFields,
    ...overrides,
  });
}

export function createRiskGuideBlank() {
  return createRiskGuideFormData({}, { useExample: false });
}

export function createRiskGuideExample() {
  return createRiskGuideFormData({}, { useExample: true });
}

export function getCompiledRiskGuideData(formData) {
  const migrated = migrateLegacyMdSource(formData);
  const mdSource = resolveRiskGuideMdSource(migrated);
  if (mdSource) {
    return compileRiskGuideMd(mdSource);
  }
  return normalizeLegacyRiskGuideFormData(migrated);
}

export function getRiskGuidePreviewData(formData) {
  const migrated = migrateLegacyMdSource(formData);
  const compiled = getCompiledRiskGuideData(migrated);
  const header = resolveRiskGuideHeader(migrated, compiled.data || {});

  return {
    ...migrated,
    ...header,
    body: compiled.data?.body || '',
    compileErrors: compiled.errors || [],
    compileSuccess: compiled.success,
  };
}
