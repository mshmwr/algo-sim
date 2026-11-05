import { useEffect, useMemo, useState } from 'react';
import { buildTrace } from '../core/engine';
import type { Problem } from '../core/types';
import { ui, useLang } from '../i18n';
import { CodePanel } from './CodePanel';
import { Scene } from './Scene';

interface Props {
  problem: Problem;
  input: unknown;
  onFinished: () => void;
  onPractice: () => void;
}

const SPEEDS = [0.5, 1, 2];

const isTyping = (e: KeyboardEvent) => {
  const el = e.target as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT');
};

export function LearnMode({ problem, input, onFinished, onPractice }: Props) {
  const { t } = useLang();
  const trace = useMemo(() => buildTrace(problem, input), [problem, input]);
  const [k, setK] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const last = trace.length - 1;
  const step = trace[Math.min(k, last)];

  useEffect(() => {
    setK(0);
    setPlaying(false);
  }, [trace]);

  useEffect(() => {
    if (k >= last) {
      setPlaying(false);
      onFinished();
    }
  }, [k, last, onFinished]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => setK((x) => Math.min(x + 1, last)), 1400 / speed);
    return () => window.clearTimeout(id);
  }, [playing, k, speed, last]);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (isTyping(e)) return;
      if (e.key === 'ArrowRight') setK((x) => Math.min(x + 1, last));
      else if (e.key === 'ArrowLeft') setK((x) => Math.max(x - 1, 0));
      else if (e.key === ' ') {
        e.preventDefault();
        setPlaying((p) => (k >= last ? false : !p));
      } else return;
      if (e.key !== ' ') setPlaying(false);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [last, k]);

  const go = (x: number) => {
    setPlaying(false);
    setK(Math.max(0, Math.min(last, x)));
  };

  const finished = k >= last;

  return (
    <div className="mode-grid">
      <div className="stage">
        <Scene layers={problem.scene(step.state)} />
        <div className={`caption${finished ? ' caption-done' : ''}`}>
          <div className="caption-step">
            {t(ui.step)} {k} / {last}
          </div>
          <div>{t(step.note)}</div>
          {finished && <div className="caption-result">✓ {t(problem.result(step.state))}</div>}
        </div>
        <div className="controls">
          <button className="icon-btn" onClick={() => go(0)} disabled={k === 0} title={t(ui.first)} aria-label={t(ui.first)}>
            ⏮
          </button>
          <button className="icon-btn" onClick={() => go(k - 1)} disabled={k === 0} title={t(ui.prev)} aria-label={t(ui.prev)}>
            ◀
          </button>
          <button
            className="icon-btn primary"
            onClick={() => (finished ? go(0) : setPlaying((p) => !p))}
            title={playing ? t(ui.pause) : t(ui.play)}
            aria-label={playing ? t(ui.pause) : t(ui.play)}
          >
            {playing ? '⏸' : finished ? '↺' : '▶'}
          </button>
          <button className="icon-btn" onClick={() => go(k + 1)} disabled={finished} title={t(ui.next)} aria-label={t(ui.next)}>
            ▶
          </button>
          <button className="icon-btn" onClick={() => go(last)} disabled={finished} title={t(ui.last)} aria-label={t(ui.last)}>
            ⏭
          </button>
          <input
            className="scrub"
            type="range"
            min={0}
            max={last}
            value={k}
            onChange={(e) => go(Number(e.target.value))}
            aria-label={t(ui.step)}
          />
          <label className="speed">
            {t(ui.speed)}
            <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
              {SPEEDS.map((s) => (
                <option key={s} value={s}>
                  {s}×
                </option>
              ))}
            </select>
          </label>
        </div>
        {finished && (
          <button className="btn primary wide" onClick={onPractice}>
            {t(ui.tryIt)}
          </button>
        )}
        <p className="kbd-hint">{t(ui.keyboardLearn)}</p>
      </div>
      <CodePanel code={problem.code} line={step.line} />
    </div>
  );
}
