import { useEffect, useState } from 'react';

export type Route = { page: 'home' } | { page: 'problem'; id: string; mode: 'learn' | 'practice' };

const PRACTICE = '--practice';

/** Hashes are plain names (`#daily-temperatures`, `#daily-temperatures--practice`) so links survive hosts that only pass `#name`. */
export function parseHash(hash: string): Route {
  const h = decodeURIComponent(hash.replace(/^#\/?/, ''));
  if (!h) return { page: 'home' };
  if (h.endsWith(PRACTICE)) return { page: 'problem', id: h.slice(0, -PRACTICE.length), mode: 'practice' };
  return { page: 'problem', id: h, mode: 'learn' };
}

export const href = (r: Route) => (r.page === 'home' ? '#' : `#${r.id}${r.mode === 'practice' ? PRACTICE : ''}`);

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const navigate = (r: Route) => {
  window.location.hash = href(r);
};
