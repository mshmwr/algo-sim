import { categoryById } from '../core/categories';
import type { Problem } from '../core/types';
import { ui, useLang } from '../i18n';

/** Definition and purpose of the technique, plus this problem's time / space complexity. */
export function AlgoInfo({ problem, open }: { problem: Problem; open: boolean }) {
  const { t } = useLang();
  const cat = categoryById(problem.category);
  const name = t(cat.name);
  return (
    <details className="algo-info" open={open}>
      <summary>📘 {t(ui.algoInfo)}</summary>
      <div className="algo-grid">
        {cat.definition && (
          <section>
            <h4>{t(ui.whatIs).replace('{name}', name)}</h4>
            <p>{t(cat.definition)}</p>
          </section>
        )}
        {cat.purpose && (
          <section>
            <h4>{t(ui.whenToUse)}</h4>
            <p>{t(cat.purpose)}</p>
          </section>
        )}
        <section className="algo-complexity">
          <h4>{t(ui.complexity)}</h4>
          <div className="big-o">
            <span>
              {t(ui.time)} <code>{problem.complexity.time}</code>
            </span>
            <span>
              {t(ui.space)} <code>{problem.complexity.space}</code>
            </span>
          </div>
          <p>{t(problem.complexity.why)}</p>
        </section>
      </div>
    </details>
  );
}
