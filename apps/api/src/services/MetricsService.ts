import { Question } from '../domain/models/Question.js';
import { GenerationRun } from '../domain/models/GenerationRun.js';
import { ReviewEvent } from '../domain/models/ReviewEvent.js';
import type { Metrics } from '../domain/dto.js';

/**
 * All figures are derived from persisted review events and question rows.
 * Nothing here is reported by the model; if the log is empty, the rates are
 * null rather than zero, so a blank slate is distinguishable from "the AI
 * helped 0% of the time".
 */
export class MetricsService {
  async collect(): Promise<Metrics> {
    const questions = await Question.findAll();
    const events = await ReviewEvent.findAll();
    const runs = await GenerationRun.findAll();

    const questionsTotal = questions.length;
    const acceptedTotal = questions.filter((q) => q.status === 'approved').length;
    const rejectedTotal = questions.filter((q) => q.status === 'rejected').length;
    const reviewedTotal = questions.filter(
      (q) => q.status === 'approved' || q.status === 'rejected',
    ).length;

    const acceptanceRate =
      reviewedTotal === 0 ? null : acceptedTotal / reviewedTotal;

    const distances = events
      .map((event) => event.editDistance)
      .filter((value): value is number => value !== null)
      .sort((a, b) => a - b);
    const medianEditDistance = median(distances);

    const flagged = questions.filter((q) => q.duplicateOfId !== null).length;
    const duplicateRate = questionsTotal === 0 ? null : flagged / questionsTotal;

    const accepted = acceptedTotal;
    const totalCost = runs.reduce((sum, run) => sum + (run.costUsd ?? 0), 0);
    const costPerAcceptedUsd = accepted === 0 ? null : totalCost / accepted;

    const withError = questions.filter((q) =>
      (q.rubricFindings ?? []).some((finding) => finding.severity === 'error'),
    ).length;
    const generated = questions.filter((q) => q.generationRunId !== null).length;
    const rubricErrorRate = generated === 0 ? null : withError / generated;

    return {
      questionsTotal,
      reviewedTotal,
      acceptedTotal,
      rejectedTotal,
      acceptanceRate,
      medianEditDistance,
      duplicateRate,
      costPerAcceptedUsd,
      rubricErrorRate,
    };
  }
}

function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const mid = Math.floor(values.length / 2);
  if (values.length % 2 === 1) {
    return values[mid] as number;
  }
  return ((values[mid - 1] as number) + (values[mid] as number)) / 2;
}
