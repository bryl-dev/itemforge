import { useEffect, useState } from 'react';
import { api, type Metrics } from '../api';

export function MetricsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api
      .metrics()
      .then(setMetrics)
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : 'Could not load metrics.');
      });
  }, []);

  return (
    <section>
      <h1 className="text-2xl font-semibold">Human–AI metrics</h1>
      <p className="mt-2 max-w-2xl text-ink-600">
        These numbers are derived from the review log, not from model self-report. They answer
        whether the generator is actually saving an educator time.
      </p>
      {error ? (
        <p className="mt-4 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {!metrics && !error ? <p className="mt-8 text-ink-600">Loading metrics…</p> : null}
      {metrics ? (
        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Items in play" value={String(metrics.questionsTotal)} />
          <Stat label="Reviewed" value={String(metrics.reviewedTotal)} />
          <Stat
            label="Acceptance rate"
            value={pct(metrics.acceptanceRate)}
            hint="Approved divided by reviewed"
          />
          <Stat
            label="Median edit distance"
            value={metrics.medianEditDistance === null ? '—' : String(metrics.medianEditDistance)}
            hint="Levenshtein distance on stems the educator changed"
          />
          <Stat
            label="Duplicate rate"
            value={pct(metrics.duplicateRate)}
            hint="Drafts flagged as near-duplicates"
          />
          <Stat
            label="Cost per accepted item"
            value={
              metrics.costPerAcceptedUsd === null
                ? '—'
                : `$${metrics.costPerAcceptedUsd.toFixed(4)}`
            }
          />
          <Stat
            label="Rubric error rate"
            value={pct(metrics.rubricErrorRate)}
            hint="Drafts that arrived with a screening error"
          />
        </dl>
      ) : null}
    </section>
  );
}

function pct(value: number | null): string {
  return value === null ? '—' : `${Math.round(value * 100)}%`;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-5">
      <dt className="text-sm text-ink-600">{label}</dt>
      <dd className="mt-2 text-3xl font-semibold tracking-tight">{value}</dd>
      {hint ? <p className="mt-2 text-xs text-ink-400">{hint}</p> : null}
    </div>
  );
}
