import { useEffect, useMemo, useRef, useState } from 'react';
import { hintsFor, judge, judgeMove } from '../core/engine';
import { L, TAP, type L10n, type Problem } from '../core/types';
import { ui, useLang } from '../i18n';
import { CodePanel } from './CodePanel';
import { DemoGhost, DragContext, FloatingTile, usePointerDrag } from './drag';
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

const DRAG_HINT_SRC = L('拿起發光的那一塊。', 'Pick up the glowing tile.');
const DRAG_HINT_DEMO = L('示範：把發光的方塊拖到發光的位置。', 'Demo: drag the glowing tile onto the glowing spot.');
const TAP_HINT = L('點一下發光的區域。', 'Tap the glowing area.');

export function PracticeMode({ problem, input, onSolved, onRandom, onWatch }: Props) {
  const { t } = useLang();
  const isDrag = !!problem.drag;
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
  const stageRef = useRef<HTMLDivElement>(null);

  const done = problem.isDone(state);

  const record = (ok: boolean, message: L10n, next: unknown, action: string | null) => {
    const entry = { ok, message };
    setFeedback(entry);
    if (ok) {
      setState(next);
      setSteps((s) => s + 1);
      setHintLevel(0);
      if (action) setLine(problem.lineOf[action] ?? null);
      setLog((l) => [...l, entry]);
    } else {
      setMistakes((m) => m + 1);
      setShake((s) => s + 1);
    }
  };

  const act = (id: string) => {
    if (done) return;
    const j = judge(problem, state, id);
    record(j.ok, j.message, j.next, id);
  };

  const attempt = (from: string, to: string) => {
    if (done || !problem.drag) return false;
    const j = judgeMove(problem, state, from, to);
    record(j.ok, j.message, j.next, j.move?.action ?? null);
    return j.ok;
  };

  const drag = usePointerDrag(isDrag && !done, attempt, problem.drag?.tapZones);

  const reset = () => {
    setState(initial);
    setMistakes(0);
    setSteps(0);
    setHintLevel(0);
    setFeedback(null);
    setLog([]);
    setLine(problem.lineOf.init ?? null);
    drag.clear();
    reported.current = false;
  };

  useEffect(reset, [initial]);

  useEffect(() => {
    if (done && !reported.current) {
      reported.current = true;
      onSolved(mistakes);
    }
  }, [done, mistakes, onSolved]);

  const options = problem.options(state);
  // Prefer a real drag over a tap when showing hints, since dragging is the skill being practiced.
  const allMoves = !done && problem.drag ? problem.drag.moves(state) : [];
  const move = allMoves.find((m) => m.from !== TAP) ?? allMoves[0] ?? null;
  const isTap = move?.from === TAP;
  const hints: L10n[] = done
    ? []
    : isDrag
      ? (() => {
          const h = problem.hints(state);
          const second = isTap ? TAP_HINT : DRAG_HINT_SRC;
          return [
            h[0],
            L(`${h[1]?.zh ?? ''} ${second.zh}`.trim(), `${h[1]?.en ?? ''} ${second.en}`.trim()),
            isTap ? TAP_HINT : DRAG_HINT_DEMO,
          ];
        })()
      : hintsFor(problem, state);

  const showHint = () => setHintLevel((h) => Math.min(h + 1, hints.length));

  const actRef = useRef(act);
  actRef.current = act;
  const hintRef = useRef(showHint);
  hintRef.current = showHint;
  const optsRef = useRef(isDrag ? [] : options);
  optsRef.current = isDrag ? [] : options;

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

  const dragUI = {
    enabled: isDrag && !done,
    selected: drag.selected,
    hover: drag.hover,
    dragging: drag.dragging,
    glowFrom: move && !isTap && hintLevel >= 2 ? move.from : null,
    glowTo: move && (isTap ? hintLevel >= 2 : hintLevel >= 3) ? move.to : null,
  };

  const demoLabel = (() => {
    if (!move || hintLevel < 3) return '';
    const el = stageRef.current?.querySelector(`[data-drag-id="${CSS.escape(move.from)}"]`) as HTMLElement | null;
    return el?.dataset.dragLabel ?? '';
  })();

  return (
    <div className="mode-grid">
      <div className="stage">
        {isDrag && !done && <div className="drag-instructions">✋ {t(problem.drag!.instructions)}</div>}

        <DragContext.Provider value={dragUI}>
          <div
            ref={stageRef}
            className={`drag-stage${isDrag && !done ? ' drag-on' : ''}${shake && feedback && !feedback.ok ? ' shake' : ''}`}
            key={isDrag ? `s${shake}` : 'static'}
            onPointerDown={drag.onPointerDown}
          >
            <Scene layers={problem.scene(state)} />
            {move && !isTap && hintLevel >= 3 && <DemoGhost root={stageRef} from={move.from} to={move.to} label={demoLabel} />}
          </div>
        </DragContext.Provider>
        <FloatingTile f={drag.floating} />

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
          !isDrag && (
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
          )
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
        <p className="kbd-hint">{t(isDrag ? ui.keyboardDrag : ui.keyboardPractice)}</p>
      </div>
      <CodePanel code={problem.code} line={line} />
    </div>
  );
}
