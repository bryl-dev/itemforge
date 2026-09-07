import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { getTestApp, sampleChoices, sampleSource } from './helpers.js';

describe('metrics and GIFT export', () => {
  it('reports null rates on an empty bank, not zeros', async () => {
    const { app } = await getTestApp();
    const response = await request(app).get('/api/metrics');
    expect(response.status).toBe(200);
    expect(response.body.questionsTotal).toBe(0);
    expect(response.body.acceptanceRate).toBeNull();
    expect(response.body.medianEditDistance).toBeNull();
  });

  it('computes acceptance rate from review outcomes and exports approved items as GIFT', async () => {
    const { app } = await getTestApp();
    await request(app).post('/api/sources').send(sampleSource);

    const keep = await request(app).post('/api/questions').send({
      stem: 'What is a representation invariant of an abstract data type?',
      choices: sampleChoices,
    });
    const drop = await request(app).post('/api/questions').send({
      stem: 'Which of the following is an unrelated trivia question about sports?',
      choices: sampleChoices,
    });

    await request(app).post(`/api/questions/${keep.body.id}/approve`).send();
    await request(app).post(`/api/questions/${drop.body.id}/reject`).send();

    const metrics = await request(app).get('/api/metrics');
    expect(metrics.body.acceptedTotal).toBe(1);
    expect(metrics.body.rejectedTotal).toBe(1);
    expect(metrics.body.acceptanceRate).toBe(0.5);

    const gift = await request(app).get('/api/export/gift');
    expect(gift.status).toBe(200);
    expect(gift.headers['content-type']).toMatch(/text\/plain/);
    expect(gift.text).toContain('representation invariant');
    expect(gift.text).not.toContain('sports');
  });
});
