import {
  DataTypes,
  Model,
  type CreationOptional,
  type ForeignKey,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';
import { GENERATION_RUN_STATUSES, type GenerationRunStatus } from '../types.js';
import type { Source } from './Source.js';

/**
 * Provenance. Every generated question points back to the run that produced it,
 * so "which model wrote this, under which prompt, at what cost" is answerable
 * for any item in the bank rather than being lost once the response is parsed.
 */
export class GenerationRun extends Model<
  InferAttributes<GenerationRun>,
  InferCreationAttributes<GenerationRun>
> {
  declare id: CreationOptional<string>;
  declare sourceId: ForeignKey<Source['id']>;
  declare provider: string;
  declare model: string;
  declare promptVersion: string;
  declare requestedCount: number;
  declare generatedCount: CreationOptional<number>;
  declare acceptedByRubricCount: CreationOptional<number>;
  declare promptTokens: CreationOptional<number>;
  declare completionTokens: CreationOptional<number>;
  declare costUsd: CreationOptional<number>;
  declare latencyMs: CreationOptional<number>;
  declare status: CreationOptional<GenerationRunStatus>;
  declare error: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initialize(sequelize: Sequelize): typeof GenerationRun {
    GenerationRun.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        sourceId: { type: DataTypes.UUID, allowNull: false },
        provider: { type: DataTypes.STRING(32), allowNull: false },
        model: { type: DataTypes.STRING(120), allowNull: false },
        promptVersion: { type: DataTypes.STRING(32), allowNull: false },
        requestedCount: { type: DataTypes.INTEGER, allowNull: false },
        generatedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        acceptedByRubricCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        promptTokens: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        completionTokens: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        costUsd: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
        latencyMs: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        status: {
          type: DataTypes.ENUM(...GENERATION_RUN_STATUSES),
          allowNull: false,
          defaultValue: 'running',
        },
        error: { type: DataTypes.TEXT, allowNull: true },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      },
      {
        sequelize,
        modelName: 'GenerationRun',
        tableName: 'generation_runs',
        underscored: true,
      },
    );

    return GenerationRun;
  }
}
