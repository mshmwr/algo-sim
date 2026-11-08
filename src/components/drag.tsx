import { TAP } from '../core/types';
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

/** Visual drag state shared with the Scene so it can mark draggables and drop zones. */
export interface DragUI {
  enabled: boolean;
  selected: string | null;
  hover: string | null;
  dragging: string | null;
  glowFrom: string | null;
  glowTo: string | null;
}

const NONE: DragUI = { enabled: false, selected: null, hover: null, dragging: null, glowFrom: null, glowTo: null };
export const DragContext = createContext<DragUI>(NONE);
export const useDragUI = () => useContext(DragContext);

/** Class names + data attributes for a draggable element. */
export function useDraggable(id: string | undefined, label?: string) {
  const ui = useDragUI();
  if (!ui.enabled || !id) return { className: '', attrs: {} };
  const cls = [
    'draggable',
    ui.selected === id ? 'selected' : '',
    ui.dragging === id ? 'dragging-src' : '',
    ui.glowFrom === id ? 'glow-src' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return { className: cls, attrs: { 'data-drag-id': id, 'data-drag-label': label } };
}

/** Class names + data attributes for a drop zone. */
export function useDroppable(id: string | undefined) {
  const ui = useDragUI();
  if (!ui.enabled || !id) return { className: '', attrs: {} };
  const active = !!(ui.dragging || ui.selected);
  const cls = ['droppable', active ? 'drop-armed' : '', ui.hover === id ? 'drop-hover' : '', ui.glowTo === id ? 'glow-dst' : '']
    .filter(Boolean)
    .join(' ');
  return { className: cls, attrs: { 'data-drop-id': id } };
}

const esc = (id: string) => CSS.escape(id);

/** Loops a translucent tile from the hinted source to the hinted target. */
export function DemoGhost({ root, from, to, label }: { root: RefObject<HTMLElement | null>; from: string; to: string; label: string }) {
  const [geo, setGeo] = useState<{ x: number; y: number; dx: number; dy: number; w: number; h: number } | null>(null);
  const [tick, setTick] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      const r = root.current;
      if (!r) return;
      const a = r.querySelector(`[data-drag-id="${esc(from)}"]`) as HTMLElement | null;
      const b = r.querySelector(`[data-drop-id="${esc(to)}"]`) as HTMLElement | null;
      if (!a || !b) return setGeo(null);
      const base = r.getBoundingClientRect();
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      const w = Math.max(40, Math.min(ra.width, 72));
      const h = 34;
      const x = ra.left - base.left + ra.width / 2 - w / 2;
      const y = ra.top - base.top + ra.height / 2 - h / 2;
      const tx = rb.left - base.left + rb.width / 2 - w / 2;
      const ty = rb.top - base.top + Math.min(rb.height, 60) / 2 - h / 2;
      setGeo({ x, y, dx: tx - x, dy: ty - y, w, h });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [root, from, to, tick]);

  // Re-measure periodically in case layout shifts (fonts, scroll containers).
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1500);
    return () => window.clearInterval(id);
  }, []);

  if (!geo) return null;
  return (
    <div
      className="demo-ghost"
      aria-hidden
      style={{
        left: geo.x,
        top: geo.y,
        width: geo.w,
        height: geo.h,
        ['--dx' as string]: `${geo.dx}px`,
        ['--dy' as string]: `${geo.dy}px`,
      }}
    >
      {label}
    </div>
  );
}

export interface DragHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
}

interface Pending {
  id: string;
  label: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  w: number;
  h: number;
  moved: boolean;
  zone: string | null;
}

export interface Floating {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  returning: boolean;
}

/**
 * Pointer-based drag & drop (mouse, pen and touch). Also supports tap-to-select, then tap a target.
 * `attempt(from, to)` returns true when the move was accepted.
 */
