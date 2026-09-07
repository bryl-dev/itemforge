import {
  DataTypes,
  Model,
  type CreationOptional,
  type ForeignKey,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';
import type { Question } from './Question.js';

export class Choice extends Model<InferAttributes<Choice>, InferCreationAttributes<Choice>> {
  declare id: CreationOptional<string>;
  declare questionId: ForeignKey<Question['id']>;
  declare label: string;
  declare content: string;
  declare isCorrect: boolean;
  /** Why this distractor is wrong. Useful for feedback, and a quality signal in review. */
  declare rationale: string | null;
  declare ordinal: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initialize(sequelize: Sequelize): typeof Choice {
    Choice.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        questionId: { type: DataTypes.UUID, allowNull: false },
        label: { type: DataTypes.STRING(8), allowNull: false },
        content: { type: DataTypes.TEXT, allowNull: false },
        isCorrect: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        rationale: { type: DataTypes.TEXT, allowNull: true },
        ordinal: { type: DataTypes.INTEGER, allowNull: false },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      },
      {
        sequelize,
        modelName: 'Choice',
        tableName: 'choices',
        underscored: true,
        indexes: [{ fields: ['question_id'] }],
      },
    );

    return Choice;
  }
}
