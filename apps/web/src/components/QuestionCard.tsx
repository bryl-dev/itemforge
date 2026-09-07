import { useState } from 'react';
import { api, type Question } from '../api';
import { FindingList } from './FindingList';

interface Props {
  question: Question;
  mode: 'review' | 'bank';
  onChanged: (question: Question) => void;
}

export function QuestionCard({ question, mode, onChanged }: Props) {
  const [editing, setEditing] = useState(false);
  const [stem, setStem] = useState(question.stem);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<Question>): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      onChanged(await action());
      setEditing(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The request failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-xl border border-ink-200 bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
            {question.difficulty} · {question.bloomLevel} · {question.type.replace('_', ' ')}
          </p>
          <h3 className="mt-1 text-lg font-medium text-ink-900">{question.stem}</h3>
        </div>
        <StatusPill status={question.status} />
      </header>

      <ol className="mt-4 space-y-2" aria-label="Answer choices">
        {question.choices.map((choice) => (
          <li
            key={choice.id}
            className={
              choice.isCorrect
                ? 'rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2'
                : 'rounded-md border border-ink-200 px-3 py-2'
            }
          >
            <span className="font-semibold">{choice.label}.</span> {choice.content}
            {choice.isCorrect ? (
              <span className="ml-2 text-xs font-semibold uppercase text-emerald-800">Correct</span>
            ) : null}
            {choice.rationale ? (
              <p className="mt-1 text-sm text-ink-600">Rationale: {choice.rationale}</p>
            ) : null}
          </li>
        ))}
      </ol>

      {question.explanation ? (
        <p className="mt-3 text-sm text-ink-600">
          <span className="font-medium text-ink-800">Explanation. </span>
          {question.explanation}
        </p>
      ) : null}

      <div className="mt-4">
        <FindingList findings={question.rubricFindings} />
      </div>

      {mode === 'review' ? (
        <div className="mt-5 border-t border-ink-100 pt-4">
          {editing ? (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void run(() => api.updateQuestion(question.id, { stem }));
              }}
            >
              <div>
                <label htmlFor={`stem-${question.id}`} className="block text-sm font-medium">
                  Edit stem
                </label>
                <textarea
                  id={`stem-${question.id}`}
                  className="mt-1 w-full rounded-md border border-ink-200 px-3 py-2"
                  rows={3}
                  value={stem}
                  onChange={(event) => setStem(event.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary" disabled={busy}>
                  Save edit
                </button>
                <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div>
                <label htmlFor={`note-${question.id}`} className="block text-sm font-medium">
                  Optional note
                </label>
                <input
                  id={`note-${question.id}`}
                  className="mt-1 w-full rounded-md border border-ink-200 px-3 py-2"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy}
                  onClick={() => void run(() => api.approve(question.id, note))}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() => setEditing(true)}
                >
                  Edit stem
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  disabled={busy}
                  onClick={() => void run(() => api.reject(question.id, note))}
                >
                  Reject
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <button
            type="button"
            className="btn-secondary"
            disabled={busy}
            onClick={() => void run(() => api.reopen(question.id))}
          >
            Return to review
          </button>
        </div>
      )}

      {error ? (
        <p className="mt-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
    </article>
  );
}

function StatusPill({ status }: { status: Question['status'] }) {
  const label = status.replace('_', ' ');
  const classes: Record<Question['status'], string> = {
    draft: 'bg-ink-100 text-ink-800',
    needs_review: 'bg-amber-100 text-amber-950',
    approved: 'bg-emerald-100 text-emerald-950',
    rejected: 'bg-red-100 text-red-950',
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${classes[status]}`}>
      {label}
    </span>
  );
}
