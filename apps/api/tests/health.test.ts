import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { getTestApp } from './helpers.js';

describe('GET /api/health', () => {
  it('reports the database as healthy even when the AI engine is down', async () => {
    const { app } = await getTestApp();
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.dependencies.database.status).toBe('ok');
    expect(response.body.dialect).toBe('sqlite');
    expect(['ok', 'degraded']).toContain(response.body.status);
  });
});
