import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { getTestApp, sampleChoices, sampleSource } from './helpers.js';

describe('sources and questions', () => {
  it('creates a source and lists it', async () => {
    const { app } = await getTestApp();

    const created = await request(app).post('/api/sources').send(sampleSource);
    expect(created.status).toBe(201);
    expect(created.body.title).toBe(sampleSource.title);
    expect(created.body.status).toBe('pending');

    const listed = await request(app).get('/api/sources');
    expect(listed.body.items).toHaveLength(1);
    expect(listed.body.items[0].id).toBe(created.body.id);
  });

  it('rejects source content that is too short', async () => {
    const { app } = await getTestApp();
    const response = await request(app).post('/api/sources').send({
      title: 'Too short',
      content: 'tiny',
    });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('validation_failed');
  });

  it('creates a question, records an edit, and accepts it into the bank', async () => {
    const { app } = await getTestApp();

    const source = await request(app).post('/api/sources').send(sampleSource);
    const created = await request(app)
      .post('/api/questions')
      .send({
        sourceId: source.body.id,
        stem: 'What is a representation invariant?',
        choices: sampleChoices,
      });

    expect(created.status).toBe(201);
    expect(created.body.status).toBe('draft');
    expect(created.body.choices).toHaveLength(4);

    const edited = await request(app)
      .patch(`/api/questions/${created.body.id}`)
      .send({ stem: 'In the ADT methodology, what is a representation invariant?' });
    expect(edited.status).toBe(200);

    const history = await request(app).get(`/api/questions/${created.body.id}/events`);
    expect(history.body.items).toHaveLength(1);
    expect(history.body.items[0].action).toBe('edited');
    expect(history.body.items[0].editDistance).toBeGreaterThan(0);

    const approved = await request(app)
      .post(`/api/questions/${created.body.id}/approve`)
      .send({ actor: 'test-educator' });
    expect(approved.status).toBe(200);
    expect(approved.body.status).toBe('approved');

    const bank = await request(app).get('/api/questions').query({ status: 'approved' });
    expect(bank.body.total).toBe(1);
  });

  it('refuses to approve a question that is already rejected', async () => {
    const { app } = await getTestApp();
    const created = await request(app).post('/api/questions').send({
      stem: 'Which of the following is an ADT?',
      choices: sampleChoices,
    });
    await request(app).post(`/api/questions/${created.body.id}/reject`).send();

    const second = await request(app).post(`/api/questions/${created.body.id}/approve`).send();
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('conflict');
  });

  it('returns 404 for an unknown question', async () => {
    const { app } = await getTestApp();
    const response = await request(app).get('/api/questions/00000000-0000-4000-8000-000000000000');
    expect(response.status).toBe(404);
  });
});
