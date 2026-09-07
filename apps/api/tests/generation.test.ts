import request from 'supertest';
import { describe, expect, it } from 'vitest';
import type { AiEngine, EngineGenerateResult } from '../src/clients/AiEngineClient.js';
import { getTestApp, sampleSource } from './helpers.js';

class FakeEngine implements AiEngine {
  async chunk(text: string) {
    return [{ ordinal: 0, content: text }];
  }

  async generate(): Promise<EngineGenerateResult> {
    return {
      items: [
        {
          stem: 'What is a representation invariant of an abstract data type?',
          type: 'multiple_choice',
          difficulty: 'medium',
          bloom_level: 'understand',
          explanation: 'The RI constrains the concrete representation.',
          source_chunk_ordinal: 0,
          choices: [
            { label: 'A', content: 'A condition true of every well-formed instance', is_correct: true, rationale: null },
            { label: 'B', content: 'The public method list of a class', is_correct: false, rationale: 'That is the interface.' },
            { label: 'C', content: 'A mapping from representation to abstract value', is_correct: false, rationale: 'That is the AF.' },
            { label: 'D', content: 'A proof of termination', is_correct: false, rationale: 'Unrelated.' },
          ],
        },
      ],
      provider: 'fake',
      model: 'fake-v1',
      prompt_version: 'test',
      prompt_tokens: 12,
      completion_tokens: 40,
      cost_usd: 0,
      latency_ms: 5,
    };
  }

  async embed(texts: string[]) {
    return texts.map(() => [1, 0, 0, 0]);
  }
}

describe('POST /api/sources/:id/generate', () => {
  it('chunks the source, records a generation run, and stores drafts for review', async () => {
    const { app } = await getTestApp({ engine: new FakeEngine() });
    const source = await request(app).post('/api/sources').send(sampleSource);

    const generated = await request(app)
      .post(`/api/sources/${source.body.id}/generate`)
      .send({ count: 1, type: 'multiple_choice' });

    expect(generated.status).toBe(201);
    expect(generated.body.run.provider).toBe('fake');
    expect(generated.body.run.status).toBe('succeeded');
    expect(generated.body.questions).toHaveLength(1);
    expect(generated.body.questions[0].status).toBe('needs_review');
    expect(generated.body.questions[0].originalStem).toBe(generated.body.questions[0].stem);

    const queued = await request(app).get('/api/questions').query({ status: 'needs_review' });
    expect(queued.body.total).toBe(1);
  });

  it('returns 404 when the source does not exist', async () => {
    const { app } = await getTestApp({ engine: new FakeEngine() });
    const response = await request(app)
      .post('/api/sources/00000000-0000-4000-8000-000000000000/generate')
      .send({ count: 1 });
    expect(response.status).toBe(404);
  });

  it('flags catch-all options on generated drafts', async () => {
    const engine = new FakeEngine();
    engine.generate = async () => ({
      items: [
        {
          stem: 'Which statement about abstract data types is correct in this course?',
          type: 'multiple_choice',
          difficulty: 'easy',
          bloom_level: 'remember',
          explanation: null,
          source_chunk_ordinal: 0,
          choices: [
            { label: 'A', content: 'Clients depend only on the specification', is_correct: true, rationale: null },
            { label: 'B', content: 'Every field should be public', is_correct: false, rationale: null },
            { label: 'C', content: 'Tests must read private state', is_correct: false, rationale: null },
            { label: 'D', content: 'None of the above', is_correct: false, rationale: null },
          ],
        },
      ],
      provider: 'fake',
      model: 'fake-v1',
      prompt_version: 'test',
      prompt_tokens: 1,
      completion_tokens: 1,
      cost_usd: 0,
      latency_ms: 1,
    });
    const { app } = await getTestApp({ engine });
    const source = await request(app).post('/api/sources').send(sampleSource);
    const generated = await request(app)
      .post(`/api/sources/${source.body.id}/generate`)
      .send({ count: 1 });
    const codes = generated.body.questions[0].rubricFindings.map((f: { code: string }) => f.code);
    expect(codes).toContain('catch_all_option');
  });

  it('marks a second identical draft as a near-duplicate', async () => {
    const { app } = await getTestApp({ engine: new FakeEngine() });
    const source = await request(app).post('/api/sources').send(sampleSource);
    await request(app).post(`/api/sources/${source.body.id}/generate`).send({ count: 1 });
    const second = await request(app).post(`/api/sources/${source.body.id}/generate`).send({ count: 1 });
    expect(second.body.questions[0].duplicateOfId).not.toBeNull();
    const codes = second.body.questions[0].rubricFindings.map((f: { code: string }) => f.code);
    expect(codes).toContain('near_duplicate');
  });
});
