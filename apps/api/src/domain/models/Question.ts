import {
  DataTypes,
  Model,
  type CreationOptional,
  type ForeignKey,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
  type Sequelize,
} from 'sequelize';
import {
  BLOOM_LEVELS,
  DIFFICULTIES,
  QUESTION_STATUSES,
  QUESTION_TYPES,
  type BloomLevel,
  type Difficulty,
  type QuestionStatus,
  type QuestionType,
  type RubricFinding,
} from '../types.js';
import type { Choice } from './Choice.js';
import type { GenerationRun } from './GenerationRun.js';
import type { Source } from './Source.js';

export class Question extends Model<
  InferAttributes<Question>,
  InferCreationAttributes<Question>
> {
  declare id: CreationOptional<string>;
  declare sourceId: ForeignKey<Source['id']> | null;
  declare generationRunId: ForeignKey<GenerationRun['id']> | null;
  declare stem: string;
  declare type: QuestionType;
  declare difficulty: CreationOptional<Difficulty>;
  declare bloomLevel: CreationOptional<BloomLevel>;
  declare explanation: string | null;
  declare status: CreationOptional<QuestionStatus>;

  /**
   * Rubric findings are persisted rather than recomputed on read so the review
   * queue shows the educator exactly what the screen saw at generation time,
   * even after the rubric itself is later tuned.
   */
  declare rubricFindings: CreationOptional<RubricFinding[]>;
  declare embedding: number[] | null;
  declare duplicateOfId: string | null;
  declare duplicateSimilarity: number | null;

  /** Verbatim first draft, preserved so edit distance stays measurable after edits. */
  declare originalStem: CreationOptional<string>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare choices?: NonAttribute<Choice[]>;

  static initialize(sequelize: Sequelize): typeof Question {
    Question.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        sourceId: { type: DataTypes.UUID, allowNull: true },
        generationRunId: { type: DataTypes.UUID, allowNull: true },
        stem: {
          type: DataTypes.TEXT,
          allowNull: false,
          validate: { notEmpty: true },
        },
        type: {
          type: DataTypes.ENUM(...QUESTION_TYPES),
          allowNull: false,
          defaultValue: 'multiple_choice',
        },
        difficulty: {
          type: DataTypes.ENUM(...DIFFICULTIES),
          allowNull: false,
          defaultValue: 'medium',
        },
        bloomLevel: {
          type: DataTypes.ENUM(...BLOOM_LEVELS),
          allowNull: false,
          defaultValue: 'understand',
        },
        explanation: { type: DataTypes.TEXT, allowNull: true },
        status: {
          type: DataTypes.ENUM(...QUESTION_STATUSES),
          allowNull: false,
          defaultValue: 'draft',
        },
        rubricFindings: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: [],
        },
        embedding: { type: DataTypes.JSON, allowNull: true },
        duplicateOfId: { type: DataTypes.UUID, allowNull: true },
        duplicateSimilarity: { type: DataTypes.FLOAT, allowNull: true },
        originalStem: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      },
      {
        sequelize,
        modelName: 'Question',
        tableName: 'questions',
        underscored: true,
        indexes: [{ fields: ['status'] }, { fields: ['source_id'] }],
      },
    );

    return Question;
  }
}
