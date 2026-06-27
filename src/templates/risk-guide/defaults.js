export const RISK_GUIDE_EXAMPLE_HTML = `
<div class="risk-summary-box">
<p><strong>업무 리스크란?</strong></p>
<p>아직 발생하지 않았지만, 향후 발생할 가능성이 있는 잠재적인 요인으로서, 일정·품질·비용·컴플라이언스 등에 부정적 영향을 줄 수 있는 요소를 말합니다. 리스크는 <strong>예방</strong>을 위한 것이며, 이미 발생한 문제를 다루는 것은 <strong>이슈</strong>입니다.</p>
</div>

<h2>1. 왜 업무 리스크를 관리해야 하나요?</h2>
<ul>
<li>큰 문제로 번지기 전에 미리 대비할 수 있습니다.</li>
<li>팀 차원에서 빠르게 대응할 수 있도록 공유할 수 있습니다.</li>
<li>리스크 공유는 책임 추궁이 아니라 <mark>안전을 위한 절차</mark>입니다.</li>
</ul>

<h2>2. 어떤 내용을 리스크로 작성하면 되나요?</h2>
<table>
<thead>
<tr><th>구분</th><th>내용</th></tr>
</thead>
<tbody>
<tr><td>일정 리스크</td><td>자료 지연, 승인 지연, 외부 회신 지연 등으로 일정이 밀릴 수 있는 경우</td></tr>
<tr><td>품질 리스크</td><td>요구사항 불명확, 검수 기준 미흡 등으로 재작업이 발생할 수 있는 경우</td></tr>
<tr><td>비용·계약 리스크</td><td>견적·범위 불명확으로 예산 초과 또는 계약 분쟁 가능성이 있는 경우</td></tr>
<tr><td>역량·수행 리스크</td><td>기술 숙련도 부족, 인력 공백 등으로 산출물 품질이 낮아질 수 있는 경우</td></tr>
<tr><td>대외 커뮤니케이션 리스크</td><td>고객·협력사와의 커뮤니케이션 지연·오해로 업무가 지연될 수 있는 경우</td></tr>
</tbody>
</table>

<h2>3. 주간보고서 작성 기준</h2>
<ul>
<li>영향도가 큰 항목 위주로 작성합니다.</li>
<li><strong>어디서 / 무엇이 / 왜 / 영향</strong>이 드러나게 씁니다.</li>
<li>리스크가 현실화되면 <strong>이슈</strong>로 전환하여 관리합니다.</li>
</ul>

<h2>4. 작성 예시</h2>
<table>
<thead>
<tr><th>구분</th><th>리스크 작성(예시)</th></tr>
</thead>
<tbody>
<tr><td>일정</td><td>○○ 자료 수급이 지연될 경우, 1차 납기(00/00) 준수에 영향을 줄 수 있음</td></tr>
<tr><td>품질</td><td>요구사항 변경 가능성이 있어, 확정 전까지 상세 설계 착수 시 재작업 리스크가 있음</td></tr>
<tr><td>역량·수행</td><td>해당 기술 스택 경험 인력이 부족하여 초기 산출물 품질 검토가 필요함</td></tr>
</tbody>
</table>

<p>※ <strong>기억할 점:</strong> 리스크 보고는 문제가 터진 뒤가 아니라, <mark>터지기 전에 공유하는 예방 활동</mark>입니다.</p>
`.trim();

export function createRiskGuideFormData(overrides = {}, { useExample = true } = {}) {
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    templateId: 'risk-guide',
    title: '업무 리스크 관리',
    author: 'istagingasia 홍길동',
    date: today,
    body: useExample ? RISK_GUIDE_EXAMPLE_HTML : '',
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
    ...overrides,
  };
}

export function createRiskGuideBlank() {
  return createRiskGuideFormData({ title: '', author: '', body: '' }, { useExample: false });
}

export function createRiskGuideExample() {
  return createRiskGuideFormData({}, { useExample: true });
}
