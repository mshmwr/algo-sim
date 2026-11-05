import type { ArrayLayer, Layer, SetLayer, StackLayer, VarsLayer } from '../core/types';
import { ui, useLang } from '../i18n';

const cellSize = (n: number) => (n > 18 ? 28 : n > 13 ? 34 : 44);

function ArrayView({ layer }: { layer: ArrayLayer }) {
  const { t } = useLang();
  const n = layer.values.length;
  const cell = cellSize(n);
  const pointers = layer.pointers ?? [];
  // Stack pointer labels that share an index.
  const slot: Record<number, number> = {};
  const placed = pointers
    .filter((p) => p.index >= 0 && p.index <= n)
    .map((p) => {
      const level = slot[p.index] ?? 0;
      slot[p.index] = level + 1;
      return { ...p, level };
    });
  const levels = Math.max(1, ...Object.values(slot));
  const nums = layer.values.filter((v): v is number => typeof v === 'number');
  const maxV = Math.max(1, ...nums);
  const minV = nums.length ? Math.min(...nums) : 0;
  // Zoom in when values are clustered (e.g. temperatures 69–76) so differences stay visible.
  const base = minV > 0 && minV / maxV > 0.5 ? minV - (maxV - minV) * 0.6 : 0;
  const barPct = (v: number) => 12 + (88 * (Math.max(v, base) - base)) / Math.max(1, maxV - base);
  const slots = n + (pointers.some((p) => p.index === n) ? 1 : 0);
  // Shrink cells on narrow screens so the whole array fits.
  const cellCss = `max(24px, min(${cell}px, calc((100vw - 72px) / ${Math.max(slots, 1)})))`;

  return (
    <div className="layer layer-array">
      <div className="layer-label">{t(layer.label)}</div>
      <div className="array-scroll">
        <div className="array" style={{ width: `calc(var(--cell) * ${slots})`, ['--cell' as string]: cellCss }}>
          {pointers.length > 0 && (
            <div className="pointer-row" style={{ height: levels * 22 + 10 }}>
              {placed.map((p) => (
                <div
                  key={p.name}
                  className={`pointer pointer-${p.color ?? 'a'}`}
                  style={{ left: `calc(var(--cell) * ${p.index + 0.5})`, bottom: p.level * 22 }}
                >
                  <span>{p.name}</span>
                  <i />
                </div>
              ))}
            </div>
          )}
          <div className={`cells${layer.bars ? ' cells-bars' : ''}`}>
            {layer.values.map((v, i) => {
              // active: undefined = no dimming, [lo, hi] = dim outside, null = empty range (dim all)
              const dim =
                layer.active === undefined ? false : layer.active === null ? true : i < layer.active[0] || i > layer.active[1];
              const inWin = layer.window ? i >= layer.window[0] && i <= layer.window[1] : false;
              const mark = layer.marks?.[i];
              const cls = ['cell', dim && !mark ? 'dim' : '', inWin ? 'win' : '', mark ? `mark-${mark}` : '']
                .filter(Boolean)
                .join(' ');
              return (
                <div key={i} className={cls}>
                  {layer.bars && typeof v === 'number' ? (
                    <>
                      <div className="bar-wrap">
                        <div className="bar" style={{ height: `${barPct(v)}%` }} />
                      </div>
                      <span className="bar-val">{v}</span>
                    </>
                  ) : (
                    <span className="cell-val">{v}</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="indices">
            {layer.values.map((_, i) => (
              <div key={i} className="idx">
                {i}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StackView({ layer }: { layer: StackLayer }) {
  const { t } = useLang();
  return (
    <div className="layer layer-stack">
      <div className="layer-label">{t(layer.label)}</div>
      <div className="stack">
        {layer.items.length === 0 && <div className="stack-empty">{t(ui.empty)}</div>}
        {layer.items.map((v, i) => (
          <div key={`${i}:${v}`} className={`stack-item${i === layer.items.length - 1 ? ' stack-top' : ''}`}>
            <span>{v}</span>
            {i === layer.items.length - 1 && <em>{t(ui.top)}</em>}
          </div>
        ))}
      </div>
    </div>
  );
}

function SetView({ layer }: { layer: SetLayer }) {
  const { t } = useLang();
  return (
    <div className="layer layer-set">
      <div className="layer-label">{t(layer.label)}</div>
      <div className="chips">
        {layer.items.length === 0 && <span className="muted">{t(ui.empty)}</span>}
        {layer.items.map((v) => (
          <span key={String(v)} className="chip">
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

function VarsView({ layer }: { layer: VarsLayer }) {
  return (
    <div className="layer layer-vars">
      {layer.vars.map((v) => (
        <div key={v.name} className={`var${v.highlight ? ' var-hl' : ''}`}>
          <code>{v.name}</code>
          <b>{String(v.value)}</b>
        </div>
      ))}
    </div>
  );
}

export function Scene({ layers }: { layers: Layer[] }) {
  const arrays = layers.filter((l): l is ArrayLayer => l.kind === 'array');
  const side = layers.filter((l) => l.kind !== 'array');
  return (
    <div className="scene">
      {arrays.map((l) => (
        <ArrayView key={l.id} layer={l} />
      ))}
      {side.length > 0 && (
        <div className="scene-side">
          {side.map((l) =>
            l.kind === 'stack' ? (
              <StackView key={l.id} layer={l} />
            ) : l.kind === 'set' ? (
              <SetView key={l.id} layer={l} />
            ) : l.kind === 'vars' ? (
              <VarsView key={l.id} layer={l} />
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
