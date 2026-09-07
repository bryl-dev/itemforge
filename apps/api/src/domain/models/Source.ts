import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';
import { SOURCE_STATUSES, type SourceStatus } from '../types.js';

export class Source extends Model<InferAttributes<Source>, InferCreationAttributes<Source>> {
  declare id: CreationOptional<string>;
  declare title: string;
  declare courseCode: string | null;
  declare content: string;
  declare status: CreationOptional<SourceStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initialize(sequelize: Sequelize): typeof Source {
    Source.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        title: {
          type: DataTypes.STRING(300),
          allowNull: false,
          validate: { notEmpty: true },
        },
        courseCode: {
          type: DataTypes.STRING(32),
          allowNull: true,
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM(...SOURCE_STATUSES),
          allowNull: false,
          defaultValue: 'pending',
        },
        createdAt: DataTypes.DATE,
        updatedAt: DataTypes.DATE,
      },
      {
        sequelize,
        modelName: 'Source',
        tableName: 'sources',
        underscored: true,
      },
    );

    return Source;
  }
}
