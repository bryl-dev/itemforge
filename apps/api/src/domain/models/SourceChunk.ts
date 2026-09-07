import {
  DataTypes,
  Model,
  type CreationOptional,
  type ForeignKey,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';
import type { Source } from './Source.js';

export class SourceChunk extends Model<
  InferAttributes<SourceChunk>,
  InferCreationAttributes<SourceChunk>
> {
  declare id: CreationOptional<string>;
  declare sourceId: ForeignKey<Source['id']>;
  declare ordinal: number;
  declare content: string;
  /**
   * Stored as JSON rather than a dialect-specific vector type so the schema is
   * portable. On Postgres a parallel `vector` column is maintained for indexed
   * search; see PgVectorSimilarityRepository.
   */
  declare embedding: number[] | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initialize(sequelize: Sequelize): typeof SourceChunk {
    SourceChunk.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        sourceId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        ordinal: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        embedding: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      },
      {
        sequelize,
        modelName: 'SourceChunk',
        tableName: 'source_chunks',
        underscored: true,
        indexes: [{ fields: ['source_id', 'ordinal'], unique: true }],
      },
    );

    return SourceChunk;
  }
}
