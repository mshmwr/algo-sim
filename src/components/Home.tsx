import { useState } from 'react';
import { CATEGORIES } from '../core/categories';
import type { CategoryId, Difficulty } from '../core/types';
import { ui, useLang } from '../i18n';
import { PROBLEMS, problemsIn } from '../problems';
import { statusOf, type ProgressMap, type Status } from '../progress';
import { href } from '../router';

const DIFFS: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const STATUSES: Status[] = ['notStarted', 'learned', 'solved'];
const FILTER_KEY = 'algosim.filters';

interface Filters {
  cat: CategoryId | null;
  diff: Difficulty | null;
  status: Status | null;
}

function loadFilters(): Filters {
  try {
    const f = JSON.parse(sessionStorage.getItem(FILTER_KEY) ?? 'null');
    if (f && typeof f === 'object') return { cat: f.cat ?? null, diff: f.diff ?? null, status: f.status ?? null };
  } catch {
    /* ignore */
  }
  return { cat: null, diff: null, status: null };
}

export function Home({ progress }: { progress: ProgressMap }) {
  const { t } = useLang();
  const [filters, setFiltersState] = useState<Filters>(loadFilters);
  const setFilters = (f: Filters) => {
    setFiltersState(f);
    try {
      sessionStorage.setItem(FILTER_KEY, JSON.stringify(f));
    } catch {
      /* ignore */
    }
  };

  const solvedCount = PROBLEMS.filter((p) => progress[p.id]?.solved).length;
  const visible = PROBLEMS.filter(
    (p) =>
      (!filters.cat || p.category === filters.cat) &&
      (!filters.diff || p.difficulty === filters.diff) &&
      (!filters.status || statusOf(progress[p.id]) === filters.status),
  );
  const groups = CATEGORIES.map((c) => ({ c, items: visible.filter((p) => p.category === c.id) })).filter((g) => g.items.length);
  const anyFilter = filters.cat || filters.diff || filters.status;

  return (
    <main className="page home">
      <section className="hero">
        <h1>
          AlgoSim <span className="hero-sub">{t(ui.tagline)}</span>
        </h1>
        <div className="hero-stats">
          <div>
            <b>{solvedCount}</b> / {PROBLEMS.length} <span className="muted">{t(ui.solved)}</span>
          </div>
          <div>
            <b>{PROBLEMS.length}</b> / 150 <span className="muted">{t(ui.roadmap)}</span>
          </div>
        </div>
      </section>

      <section>
        <h2>{t(ui.categories)}</h2>
        <div className="cat-grid">
          {CATEGORIES.map((c) => {
            const items = problemsIn(c.id);
            const solved = items.filter((p) => progress[p.id]?.solved).length;
            const enabled = items.length > 0;
            const on = filters.cat === c.id;
            return (
              <button
                key={c.id}
                className={`cat-card${enabled ? '' : ' locked'}${on ? ' on' : ''}`}
                disabled={!enabled}
                aria-pressed={on}
                onClick={() => setFilters({ ...filters, cat: on ? null : c.id })}
              >
                <span className="cat-name">{t(c.name)}</span>
                <span className="cat-count">
                  {enabled ? (
                    <>
                      {items.length} / {c.total} {t(ui.available)}
                    </>
                  ) : (
                    t(ui.comingSoon)
                  )}
                </span>
                {enabled && (
                  <span className="cat-bar">
                    <i style={{ width: `${(solved / items.length) * 100}%` }} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="list-head">
          <h2>{t(ui.problems)}</h2>
          <div className="filters">
            <div className="seg" aria-label={t(ui.difficulty)}>
              <button className={!filters.diff ? 'on' : ''} onClick={() => setFilters({ ...filters, diff: null })}>
                {t(ui.all)}
              </button>
              {DIFFS.map((d) => (
                <button key={d} className={filters.diff === d ? 'on' : ''} onClick={() => setFilters({ ...filters, diff: d })}>
                  {d}
                </button>
              ))}
            </div>
            <div className="seg" aria-label={t(ui.status)}>
              <button className={!filters.status ? 'on' : ''} onClick={() => setFilters({ ...filters, status: null })}>
                {t(ui.all)}
              </button>
              {STATUSES.map((s) => (
                <button key={s} className={filters.status === s ? 'on' : ''} onClick={() => setFilters({ ...filters, status: s })}>
                  {t(ui[s])}
                </button>
              ))}
            </div>
          </div>
        </div>

        {groups.length === 0 && (
          <p className="muted">
            {t(ui.noMatch)}{' '}
            <button className="link-btn" onClick={() => setFilters({ cat: null, diff: null, status: null })}>
              {t(ui.clearFilters)}
            </button>
          </p>
        )}
        {anyFilter && groups.length > 0 && (
          <button className="link-btn" onClick={() => setFilters({ cat: null, diff: null, status: null })}>
            {t(ui.clearFilters)}
          </button>
        )}

        {groups.map(({ c, items }) => (
          <div key={c.id} className="group">
            <h3>{t(c.name)}</h3>
            <ul className="plist">
              {items.map((p) => {
                const st = statusOf(progress[p.id]);
                return (
                  <li key={p.id}>
                    <a href={href({ page: 'problem', id: p.id, mode: 'learn' })} className="prow">
                      <span className={`status-dot s-${st}`} title={t(ui[st])} />
                      <span className="num">{p.number}.</span>
                      <span className="ptitle">{t(p.title)}</span>
                      <span className={`diff diff-${p.difficulty}`}>{p.difficulty}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>
      <footer className="footer muted">{t(ui.footer)}</footer>
    </main>
  );
}
