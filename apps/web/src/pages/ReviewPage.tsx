import { useEffect, useState } from 'react';
import { api, type Question } from '../api';
import { QuestionCard } from '../components/QuestionCard';

export function ReviewPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    const page = await api.listQuestions({ status: 'needs_review', pageSize: 50 });
    setQuestions(page.items);
  }

  useEffect(() => {
    void load().catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : 'Could not load the queue.');
    });
  }, []);

  function replace(updated: Question): void {
    setQuestions((current) =>
      updated.status === 'needs_review'
        ? current.map((item) => (item.id === updated.id ? updated : item))
        : current.filter((item) => item.id !== updated.id),
    );
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Review queue</h1>
      <p className="mt-2 max-w-2xl text-ink-600">
        Every generated item lands here, already screened. Approve only what you would put on an
        exam. Edits are measured so we can tell how much work the model actually saved.
      </p>
      {error ? (
        <p className="mt-4 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {questions.length === 0 ? (
        <p className="mt-8 text-ink-600">The queue is empty. Draft questions from a source to fill it.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              mode="review"
              onChanged={replace}
            />
          ))}
        </div>
      )}
    </section>
  );
}
