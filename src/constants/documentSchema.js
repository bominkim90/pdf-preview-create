import { createRiskGuideFormData } from '../templates/risk-guide/defaults'

export const TEMPLATE_REPORT_DEFAULT = 'report-default'
export const TEMPLATE_RISK_GUIDE = 'risk-guide'

export const TEMPLATE_LABELS = {
  [TEMPLATE_REPORT_DEFAULT]: '공문서 보고서',
  [TEMPLATE_RISK_GUIDE]: '업무 리스크 관리',
}

export function getTemplateLabel(templateId) {
  return TEMPLATE_LABELS[templateId] || templateId || '알 수 없음'
}

export function createInitialFormData(overrides = {}) {
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return {
    templateId: TEMPLATE_REPORT_DEFAULT,
    orgName: 'iStaging Asia',
    recipient: '',
    via: '',
    sender: '',
    title: '',
    body: '',
    retention: '1년',
    attachedFileName: '',
    author: '',
    reviewer: '',
    approver: '',
    department: '',
    docNumber: '',
    date: today,
    classification: '일반문서',
    showApproval: false,
    showSeal: false,
    ...overrides,
  }
}

export function getDocumentTitle(formData) {
  const title = formData?.title?.trim()
  return title || '제목 없음'
}

function getBaseFormData(templateId) {
  if (templateId === TEMPLATE_RISK_GUIDE) {
    return createRiskGuideFormData()
  }
  return createInitialFormData()
}

export function mergeLoadedFormData(formData) {
  const templateId = formData?.templateId || TEMPLATE_REPORT_DEFAULT
  const base = getBaseFormData(templateId)
  if (!formData || typeof formData !== 'object') return base
  return {
    ...base,
    ...formData,
    templateId,
  }
}
