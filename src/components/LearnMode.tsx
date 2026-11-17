import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildTrace } from '../core/engine';
import { TAP, type DragMove, type Problem } from '../core/types';
import { ui, useLang } from '../i18n';
import { CodePanel } from './CodePanel';
import { DemoGhost, DragContext, type DragUI } from './drag';
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
  /** The move being animated from trace[k] to trace[k + 1]. */
  const [flying, setFlying] = useState<DragMove | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const last = trace.length - 1;
  const step = trace[Math.min(k, last)];
  const flyMs = 700 / speed;

  useEffect(() => {
    setK(0);
    setPlaying(false);
    setFlying(null);
  }, [trace]);

  useEffect(() => {
    if (k >= last) {
      setPlaying(false);
      onFinished();
    }
  }, [k, last, onFinished]);

  /** The drag move that turns trace[i] into trace[i + 1], preferring a real drag over a tap. */
  const moveAt = useCallback(
    (i: number): DragMove | null => {
      if (!problem.drag || i >= last) return null;
      const action = trace[i + 1].action;
      const moves = problem.drag.moves(trace[i].state).filter((m) => m.action === action);
      return moves.find((m) => m.from !== TAP) ?? moves[0] ?? null;
    },
    [problem, trace, last],
  );

  /** Step forward one move, animating the tile first when the problem is drag-based. */
  const advance = useCallback(() => {
    if (flying) return;
    setK((x) => {
      if (x >= last) return x;
      const m = moveAt(x);
      if (!m) return x + 1;
      setFlying(m);
      return x;
    });
  }, [flying, last, moveAt]);

  useEffect(() => {
    if (!flying) return;
    const id = window.setTimeout(() => {
      setFlying(null);
      setK((x) => Math.min(x + 1, last));
    }, flyMs);
    return () => window.clearTimeout(id);
  }, [flying, flyMs, last]);

  useEffect(() => {
    if (!playing || flying) return;
    const id = window.setTimeout(advance, 900 / speed);
    return () => window.clearTimeout(id);
  }, [playing, flying, k, speed, advance]);

  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (isTyping(e)) return;
      if (e.key === 'ArrowRight') advanceRef.current();
      else if (e.key === 'ArrowLeft') {
        setFlying(null);
        setK((x) => Math.max(x - 1, 0));
      } else if (e.key === ' ') {
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
    setFlying(null);
    setK(Math.max(0, Math.min(last, x)));
  };

  const dragUI: DragUI = {
    enabled: !!problem.drag,
    selected: null,
    hover: null,
    dragging: null,
    glowFrom: flying && flying.from !== TAP ? flying.from : null,
    glowTo: flying ? flying.to : null,
  };

  const finished = k >= last;

  return (
    <div className="mode-grid">
      <div className="stage">
        <DragContext.Provider value={dragUI}>
          <div className="drag-stage learn-stage" ref={stageRef}>
            <Scene layers={problem.scene(step.state)} />
            {flying && flying.from !== TAP && (
              <DemoGhost key={`${k}:${flying.from}`} root={stageRef} from={flying.from} to={flying.to} once durationMs={flyMs} />
            )}
          </div>
        </DragContext.Provider>
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
          <button className="icon-btn" onClick={() => { setPlaying(false); advance(); }} disabled={finished} title={t(ui.next)} aria-label={t(ui.next)}>
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
