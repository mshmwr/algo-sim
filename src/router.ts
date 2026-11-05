import { useEffect, useState } from 'react';

export type Route = { page: 'home' } | { page: 'problem'; id: string; mode: 'learn' | 'practice' };

export function parseHash(hash: string): Route {
  const m = hash.replace(/^#\/?/, '').split('/');
  if (m[0] === 'p' && m[1]) return { page: 'problem', id: m[1], mode: m[2] === 'practice' ? 'practice' : 'learn' };
  return { page: 'home' };
}

export const href = (r: Route) => (r.page === 'home' ? '#/' : `#/p/${r.id}/${r.mode}`);

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
