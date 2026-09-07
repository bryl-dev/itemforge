import { DataTypes } from 'sequelize';
import type { MigrationContext } from '../db/migrator.js';
import {
  BLOOM_LEVELS,
  DIFFICULTIES,
  GENERATION_RUN_STATUSES,
  QUESTION_STATUSES,
  QUESTION_TYPES,
  REVIEW_ACTIONS,
  SOURCE_STATUSES,
} from '../domain/types.js';

export async function up({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.createTable('sources', {
    id: { type: DataTypes.UUID, primaryKey: true },
    title: { type: DataTypes.STRING(300), allowNull: false },
    course_code: { type: DataTypes.STRING(32), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM(...SOURCE_STATUSES), allowNull: false, defaultValue: 'pending' },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('source_chunks', {
    id: { type: DataTypes.UUID, primaryKey: true },
    source_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'sources', key: 'id' },
      onDelete: 'CASCADE',
    },
    ordinal: { type: DataTypes.INTEGER, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    embedding: { type: DataTypes.JSON, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('source_chunks', ['source_id', 'ordinal'], {
    unique: true,
    name: 'source_chunks_source_id_ordinal',
  });

  await queryInterface.createTable('generation_runs', {
    id: { type: DataTypes.UUID, primaryKey: true },
    source_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'sources', key: 'id' },
      onDelete: 'CASCADE',
    },
    provider: { type: DataTypes.STRING(32), allowNull: false },
    model: { type: DataTypes.STRING(120), allowNull: false },
    prompt_version: { type: DataTypes.STRING(32), allowNull: false },
    requested_count: { type: DataTypes.INTEGER, allowNull: false },
    generated_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    accepted_by_rubric_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    prompt_tokens: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    completion_tokens: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    cost_usd: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    latency_ms: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM(...GENERATION_RUN_STATUSES),
      allowNull: false,
      defaultValue: 'running',
    },
    error: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.createTable('questions', {
    id: { type: DataTypes.UUID, primaryKey: true },
    source_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'sources', key: 'id' },
      onDelete: 'SET NULL',
    },
    generation_run_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'generation_runs', key: 'id' },
      onDelete: 'SET NULL',
    },
    stem: { type: DataTypes.TEXT, allowNull: false },
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
    bloom_level: {
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
    rubric_findings: { type: DataTypes.JSON, allowNull: false },
    embedding: { type: DataTypes.JSON, allowNull: true },
    duplicate_of_id: { type: DataTypes.UUID, allowNull: true },
    duplicate_similarity: { type: DataTypes.FLOAT, allowNull: true },
    original_stem: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('questions', ['status'], { name: 'questions_status' });
  await queryInterface.addIndex('questions', ['source_id'], { name: 'questions_source_id' });

  await queryInterface.createTable('choices', {
    id: { type: DataTypes.UUID, primaryKey: true },
    question_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'questions', key: 'id' },
      onDelete: 'CASCADE',
    },
    label: { type: DataTypes.STRING(8), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    is_correct: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    rationale: { type: DataTypes.TEXT, allowNull: true },
    ordinal: { type: DataTypes.INTEGER, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('choices', ['question_id'], { name: 'choices_question_id' });

  await queryInterface.createTable('review_events', {
    id: { type: DataTypes.UUID, primaryKey: true },
    question_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'questions', key: 'id' },
      onDelete: 'CASCADE',
    },
    action: { type: DataTypes.ENUM(...REVIEW_ACTIONS), allowNull: false },
    actor: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'educator' },
    from_status: { type: DataTypes.STRING(32), allowNull: true },
    to_status: { type: DataTypes.STRING(32), allowNull: true },
    stem_before: { type: DataTypes.TEXT, allowNull: true },
    stem_after: { type: DataTypes.TEXT, allowNull: true },
    edit_distance: { type: DataTypes.INTEGER, allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('review_events', ['question_id'], {
    name: 'review_events_question_id',
  });
  await queryInterface.addIndex('review_events', ['action'], { name: 'review_events_action' });
}

export async function down({ queryInterface }: MigrationContext): Promise<void> {
  await queryInterface.dropTable('review_events');
  await queryInterface.dropTable('choices');
  await queryInterface.dropTable('questions');
  await queryInterface.dropTable('generation_runs');
  await queryInterface.dropTable('source_chunks');
  await queryInterface.dropTable('sources');
}
