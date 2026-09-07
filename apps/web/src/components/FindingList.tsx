import type { RubricFinding } from '../api';

export function FindingList({ findings }: { findings: RubricFinding[] }) {
  if (findings.length === 0) {
    return (
      <p className="text-sm text-ink-600">
        Screened: no issues. This draft still needs a human decision before it enters the bank.
      </p>
    );
  }

  return (
    <ul className="space-y-2" aria-label="Screening findings">
      {findings.map((finding) => (
        <li
          key={`${finding.code}-${finding.message}`}
          className={
            finding.severity === 'error'
              ? 'rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-950'
              : 'rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950'
          }
        >
          <span className="font-semibold uppercase tracking-wide">
            {finding.severity === 'error' ? 'Error' : 'Warning'}
          </span>
          <span className="mx-2 text-ink-400" aria-hidden="true">
            ·
          </span>
          <span className="font-mono text-xs">{finding.code}</span>
          <p className="mt-1">{finding.message}</p>
        </li>
      ))}
    </ul>
  );
}
