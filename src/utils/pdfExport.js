import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function exportToPDF(elementId, filename = '보고서.pdf') {
  const original = document.getElementById(elementId);
  if (!original) return;

  // 1. 메모리 상에서 복제 (깊은 복사)
  const cloned = original.cloneNode(true);

  // 2. 인쇄에 최적화된 독립 임시 컨테이너 생성 및 화면에 안 보이게 부착
  const tempContainer = document.createElement('div');
  tempContainer.className = 'pdf-temp-container';

  // 브라우저 렌더러가 올바른 폰트 및 스타일 계산을 할 수 있도록 body 아래에 완전히 숨겨서 임시 부착
  // scale 왜곡을 없애기 위해 transform은 none으로 설정
  Object.assign(tempContainer.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '794px', // A4 고정 픽셀 너비
    transform: 'none',
    opacity: '0',
    zIndex: '-9999',
    pointerEvents: 'none',
  });

  // 복제본의 gap 및 스타일 조정
  cloned.style.transform = 'none';
  cloned.style.margin = '0';
  cloned.style.padding = '0';
  cloned.style.width = '794px';

  const wrapper = cloned.classList.contains('doc-pages-wrapper')
    ? cloned
    : cloned.querySelector('.doc-pages-wrapper');
  if (wrapper) {
    wrapper.style.gap = '0';
    wrapper.style.margin = '0';
    wrapper.style.padding = '0';
    wrapper.style.transform = 'none';
    wrapper.style.width = '794px';
  }

  // 복제본 내부의 개별 페이지 그림자 및 테두리 정리
  const pages = cloned.querySelectorAll('.a4-page');
  pages.forEach((page) => {
    page.style.boxShadow = 'none';
    page.style.height = '1122px'; // 1px 줄임으로 크기 오차 예방
    page.style.margin = '0';
    page.style.border = 'none';
  });

  tempContainer.appendChild(cloned);
  document.body.appendChild(tempContainer);

  // 3. jsPDF 인스턴스 생성 (A4 가로 210mm, 세로 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  try {
    // 4. 임시 컨테이너 내부의 복제된 페이지들을 하나씩 캡처
    const tempPages = cloned.querySelectorAll('.a4-page');

    for (let i = 0; i < tempPages.length; i++) {
      const pageEl = tempPages[i];

      // 부모 scale 영향이 완전히 제거된 요소 캡처
      const canvas = await html2canvas(pageEl, {
        scale: 2.5, // 2.5배 해상도로 인쇄 퀄리티 상향
        useCORS: true,
        logging: false,
        scrollY: 0,
        scrollX: 0,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);

      // 두 번째 페이지부터는 새 PDF 페이지 추가
      if (i > 0) {
        doc.addPage();
      }

      // PDF 1면에 정확히 꽉 채워 배치
      doc.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }

    // 5. PDF 파일 저장
    doc.save(filename);
  } finally {
    // 6. 캡처가 끝나면 임시 요소를 DOM에서 흔적 없이 제거
    document.body.removeChild(tempContainer);
  }
}
