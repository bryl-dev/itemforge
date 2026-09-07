import {
  DataTypes,
  Model,
  type CreationOptional,
  type ForeignKey,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';
import { REVIEW_ACTIONS, type ReviewAction } from '../types.js';
import type { Question } from './Question.js';

/**
 * The audit trail, and the single source of every metric the platform reports.
 *
 * This table is append-only by convention: a question's history is the ordered
 * list of its events, never mutated in place. `editDistance` is computed once,
 * at write time, because recomputing it later would require the prior snapshot
 * to still be reachable.
 */
export class ReviewEvent extends Model<
  InferAttributes<ReviewEvent>,
  InferCreationAttributes<ReviewEvent>
> {
  declare id: CreationOptional<string>;
  declare questionId: ForeignKey<Question['id']>;
  declare action: ReviewAction;
  declare actor: CreationOptional<string>;
  declare fromStatus: string | null;
  declare toStatus: string | null;
  declare stemBefore: string | null;
  declare stemAfter: string | null;
  /** Levenshtein distance between stemBefore and stemAfter; null for non-edits. */
  declare editDistance: number | null;
  declare note: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initialize(sequelize: Sequelize): typeof ReviewEvent {
    ReviewEvent.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        questionId: { type: DataTypes.UUID, allowNull: false },
        action: { type: DataTypes.ENUM(...REVIEW_ACTIONS), allowNull: false },
        actor: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'educator' },
        fromStatus: { type: DataTypes.STRING(32), allowNull: true },
        toStatus: { type: DataTypes.STRING(32), allowNull: true },
        stemBefore: { type: DataTypes.TEXT, allowNull: true },
        stemAfter: { type: DataTypes.TEXT, allowNull: true },
        editDistance: { type: DataTypes.INTEGER, allowNull: true },
        note: { type: DataTypes.TEXT, allowNull: true },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      },
      {
        sequelize,
        modelName: 'ReviewEvent',
        tableName: 'review_events',
        underscored: true,
        indexes: [{ fields: ['question_id'] }, { fields: ['action'] }],
      },
    );

    return ReviewEvent;
  }
}
