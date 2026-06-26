import {
  TEMPLATE_REPORT_DEFAULT,
  TEMPLATE_RISK_GUIDE,
  TEMPLATE_LABELS,
} from '../constants/documentSchema'

export const TEMPLATE_OPTIONS = [
  { id: TEMPLATE_REPORT_DEFAULT, label: TEMPLATE_LABELS[TEMPLATE_REPORT_DEFAULT] },
  { id: TEMPLATE_RISK_GUIDE, label: TEMPLATE_LABELS[TEMPLATE_RISK_GUIDE] },
]

export function isRiskGuideTemplate(templateId) {
  return templateId === TEMPLATE_RISK_GUIDE
}
