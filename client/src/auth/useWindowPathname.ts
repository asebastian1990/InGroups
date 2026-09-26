import { useEffect, useState } from 'react';

/** Re-render when the URL path changes (Clerk OAuth callbacks use history API). */
export function useWindowPathname(): string {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const sync = () => setPathname(window.location.pathname);

    window.addEventListener('popstate', sync);

    const { pushState, replaceState } = window.history;
    window.history.pushState = function (...args) {
      pushState.apply(this, args);
      sync();
    };
    window.history.replaceState = function (...args) {
      replaceState.apply(this, args);
      sync();
    };

    return () => {
      window.removeEventListener('popstate', sync);
      window.history.pushState = pushState;
      window.history.replaceState = replaceState;
    };
  }, []);

  return pathname;
}
