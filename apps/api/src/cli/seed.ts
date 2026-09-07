import { sampleChoices, sampleSource } from '../domain/demo.js';
import { createSequelize } from '../config/database.js';
import { createMigrator } from '../db/migrator.js';
import { initializeModels } from '../domain/models/index.js';
import { QuestionRepository } from '../repositories/QuestionRepository.js';
import { ReviewEventRepository } from '../repositories/ReviewEventRepository.js';
import { SourceRepository } from '../repositories/SourceRepository.js';

/**
 * Seeds a source plus a small reviewed bank so the live demo is explorable
 * without waiting on the AI engine.
 */
async function main(): Promise<void> {
  const sequelize = createSequelize({ logging: false });
  initializeModels(sequelize);
  await createMigrator(sequelize).up();

  const sources = new SourceRepository();
  const questions = new QuestionRepository();
  const events = new ReviewEventRepository();

  const existing = await sources.list();
  if (existing.some((source) => source.title === sampleSource.title)) {
    console.log('Seed already present; skipping.');
    await sequelize.close();
    return;
  }

  const source = await sources.create(sampleSource);

  const approved = await questions.create({
    sourceId: source.id,
    stem: 'What is a representation invariant of an abstract data type?',
    originalStem: 'What is a representation invariant of an ADT?',
    type: 'multiple_choice',
    difficulty: 'medium',
    bloomLevel: 'understand',
    explanation: 'The RI constrains the concrete representation; every public method must preserve it.',
    status: 'approved',
    rubricFindings: [],
    choices: sampleChoices,
  });
  await events.create({
    questionId: approved.id,
    action: 'edited',
    stemBefore: approved.originalStem,
    stemAfter: approved.stem,
    editDistance: 8,
    fromStatus: 'needs_review',
    toStatus: 'needs_review',
  });
  await events.create({
    questionId: approved.id,
    action: 'approved',
    fromStatus: 'needs_review',
    toStatus: 'approved',
    actor: 'seed',
  });

  const rejected = await questions.create({
    sourceId: source.id,
    stem: 'Which of the following best describes photosynthesis in this CPSC 210 excerpt?',
    originalStem: 'Which of the following best describes photosynthesis in this CPSC 210 excerpt?',
    type: 'multiple_choice',
    difficulty: 'easy',
    bloomLevel: 'remember',
    explanation: null,
    status: 'rejected',
    rubricFindings: [
      {
        code: 'verbatim_source',
        severity: 'error',
        message: 'The stem is not grounded in the uploaded source.',
      },
    ],
    choices: sampleChoices,
  });
  await events.create({
    questionId: rejected.id,
    action: 'rejected',
    fromStatus: 'needs_review',
    toStatus: 'rejected',
    actor: 'seed',
    note: 'Off-topic for this source.',
  });

  await questions.create({
    sourceId: source.id,
    stem: 'Why should tests of an ADT be written against the specification rather than the representation?',
    originalStem: 'Why should tests of an ADT be written against the specification rather than the representation?',
    type: 'multiple_choice',
    difficulty: 'medium',
    bloomLevel: 'analyze',
    explanation: 'Specification-based tests remain valid after a representation change.',
    status: 'needs_review',
    rubricFindings: [],
    choices: [
      {
        label: 'A',
        content: 'So the tests remain valid if the representation is rewritten',
        isCorrect: true,
        rationale: null,
        ordinal: 0,
      },
      {
        label: 'B',
        content: 'Because the compiler cannot see private fields',
        isCorrect: false,
        rationale: 'Visibility is a language mechanism, not the methodological reason.',
        ordinal: 1,
      },
      {
        label: 'C',
        content: 'Because specifications are always shorter than implementations',
        isCorrect: false,
        rationale: 'Length is irrelevant; stability under change is the point.',
        ordinal: 2,
      },
      {
        label: 'D',
        content: 'So that code coverage tools report 100%',
        isCorrect: false,
        rationale: 'Coverage is a separate measurement.',
        ordinal: 3,
      },
    ],
  });

  console.log('Seeded CPSC 210 source with one approved, one rejected, and one queued item.');
  await sequelize.close();
}

main().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
