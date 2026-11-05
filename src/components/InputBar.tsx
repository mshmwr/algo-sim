import { useState } from 'react';
import type { Problem } from '../core/types';
import { ui, useLang } from '../i18n';

interface Props {
  problem: Problem;
  input: unknown;
  exampleIndex: number | null;
  onChange: (input: unknown, exampleIndex: number | null) => void;
}

export function InputBar({ problem, input, exampleIndex, onChange }: Props) {
  const { t } = useLang();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const openEditor = () => {
    setText(JSON.stringify(input));
    setError(null);
    setEditing(true);
  };

  const applyCustom = () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError(t(ui.invalidJson));
      return;
    }
    const e = problem.validate(parsed);
    if (e) {
      setError(t(e));
      return;
    }
    setEditing(false);
    onChange(parsed, null);
  };

  return (
    <div className="input-bar">
      <div className="input-row">
        <span className="input-label">{t(ui.input)}</span>
        <div className="seg">
          {problem.examples.map((ex, i) => (
            <button key={i} className={exampleIndex === i ? 'on' : ''} onClick={() => onChange(ex, i)}>
              {t(ui.example)} {i + 1}
            </button>
          ))}
          <button onClick={() => onChange(problem.random(), null)}>🎲 {t(ui.random)}</button>
          <button className={editing ? 'on' : ''} onClick={() => (editing ? setEditing(false) : openEditor())}>
            ✎ {t(ui.custom)}
          </button>
        </div>
      </div>
      {editing ? (
        <div className="input-editor">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} spellCheck={false} />
          {error && <div className="input-error">{error}</div>}
          <div className="input-editor-actions">
            <button className="btn primary" onClick={applyCustom}>
              {t(ui.apply)}
            </button>
            <button className="btn" onClick={() => setEditing(false)}>
              {t(ui.cancel)}
            </button>
          </div>
        </div>
      ) : (
        <code className="input-current">{problem.formatInput(input)}</code>
      )}
    </div>
  );
}
