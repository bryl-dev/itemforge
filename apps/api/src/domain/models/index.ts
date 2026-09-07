import type { Sequelize } from 'sequelize';
import { Choice } from './Choice.js';
import { GenerationRun } from './GenerationRun.js';
import { Question } from './Question.js';
import { ReviewEvent } from './ReviewEvent.js';
import { Source } from './Source.js';
import { SourceChunk } from './SourceChunk.js';

export { Choice, GenerationRun, Question, ReviewEvent, Source, SourceChunk };

export interface Models {
  Source: typeof Source;
  SourceChunk: typeof SourceChunk;
  Question: typeof Question;
  Choice: typeof Choice;
  GenerationRun: typeof GenerationRun;
  ReviewEvent: typeof ReviewEvent;
}

let initializedFor: Sequelize | null = null;

/**
 * Model initialisation is explicit rather than filesystem-magic so the
 * association graph is readable in one place and the order is deterministic.
 * Models are rebound when a new Sequelize instance is supplied (test harness).
 */
export function initializeModels(sequelize: Sequelize): Models {
  if (initializedFor === sequelize) {
    return { Source, SourceChunk, Question, Choice, GenerationRun, ReviewEvent };
  }

  Source.initialize(sequelize);
  SourceChunk.initialize(sequelize);
  GenerationRun.initialize(sequelize);
  Question.initialize(sequelize);
  Choice.initialize(sequelize);
  ReviewEvent.initialize(sequelize);

  if (initializedFor === null) {
    Source.hasMany(SourceChunk, { foreignKey: 'sourceId', as: 'chunks', onDelete: 'CASCADE' });
    SourceChunk.belongsTo(Source, { foreignKey: 'sourceId', as: 'source' });

    Source.hasMany(GenerationRun, { foreignKey: 'sourceId', as: 'runs', onDelete: 'CASCADE' });
    GenerationRun.belongsTo(Source, { foreignKey: 'sourceId', as: 'source' });

    Source.hasMany(Question, { foreignKey: 'sourceId', as: 'questions', onDelete: 'SET NULL' });
    Question.belongsTo(Source, { foreignKey: 'sourceId', as: 'source' });

    GenerationRun.hasMany(Question, {
      foreignKey: 'generationRunId',
      as: 'questions',
      onDelete: 'SET NULL',
    });
    Question.belongsTo(GenerationRun, { foreignKey: 'generationRunId', as: 'generationRun' });

    Question.hasMany(Choice, { foreignKey: 'questionId', as: 'choices', onDelete: 'CASCADE' });
    Choice.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });

    Question.hasMany(ReviewEvent, {
      foreignKey: 'questionId',
      as: 'reviewEvents',
      onDelete: 'CASCADE',
    });
    ReviewEvent.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });

    Question.belongsTo(Question, { foreignKey: 'duplicateOfId', as: 'duplicateOf' });
  }

  initializedFor = sequelize;
  return { Source, SourceChunk, Question, Choice, GenerationRun, ReviewEvent };
}

/** Test helper: lets a fresh in-memory database re-run initialisation. */
export function resetModelRegistry(): void {
  initializedFor = null;
}
