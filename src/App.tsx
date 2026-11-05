import { useEffect } from 'react';
import { Home } from './components/Home';
import { ProblemPage } from './components/ProblemPage';
import { ui, useLang } from './i18n';
import { problemById } from './problems';
import { useProgress } from './progress';
import { href, useRoute } from './router';

export function App() {
  const route = useRoute();
  const { lang, setLang, t } = useLang();
  const { progress, markLearned, markSolved } = useProgress();
  const problem = route.page === 'problem' ? problemById(route.id) : undefined;

  useEffect(() => {
    document.title = problem ? `${problem.number}. ${t(problem.title)} · AlgoSim` : 'AlgoSim';
  }, [problem, t]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [problem]);

  return (
    <>
      <nav className="topbar">
        <a className="logo" href={href({ page: 'home' })}>
          <span className="logo-mark">[ ]</span> AlgoSim
        </a>
        <div className="seg lang" role="group" aria-label="Language">
          <button className={lang === 'zh' ? 'on' : ''} onClick={() => setLang('zh')}>
            繁中
          </button>
          <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>
            EN
          </button>
        </div>
      </nav>
      {route.page === 'home' ? (
        <Home progress={progress} />
      ) : problem ? (
        <ProblemPage
          key={problem.id}
          problem={problem}
          mode={route.mode}
          progress={progress[problem.id]}
          markLearned={markLearned}
          markSolved={markSolved}
        />
      ) : (
        <main className="page">
          <p>{t(ui.notFound)}</p>
          <a href={href({ page: 'home' })}>{t(ui.back)}</a>
        </main>
      )}
    </>
  );
}
