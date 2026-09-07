import { HttpAiEngineClient, type AiEngine } from './clients/AiEngineClient.js';
import type { Database } from './db/index.js';
import { GenerationRunRepository } from './repositories/GenerationRunRepository.js';
import { QuestionRepository } from './repositories/QuestionRepository.js';
import { ReviewEventRepository } from './repositories/ReviewEventRepository.js';
import { SourceChunkRepository, SourceRepository } from './repositories/SourceRepository.js';
import { GenerationService } from './services/GenerationService.js';
import { MetricsService } from './services/MetricsService.js';
import { QuestionService } from './services/QuestionService.js';
import { ScreeningRubric } from './services/rubric/ScreeningRubric.js';
import type { Rubric } from './services/rubric/Rubric.js';
import { EmbeddingSimilarityIndex } from './services/similarity/EmbeddingSimilarityIndex.js';
import type { SimilarityIndex } from './services/similarity/SimilarityIndex.js';
import { SourceService } from './services/SourceService.js';

export interface AppContext {
  db: Database;
  sources: SourceService;
  questions: QuestionService;
  generation: GenerationService;
  metrics: MetricsService;
  sourceRepo: SourceRepository;
  chunkRepo: SourceChunkRepository;
  questionRepo: QuestionRepository;
  runRepo: GenerationRunRepository;
  eventRepo: ReviewEventRepository;
}

export interface ContextOverrides {
  engine?: AiEngine;
  rubric?: Rubric;
  similarity?: SimilarityIndex;
}

/**
 * Composition root. Routes depend on this object, never on Sequelize directly,
 * so tests can substitute fakes without spinning up HTTP.
 */
export function createContext(db: Database, overrides: ContextOverrides = {}): AppContext {
  const sourceRepo = new SourceRepository();
  const chunkRepo = new SourceChunkRepository();
  const questionRepo = new QuestionRepository();
  const runRepo = new GenerationRunRepository();
  const eventRepo = new ReviewEventRepository();
  const engine = overrides.engine ?? new HttpAiEngineClient();
  const rubric = overrides.rubric ?? new ScreeningRubric();
  const similarity = overrides.similarity ?? new EmbeddingSimilarityIndex(questionRepo);

  return {
    db,
    sourceRepo,
    chunkRepo,
    questionRepo,
    runRepo,
    eventRepo,
    sources: new SourceService(sourceRepo),
    questions: new QuestionService(questionRepo, eventRepo),
    generation: new GenerationService(
      sourceRepo,
      chunkRepo,
      runRepo,
      questionRepo,
      engine,
      rubric,
      similarity,
    ),
    metrics: new MetricsService(),
  };
}
