import {
  TEMPLATE_REPORT_DEFAULT,
  TEMPLATE_RISK_GUIDE,
  TEMPLATE_LABELS,
} from '../constants/documentSchema';

export const TEMPLATE_MODE_EDITOR = 'editor';
export const TEMPLATE_MODE_COMPILER = 'compiler';

export const TEMPLATE_MODES = {
  [TEMPLATE_REPORT_DEFAULT]: TEMPLATE_MODE_EDITOR,
  [TEMPLATE_RISK_GUIDE]: TEMPLATE_MODE_COMPILER,
};

export const TEMPLATE_OPTIONS = [
  { id: TEMPLATE_REPORT_DEFAULT, label: TEMPLATE_LABELS[TEMPLATE_REPORT_DEFAULT] },
  { id: TEMPLATE_RISK_GUIDE, label: TEMPLATE_LABELS[TEMPLATE_RISK_GUIDE] },
];

export function getTemplateMode(templateId) {
  return TEMPLATE_MODES[templateId] || TEMPLATE_MODE_EDITOR;
}

export function isCompilerTemplate(templateId) {
  return getTemplateMode(templateId) === TEMPLATE_MODE_COMPILER;
}

export function isRiskGuideTemplate(templateId) {
  return templateId === TEMPLATE_RISK_GUIDE;
}

export function isEditorTemplate(templateId) {
  return getTemplateMode(templateId) === TEMPLATE_MODE_EDITOR;
}
