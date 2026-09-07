import type { RubricFinding, RubricResult } from '../../domain/types.js';
import type { EngineItem } from '../../clients/AiEngineClient.js';

export interface Rubric {
  evaluate(item: EngineItem, sourceText: string): RubricResult;
}

/**
 * Placeholder used until the real screening rubric lands. Always passes, so
 * generation can be wired end-to-end without silently dropping drafts.
 */
export class PassthroughRubric implements Rubric {
  evaluate(_item: EngineItem, _sourceText: string): RubricResult {
    const findings: RubricFinding[] = [];
    return { passed: true, findings };
  }
}
