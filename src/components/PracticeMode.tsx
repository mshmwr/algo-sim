import { useEffect, useMemo, useRef, useState } from 'react';
import { hintsFor, judge } from '../core/engine';
import type { L10n, Problem } from '../core/types';
import { ui, useLang } from '../i18n';
import { CodePanel } from './CodePanel';
import { Scene } from './Scene';

interface Props {
  problem: Problem;
  input: unknown;
  onSolved: (mistakes: number) => void;
  onRandom: () => void;
  onWatch: () => void;
}

interface LogEntry {
  ok: boolean;
  message: L10n;
}

const isTyping = (e: KeyboardEvent) => {
  const el = e.target as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT');
};

export function PracticeMode({ problem, input, onSolved, onRandom, onWatch }: Props) {
  const { t } = useLang();
  const initial = useMemo(() => problem.init(input), [problem, input]);
  const [state, setState] = useState(initial);
  const [mistakes, setMistakes] = useState(0);
  const [steps, setSteps] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [feedback, setFeedback] = useState<LogEntry | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [line, setLine] = useState<number | null>(problem.lineOf.init ?? null);
  const [shake, setShake] = useState(0);
  const reported = useRef(false);

  const reset = () => {
    setState(initial);
    setMistakes(0);
    setSteps(0);
    setHintLevel(0);
    setFeedback(null);
    setLog([]);
    setLine(problem.lineOf.init ?? null);
    reported.current = false;
  };

  useEffect(reset, [initial]);

  const done = problem.isDone(state);
  const options = problem.options(state);
  const hints = done ? [] : hintsFor(problem, state);

  useEffect(() => {
    if (done && !reported.current) {
      reported.current = true;
      onSolved(mistakes);
    }
  }, [done, mistakes, onSolved]);

  const act = (id: string) => {
    if (done) return;
    const j = judge(problem, state, id);
    const entry = { ok: j.ok, message: j.message };
    setFeedback(entry);
    if (j.ok) {
      setState(j.next);
      setSteps((s) => s + 1);
      setHintLevel(0);
      setLine(problem.lineOf[id] ?? null);
      setLog((l) => [...l, entry]);
    } else {
      setMistakes((m) => m + 1);
      setShake((s) => s + 1);
    }
  };

  const showHint = () => setHintLevel((h) => Math.min(h + 1, hints.length));

  const actRef = useRef(act);
  actRef.current = act;
  const hintRef = useRef(showHint);
  hintRef.current = showHint;
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= optsRef.current.length) actRef.current(optsRef.current[n - 1].id);
      else if (e.key === 'h' || e.key === 'H') hintRef.current();
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, []);

  const logRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [log]);

  return (
    <div className="mode-grid">
      <div className="stage">
        <Scene layers={problem.scene(state)} />

        <div className="practice-stats">
          <span>
            {t(ui.steps)} <b>{steps}</b>
          </span>
          <span className={mistakes ? 'bad' : ''}>
            {t(ui.mistakes)} <b>{mistakes}</b>
          </span>
          <button className="btn small" onClick={reset}>
            ↺ {t(ui.restart)}
          </button>
        </div>

        {done ? (
          <div className="done-card">
            <div className="done-title">🎉 {t(ui.done)}</div>
            <div className="done-result">{t(problem.result(state))}</div>
            <div className="muted">
              {t(ui.steps)} {steps} · {t(ui.mistakes)} {mistakes}
              {mistakes === 0 ? ` · ${t(ui.perfect)}` : ''}
            </div>
            <div className="done-actions">
              <button className="btn primary" onClick={onRandom}>
                🎲 {t(ui.againRandom)}
              </button>
              <button className="btn" onClick={reset}>
                ↺ {t(ui.restart)}
              </button>
              <button className="btn" onClick={onWatch}>
                {t(ui.watchWalkthrough)}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="prompt">{t(ui.yourMove)}</div>
            <div className="actions" key={shake} data-shake={shake > 0 && feedback && !feedback.ok ? 'y' : 'n'}>
              {options.map((o, i) => (
                <button key={o.id} className="action-btn" onClick={() => act(o.id)}>
                  <kbd>{i + 1}</kbd>
                  {t(o.label)}
                </button>
              ))}
            </div>
          </>
        )}

        {feedback && !done && (
          <div className={`feedback ${feedback.ok ? 'ok' : 'no'}`} role="status">
            {feedback.ok ? '✓ ' : '✗ '}
            {t(feedback.message)}
          </div>
        )}

        {!done && (
          <div className="hints">
            <button className="btn small" onClick={showHint} disabled={hintLevel >= hints.length}>
              💡 {t(ui.hint)} ({hintLevel}/{hints.length})
            </button>
            {hints.slice(0, hintLevel).map((h, i) => (
              <div key={i} className="hint">
                {t(h)}
              </div>
            ))}
          </div>
        )}

        {log.length > 0 && (
          <details className="log" open={done}>
            <summary>
              {t(ui.log)} ({log.length})
            </summary>
            <ol ref={logRef}>
              {log.map((e, i) => (
                <li key={i}>{t(e.message)}</li>
              ))}
            </ol>
          </details>
        )}
        <p className="kbd-hint">{t(ui.keyboardPractice)}</p>
      </div>
      <CodePanel code={problem.code} line={line} />
    </div>
  );
}
