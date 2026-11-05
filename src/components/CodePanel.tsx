import { useEffect, useRef, type ReactNode } from 'react';
import { ui, useLang } from '../i18n';

const KW = new Set([
  'def', 'return', 'while', 'for', 'in', 'if', 'elif', 'else', 'and', 'or', 'not', 'True', 'False', 'None', 'break', 'continue',
]);
const BUILTIN = new Set(['len', 'max', 'min', 'set', 'range', 'enumerate', 'int', 'self', 'List', 'str']);

function highlight(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(#.*$)|("[^"]*"|'[^']*')|(\b\d+\b)|([A-Za-z_]\w*)|(\s+)|([^\sA-Za-z_\d"'#]+)/g;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(line))) {
    const [tok, com, str, num, word] = m;
    const cls = com ? 'tk-com' : str ? 'tk-str' : num ? 'tk-num' : word && KW.has(word) ? 'tk-kw' : word && BUILTIN.has(word) ? 'tk-bi' : '';
    out.push(cls ? <span key={k++} className={cls}>{tok}</span> : tok);
  }
  return out;
}

export function CodePanel({ code, line }: { code: string; line: number | null }) {
  const { t } = useLang();
  const lines = code.split('\n');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector('.code-line.hl');
    if (el && ref.current) {
      const box = ref.current;
      const top = (el as HTMLElement).offsetTop;
      if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - 24) box.scrollTop = top - 40;
    }
  }, [line]);
  return (
    <div className="code-panel">
      <div className="panel-title">{t(ui.pythonCode)}</div>
      <div className="code" ref={ref}>
        {lines.map((l, i) => (
          <div key={i} className={`code-line${line === i + 1 ? ' hl' : ''}`}>
            <span className="ln">{i + 1}</span>
            <code>{highlight(l)}</code>
          </div>
        ))}
      </div>
    </div>
  );
}
