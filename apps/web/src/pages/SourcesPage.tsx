import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError, type Source } from '../api';

export function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [title, setTitle] = useState('CPSC 210 — Abstraction and Specification');
  const [courseCode, setCourseCode] = useState('CPSC 210');
  const [content, setContent] = useState(DEFAULT_SOURCE);
  const [busy, setBusy] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh(): Promise<void> {
    const result = await api.listSources();
    setSources(result.items);
  }

  useEffect(() => {
    void refresh().catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : 'Could not load sources.');
    });
  }, []);

  async function onCreate(event: FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api.createSource({ title, courseCode, content });
      setMessage('Source saved. You can now draft questions from it.');
      await refresh();
    } catch (caught) {
      setError(describe(caught));
    } finally {
      setBusy(false);
    }
  }

  async function onGenerate(id: string): Promise<void> {
    setGeneratingId(id);
    setError(null);
    setMessage('Drafting items and running the screening rubric…');
    try {
      const result = await api.generate(id, 6);
      setMessage(
        `Generated ${result.questions.length} drafts (${result.run.acceptedByRubricCount} passed the rubric). Open the review queue to decide what enters the bank.`,
      );
    } catch (caught) {
      setError(describe(caught));
      setMessage(null);
    } finally {
      setGeneratingId(null);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section>
        <h1 className="text-2xl font-semibold">Sources</h1>
        <p className="mt-2 max-w-2xl text-ink-600">
          Upload the material you want questions written from. Generation is a request to the AI
          engine; screening and the review queue are what decide whether a draft becomes an exam
          item.
        </p>

        <form className="mt-6 space-y-4 rounded-xl border border-ink-200 bg-white p-5" onSubmit={onCreate}>
          <div>
            <label htmlFor="title" className="block text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              className="field"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="course" className="block text-sm font-medium">
              Course code
            </label>
            <input
              id="course"
              className="field"
              value={courseCode}
              onChange={(event) => setCourseCode(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium">
              Source text
            </label>
            <textarea
              id="content"
              className="field min-h-48 font-mono text-sm"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={busy}>
            Save source
          </button>
        </form>
      </section>

      <aside>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">Library</h2>
        {sources.length === 0 ? (
          <p className="mt-3 text-sm text-ink-600">No sources yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {sources.map((source) => (
              <li key={source.id} className="rounded-xl border border-ink-200 bg-white p-4">
                <p className="font-medium">{source.title}</p>
                <p className="text-sm text-ink-600">{source.courseCode ?? 'No course code'}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-ink-400">{source.status}</p>
                <button
                  type="button"
                  className="btn-primary mt-3 w-full"
                  disabled={generatingId === source.id}
                  onClick={() => void onGenerate(source.id)}
                >
                  {generatingId === source.id ? 'Drafting…' : 'Draft questions'}
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm">
          <Link className="underline" to="/review">
            Go to the review queue
          </Link>
        </p>
      </aside>

      <div className="lg:col-span-2" aria-live="polite">
        {message ? <p className="text-sm text-ink-800">{message}</p> : null}
        {error ? (
          <p className="text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function describe(error: unknown): string {
  if (error instanceof ApiError && error.status === 502) {
    return 'The AI engine is not reachable. Start it with `uvicorn` from services/ai, then try again.';
  }
  return error instanceof Error ? error.message : 'Something went wrong.';
}

const DEFAULT_SOURCE = `An abstract data type (ADT) hides representation so clients depend only on a specification.
A representation invariant (RI) is a condition that is true of every well-formed instance of the representation.
An abstraction function (AF) maps a concrete representation to the abstract value it stands for.
Every public method of an ADT is obliged to preserve the representation invariant. If a method leaves the representation in a state the RI forbids, the implementation has a bug.
Tests of an ADT should be written against the specification, not the representation. Specification-based tests remain valid after a rewrite; representation-based tests do not.
Encapsulation means clients never depend on hidden fields. Two different representations can implement the same abstract data type, which is the point of separating specification from representation.`;
