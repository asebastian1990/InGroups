import { useEffect } from 'react';

/** Clear stuck submit/busy state after bfcache restore (common when OAuth is cancelled). */
export function useAuthFormIdleReset(onReset: () => void) {
  useEffect(() => {
    onReset();

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) onReset();
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [onReset]);
}