export function usePointerDrag(enabled: boolean, attempt: (from: string, to: string) => boolean, tapZones: string[] = []) {
  const tapRef = useRef(tapZones);
  tapRef.current = tapZones;
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [floating, setFloating] = useState<Floating | null>(null);
  const pending = useRef<Pending | null>(null);
  const attemptRef = useRef(attempt);
  attemptRef.current = attempt;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const zoneAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    return (el?.closest('[data-drop-id]') as HTMLElement | null)?.dataset.dropId ?? null;
  };

  const flyBack = (p: Pending) => {
    setFloating({ label: p.label, x: p.originX, y: p.originY, w: p.w, h: p.h, returning: true });
    window.setTimeout(() => setFloating(null), 320);
  };

  useEffect(() => {
    if (!enabled) return;
    const move = (e: PointerEvent) => {
      const p = pending.current;
      if (!p) return;
      const dx = e.clientX - p.startX;
      const dy = e.clientY - p.startY;
      if (!p.moved && Math.hypot(dx, dy) < 6) return;
      if (!p.moved) {
        p.moved = true;
        setDragging(p.id);
        setSelected(null);
      }
      setFloating({ label: p.label, x: p.originX + dx, y: p.originY + dy, w: p.w, h: p.h, returning: false });
      setHover(zoneAt(e.clientX, e.clientY));
    };
    const up = (e: PointerEvent) => {
      const p = pending.current;
      if (!p) return;
      pending.current = null;
      setDragging(null);
      setHover(null);
      if (p.moved) {
        const to = zoneAt(e.clientX, e.clientY);
        if (!to || to === p.zone) return flyBack(p); // dropped nowhere / back where it was: no penalty
        if (attemptRef.current(p.id, to)) setFloating(null);
        else flyBack(p);
        return;
      }
      // A tap: if a tile is already selected and this is a different target, try the move.
      const sel = selectedRef.current;
      const to = zoneAt(e.clientX, e.clientY);
      // The zone the selected tile already sits in (dropping it there is a no-op).
      const selEl = sel ? document.querySelector(`[data-drag-id="${CSS.escape(sel)}"]`) : null;
      const selHome = (selEl?.closest('[data-drop-id]') as HTMLElement | null)?.dataset.dropId ?? null;
      if (sel && sel !== p.id && to && to !== selHome) {
        setSelected(null);
        attemptRef.current(sel, to);
        return;
      }
      setSelected(sel === p.id ? null : p.id);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [enabled]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!enabled || e.button > 0) return;
    const target = e.target as HTMLElement;
    const el = target.closest('[data-drag-id]') as HTMLElement | null;
    if (!el) {
      // Tap on a bare drop zone with a selection: try the move.
      const zone = (target.closest('[data-drop-id]') as HTMLElement | null)?.dataset.dropId;
      const sel = selectedRef.current;
      if (zone && sel) {
        e.preventDefault();
        setSelected(null);
        attemptRef.current(sel, zone);
      } else if (zone && tapRef.current.includes(zone)) {
        e.preventDefault();
        attemptRef.current(TAP, zone);
      } else setSelected(null);
      return;
    }
    e.preventDefault();
    const r = el.getBoundingClientRect();
    const w = Math.max(44, Math.min(r.width, 80));
    const h = 36;
    pending.current = {
      id: el.dataset.dragId!,
      label: el.dataset.dragLabel ?? el.textContent ?? '',
      startX: e.clientX,
      startY: e.clientY,
      originX: r.left + r.width / 2 - w / 2,
      originY: r.top + r.height / 2 - h / 2,
      w,
      h,
      moved: false,
      zone: (el.closest('[data-drop-id]') as HTMLElement | null)?.dataset.dropId ?? null,
    };
  };

  const clear = () => {
    setSelected(null);
    setFloating(null);
  };

  return { selected, hover, dragging, floating, onPointerDown, clear };
}

export function FloatingTile({ f }: { f: Floating | null }) {
  if (!f) return null;
  return (
    <div className={`floating-tile${f.returning ? ' returning' : ''}`} style={{ left: f.x, top: f.y, width: f.w, height: f.h }} aria-hidden>
      {f.label}
    </div>
  );
}
