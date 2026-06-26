import DocumentPages from './DocumentPages'
import DocumentPagesRiskGuide from '../templates/risk-guide/DocumentPagesRiskGuide'
import { TEMPLATE_RISK_GUIDE } from '../constants/documentSchema'

export default function DocumentPreview({ templateId, data, bodyChunks, id }) {
  if (templateId === TEMPLATE_RISK_GUIDE) {
    return (
      <DocumentPagesRiskGuide
        data={data}
        bodyChunks={bodyChunks}
        id={id}
      />
    )
  }

  return (
    <DocumentPages
      data={data}
      bodyChunks={bodyChunks}
      id={id}
    />
  )
}
