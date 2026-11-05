import { useCallback, useState } from 'react';
import { categoryById } from '../core/categories';
import type { Problem } from '../core/types';
import { ui, useLang } from '../i18n';
import { leetcodeUrl } from '../problems';
import type { ProblemProgress } from '../progress';
import { href, navigate } from '../router';
import { InputBar } from './InputBar';
import { LearnMode } from './LearnMode';
import { PracticeMode } from './PracticeMode';

interface Props {
  problem: Problem;
  mode: 'learn' | 'practice';
  progress?: ProblemProgress;
  markLearned: (id: string) => void;
  markSolved: (id: string, mistakes: number) => void;
}

export function ProblemPage({ problem, mode, progress, markLearned, markSolved }: Props) {
  const { t, lang } = useLang();
  const [input, setInput] = useState<unknown>(problem.examples[0]);
  const [exampleIndex, setExampleIndex] = useState<number | null>(0);
  const [showInsight, setShowInsight] = useState(false);

  const changeInput = (i: unknown, ex: number | null) => {
    setInput(i);
    setExampleIndex(ex);
  };

  const onFinished = useCallback(() => markLearned(problem.id), [markLearned, problem.id]);
  const onSolved = useCallback((m: number) => markSolved(problem.id, m), [markSolved, problem.id]);
  const cat = categoryById(problem.category);
  const insightVisible = mode === 'learn' || showInsight;

  return (
    <main className="page problem-page">
      <a className="back" href={href({ page: 'home' })}>
        {t(ui.back)}
      </a>
      <header className="problem-head">
        <div className="problem-meta">
          <span className="muted">{t(cat.name)}</span>
          <span className={`diff diff-${problem.difficulty}`}>{problem.difficulty}</span>
          {progress?.solved && (
            <span className="badge-solved">
              ✓ {t(ui.solved)}
              {progress.bestMistakes !== undefined && ` · ${t(ui.bestMistakes)} ${progress.bestMistakes} ${t(ui.mistakes)}`}
            </span>
          )}
        </div>
        <h1>
          <span className="num">{problem.number}.</span> {t(problem.title)}
        </h1>
        <p className="desc">
          {t(problem.description)}{' '}
          <a href={leetcodeUrl(problem)} target="_blank" rel="noreferrer">
            {t(ui.openLeetCode)} ↗
          </a>
        </p>
        {insightVisible ? (
          <div className="insight">
            <b>{t(ui.insight)}{lang === 'zh' ? '：' : ': '}</b>
            {t(problem.insight)}
            {mode === 'practice' && (
              <button className="link-btn" onClick={() => setShowInsight(false)}>
                {t(ui.hideInsight)}
              </button>
            )}
          </div>
        ) : (
          <button className="link-btn" onClick={() => setShowInsight(true)}>
            {t(ui.showInsight)}
          </button>
        )}
      </header>

      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={mode === 'learn'}
          className={mode === 'learn' ? 'on' : ''}
          onClick={() => navigate({ page: 'problem', id: problem.id, mode: 'learn' })}
        >
          ▶ {t(ui.learnMode)}
        </button>
        <button
          role="tab"
          aria-selected={mode === 'practice'}
          className={mode === 'practice' ? 'on' : ''}
          onClick={() => navigate({ page: 'problem', id: problem.id, mode: 'practice' })}
        >
          ✋ {t(ui.practiceMode)}
        </button>
      </div>

      <InputBar problem={problem} input={input} exampleIndex={exampleIndex} onChange={changeInput} />

      {mode === 'learn' ? (
        <LearnMode
          problem={problem}
          input={input}
          onFinished={onFinished}
          onPractice={() => navigate({ page: 'problem', id: problem.id, mode: 'practice' })}
        />
      ) : (
        <PracticeMode
          problem={problem}
          input={input}
          onSolved={onSolved}
          onRandom={() => changeInput(problem.random(), null)}
          onWatch={() => navigate({ page: 'problem', id: problem.id, mode: 'learn' })}
        />
      )}
    </main>
  );
}
