import { useEffect, useRef, useState } from 'react';
import { MOBILE_BREAKPOINT } from '../constants/editorFormOptions';
import useMediaQuery from './useMediaQuery';

export default function useMobileEditorView() {
  const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT}px)`);
  const [mobileView, setMobileView] = useState('form');
  const previewScrollRef = useRef(null);
  const previewActive = !isMobile || mobileView === 'preview';

  useEffect(() => {
    if (!isMobile) setMobileView('form');
  }, [isMobile]);

  useEffect(() => {
    if (isMobile && mobileView === 'preview') {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isMobile, mobileView]);

  useEffect(() => {
    if (isMobile && mobileView === 'preview' && previewScrollRef.current) {
      requestAnimationFrame(() => {
        previewScrollRef.current?.scrollTo(0, 0);
      });
    }
  }, [isMobile, mobileView]);

  return {
    isMobile,
    mobileView,
    setMobileView,
    previewScrollRef,
    previewActive,
  };
}
