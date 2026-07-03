import { RISK_PAGE_BREAK_HTML } from './splitBody';

export const RISK_GUIDE_EXAMPLE_HTML = `
<div class="risk-summary-box">
<p class="risk-summary-title"><strong>업무 리스크란?</strong></p>
<p>업무 수행 과정에서 일정, 품질, 비용, 규정 준수, 대외 신뢰 등에 부정적인 영향을 줄 수 있는 <span class="risk-accent">'아직 발생하지 않았지만 발생 가능성이 있는 위험 요소'</span> 를 말합니다.</p>
<p>이미 문제가 발생한 뒤 처리하는 "이슈"와 달리, "리스크"는 문제가 되기 전에 미리 공유하고 대응하기 위한 항목입니다.</p>
</div>

<h2>1. 왜 업무 리스크를 관리해야 하나요?</h2>
<ul>
<li>일정 지연, 비용 초과, 결과물 품질 저하, 규정 위반 등 주요 문제를 사전에 예방할 수 있습니다.</li>
<li>담당자 혼자 고민하지 않고 상급자 또는 팀 단위로 대응 방법을 빠르게 수립할 수 있습니다.</li>
<li>업무 리스크 작성은 책임 추궁이 아니라, 업무를 안전하게 완료하기 위한 조기 공유 절차입니다.</li>
</ul>

<h2>2. 어떤 내용을 리스크로 작성하면 되나요?</h2>
<table class="risk-table risk-table--category">
<thead>
<tr><th>구분</th><th>내용</th></tr>
</thead>
<tbody>
<tr>
<td>일정 리스크</td>
<td><ul class="risk-cell-list"><li>자료 수급 지연, 내부 승인 지연, 외부기관 회신 지연 등으로 마감이 늦어질 가능성</li></ul></td>
</tr>
<tr>
<td>품질 리스크</td>
<td><ul class="risk-cell-list"><li>결과물 완성도 부족, 검수 미흡, 불명확한 요구사항 등으로 재작업이 발생할 가능성</li></ul></td>
</tr>
<tr>
<td>비용·계약 리스크</td>
<td><ul class="risk-cell-list"><li>견적 불명확, 예산 초과, 계약 조건 미확정 등으로 집행 또는 계약에 문제가 생길 가능성</li></ul></td>
</tr>
<tr>
<td>역량·수행 리스크</td>
<td><ul class="risk-cell-list"><li>개인의 기술역량 또는 업무 숙련도 부족으로 인해 업무 수행 과정에서 완성도 높은 결과물을 도출하지 못할 가능성</li></ul></td>
</tr>
<tr>
<td>대외 커뮤니케이션 리스크</td>
<td><ul class="risk-cell-list"><li>고객사, 협력사, 전담기관과의 소통 지연 또는 오해로 업무 차질이 생길 가능성</li></ul></td>
</tr>
</tbody>
</table>

<h2>3. 주간보고서 작성 기준</h2>
<ul>
<li>단순한 걱정이 아니라, 업무 일정·품질·비용·커뮤니케이션 등 영향을 줄 수 있는 내용을 작성합니다.</li>
<li><span class="risk-accent">"어떤 업무에서 / 어떤 문제가 / 왜 발생할 수 있고 / 발생하면 어떤 영향이 있는지"</span>가 드러나게 작성합니다.</li>
<li>리스크가 이미 현실화된 경우에는 "리스크"가 아니라 "이슈"로 전환하여 조치 현황을 관리합니다.</li>
</ul>

<h2>4. 기억할 점</h2>
<ul class="risk-list--remember">
<li>업무 리스크는<br>"<u>문제가 생겼다</u>"는 보고가 아니라<br>"<u>문제가 생기지 않도록 미리 공유한다</u>" 는<br>예방 활동입니다.</li>
<li>작게 보이는 위험도 일정, 품질, 비용, 규정에 영향을 줄 수 있다면 문제가 되기 전에 미리 공유하고 대응해야 합니다.</li>
</ul>

${RISK_PAGE_BREAK_HTML}

<h2>5. 업무리스크 작성 예시</h2>
<table class="risk-table risk-table--example">
<thead>
<tr>
<th colspan="2">리스크 구분</th>
<th>③ 리스크 내용</th>
<th>④ 해결 및 대응방안</th>
</tr>
<tr>
<th>① 장기/단기</th>
<th>② 항목</th>
<th></th>
<th></th>
</tr>
</thead>
<tbody>
<tr>
<td>단기</td>
<td>일정</td>
<td><ul class="risk-cell-list"><li>협력사 자료 회신 지연으로 제안서 작성 일정이 늦어질 가능성이 있음</li></ul></td>
<td><ul class="risk-cell-list"><li>회신 기한 재안내 및 대체자료 사전 준비</li></ul></td>
</tr>
<tr>
<td>단기</td>
<td>품질</td>
<td><ul class="risk-cell-list"><li>내부 검토 시간이 부족하여 보고서·교육자료에 오류나 누락이 발생할 가능성이 있음</li></ul></td>
<td><ul class="risk-cell-list"><li>제출 전 담당자 지정 후 사전 검토 진행</li></ul></td>
</tr>
<tr>
<td>단기</td>
<td>역량·수행</td>
<td><ul class="risk-cell-list"><li>처음 수행하는 업무 또는 익숙하지 않은 프로그램 사용으로 결과물 완성도가 낮아질 가능성이 있음</li></ul></td>
<td><ul class="risk-cell-list"><li>경험자에게 사전 확인 후 중간 결과물 검토 요청 후 피드백 반영</li></ul></td>
</tr>
<tr>
<td>장기</td>
<td>비용·계약</td>
<td><ul class="risk-cell-list"><li>견적 기준 또는 계약 조건이 명확하지 않아 예산 초과나 계약 지연이 발생할 가능성이 있음</li></ul></td>
<td><ul class="risk-cell-list"><li>산출근거 및 계약 조건을 사전에 정리</li></ul></td>
</tr>
<tr>
<td>장기</td>
<td>규정·증빙</td>
<td><ul class="risk-cell-list"><li>정부지원사업 증빙자료가 부족하여 사업비 집행 또는 정산이 반려될 가능성이 있음</li></ul></td>
<td><ul class="risk-cell-list"><li>집행 전 증빙 체크리스트 확인 및 필수자료 확보</li></ul></td>
</tr>
<tr>
<td>장기</td>
<td>대외 커뮤니케이션</td>
<td><ul class="risk-cell-list"><li>외부기관·협력사와 역할과 일정이 불명확하여 업무 혼선이 발생할 가능성이 있음</li></ul></td>
<td><ul class="risk-cell-list"><li>회의록·메일 등으로 요청사항과 역할을 문서화하여 공유</li></ul></td>
</tr>
</tbody>
</table>

<h2>6. 각 컬럼별 작성 기준</h2>

<h3 class="risk-subheading">① 장기/단기</h3>
<p><strong>장기 리스크란?</strong></p>
<ul>
<li>당장 이번 주에 문제가 발생하는 것은 아니지만, 향후 일정 기간이 지나면서 사업 일정, 예산, 품질, 대외 신뢰도 등에 영향을 줄 수 있는 위험요소를 의미합니다.</li>
<li>예를 들어 계약 조건 미확정, 예산 부족 가능성, 외부기관 협의 지연, 장기적인 인력 부족, 정부지원사업 정산 증빙 미비 가능성 등이 해당됩니다.</li>
</ul>
<p><strong>단기 리스크란?</strong></p>
<ul>
<li>이번 주 또는 차주 업무 수행 과정에서 비교적 빠르게 문제가 발생할 수 있는 위험요소를 의미합니다.</li>
<li>예를 들어 자료 회신 지연, 내부 검토 일정 부족, 담당자 부재, 제출기한 임박, 산출물 검수 부족 등이 해당됩니다.</li>
</ul>

<h3 class="risk-subheading">② 항목</h3>
<table class="risk-table risk-table--items">
<thead>
<tr><th>항목</th><th>항목 설명</th></tr>
</thead>
<tbody>
<tr>
<td>일정</td>
<td><ul class="risk-cell-list"><li>자료 수급 지연, 승인 지연, 회신 지연, 제출기한 임박 등으로 업무 일정이 늦어질 가능성</li></ul></td>
</tr>
<tr>
<td>품질</td>
<td><ul class="risk-cell-list"><li>내부 검토 부족, 요구사항 누락, 오탈자, 산출물 완성도 부족 등으로 결과물 품질이 낮아질 가능성</li></ul></td>
</tr>
<tr>
<td>비용·계약</td>
<td><ul class="risk-cell-list"><li>견적 불명확, 예산 초과, 계약 조건 미확정 등으로 비용 집행 또는 계약 진행에 문제가 생길 가능성</li></ul></td>
</tr>
<tr>
<td>규정·증빙</td>
<td><ul class="risk-cell-list"><li>정부지원사업 지침, 내부결재, 세금계산서, 견적서, 검수자료 등 증빙 요건을 충족하지 못할 가능성</li></ul></td>
</tr>
<tr>
<td>역량·수행</td>
<td><ul class="risk-cell-list"><li>담당자의 기술역량, 업무 숙련도, 경험 부족 등으로 인해 결과물 완성도나 업무 속도에 영향이 생길 가능성</li></ul></td>
</tr>
<tr>
<td>대외 커뮤니케이션</td>
<td><ul class="risk-cell-list"><li>고객사, 협력사, 전담기관, 외부기관과의 소통 지연 또는 오해로 업무 차질이 생길 가능성</li></ul></td>
</tr>
<tr>
<td>그 외 기타...</td>
<td><ul class="risk-cell-list"><li>상기 항목 외 기타 업무 리스크 내용</li></ul></td>
</tr>
</tbody>
</table>

${RISK_PAGE_BREAK_HTML}

<div class="risk-column-section">
<h3 class="risk-column-title">③ 리스크 내용</h3>
<p>리스크 내용에는 <span class="risk-accent">"어떤 업무에서, 어떤 문제가, 왜 발생할 수 있으며, 발생할 경우 어떤 영향이 있는지"</span>를 작성합니다.</p>
<p>단순히 "일정 지연 우려"처럼 짧게 작성하기보다는, 아래 구조로 작성하는 것이 좋습니다.</p>

<div class="risk-callout risk-callout--guide">
<p class="risk-callout-label">작성 구조:</p>
<ul>
<li>○○ 업무에서 ○○ 사유로 인해 ○○ 문제가 발생할 가능성이 있으며, 이로 인해 ○○에 영향이 있을 수 있음</li>
</ul>
</div>

<div class="risk-callout risk-callout--guide">
<p class="risk-callout-label">작성 예시:</p>
<ul>
<li>협력사 자료 회신이 지연될 경우, 금주 예정된 제안서 작성 및 내부 검토 일정이 늦어질 가능성이 있음</li>
</ul>
</div>

<div class="risk-callout risk-callout--warn">
<p class="risk-callout-label">주의사항:</p>
<ul>
<li>이미 문제가 발생한 사항은 "리스크"가 아니라 "이슈"에 해당하므로, 리스크에는 아직 발생하지 않았지만 발생 가능성이 있는 내용을 작성합니다.</li>
</ul>
</div>
</div>

<div class="risk-column-section">
<h3 class="risk-column-title">④ 해결 및 대응방안</h3>
<p>해결 및 대응방안에는 작성한 리스크가 실제 문제로 이어지지 않도록, 사전에 어떤 조치를 할 것인지 구체적으로 작성합니다.</p>
<p>단순히 "확인 예정", "대응 예정"이라고 작성하기보다는, 실행방향을 알 수 있도록 구체적으로 작성하는 것이 좋습니다.</p>

<div class="risk-callout risk-callout--guide">
<p class="risk-callout-label">작성 구조:</p>
<ul>
<li>○○을 사전에 확인하고, ○○ 조치를 통해 리스크 발생 가능성을 낮춤</li>
</ul>
</div>

<div class="risk-callout risk-callout--guide">
<p class="risk-callout-label">작성 예시:</p>
<ul>
<li>경험자에게 사전 확인 후 중간 결과물 검토 요청 후 피드백 반영</li>
</ul>
</div>

<div class="risk-callout risk-callout--warn">
<p class="risk-callout-label">작성 기준</p>
<ul>
<li>해결 및 대응방안은 "문제가 생기면 대응하겠다"가 아니라, 문제가 생기지 않도록 미리 어떤 조치를 하겠다는 내용으로 작성합니다.</li>
</ul>
</div>
</div>

<div class="risk-section-highlight">
<h2>7. 업무리스크 작성 시 유의사항</h2>
</div>
<ul class="risk-list--notes">
<li>업무 리스크는 담당자의 잘못을 지적하기 위한 항목이 아니라, 업무 진행 중 발생할 수 있는 <span class="risk-emphasis">"문제를 사전에 공유하고 예방하기 위한 관리 항목입니다."</span></li>
<li>따라서 직원들은 일정, 품질, 비용, 규정, 대외 커뮤니케이션 등에 영향을 줄 수 있는 사항이 있다면 <span class="risk-emphasis">"작게 보이는 내용이라도 주간업무보고서에 작성하여 사전에 공유하는 것이 필요합니다."</span></li>
</ul>
`.trim();

function formatRiskGuideDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createRiskGuideFormData(overrides = {}, { useExample = true } = {}) {
  return {
    templateId: 'risk-guide',
    title: '업무 리스크 관리',
    author: 'istagingasia 오성진 과장',
    date: formatRiskGuideDate(),
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
