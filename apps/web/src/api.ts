export type QuestionStatus = 'draft' | 'needs_review' | 'approved' | 'rejected';

export interface RubricFinding {
  code: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface Choice {
  id: string;
  label: string;
  content: string;
  isCorrect: boolean;
  rationale: string | null;
  ordinal: number;
}

export interface Source {
  id: string;
  title: string;
  courseCode: string | null;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  sourceId: string | null;
  generationRunId: string | null;
  stem: string;
  originalStem: string;
  type: string;
  difficulty: string;
  bloomLevel: string;
  explanation: string | null;
  status: QuestionStatus;
  rubricFindings: RubricFinding[];
  duplicateOfId: string | null;
  duplicateSimilarity: number | null;
  choices: Choice[];
  createdAt: string;
  updatedAt: string;
}

export interface GenerationRun {
  id: string;
  sourceId: string;
  provider: string;
  model: string;
  promptVersion: string;
  requestedCount: number;
  generatedCount: number;
  acceptedByRubricCount: number;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  latencyMs: number;
  status: string;
  error: string | null;
  createdAt: string;
}

export interface QuestionPage {
  items: Question[];
  page: number;
  pageSize: number;
  total: number;
}

export interface Metrics {
  questionsTotal: number;
  reviewedTotal: number;
  acceptedTotal: number;
  rejectedTotal: number;
  acceptanceRate: number | null;
  medianEditDistance: number | null;
  duplicateRate: number | null;
  costPerAcceptedUsd: number | null;
  rubricErrorRate: number | null;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (response.status === 204) {
    return undefined as T;
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.error?.code ?? 'unknown',
      body?.error?.message ?? `Request failed (${response.status})`,
    );
  }
  return body as T;
}

export const api = {
  listSources: () => request<{ items: Source[] }>('/api/sources'),
  createSource: (input: { title: string; courseCode?: string; content: string }) =>
    request<Source>('/api/sources', { method: 'POST', body: JSON.stringify(input) }),
  getSource: (id: string) => request<Source>(`/api/sources/${id}`),
  generate: (sourceId: string, count = 6) =>
    request<{ run: GenerationRun; questions: Question[] }>(`/api/sources/${sourceId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ count, type: 'multiple_choice' }),
    }),
  listQuestions: (query: { status?: QuestionStatus; sourceId?: string; page?: number; pageSize?: number } = {}) => {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    if (query.sourceId) params.set('sourceId', query.sourceId);
    if (query.page) params.set('page', String(query.page));
    if (query.pageSize) params.set('pageSize', String(query.pageSize));
    const suffix = params.toString() ? `?${params}` : '';
    return request<QuestionPage>(`/api/questions${suffix}`);
  },
  getQuestion: (id: string) => request<Question>(`/api/questions/${id}`),
  updateQuestion: (id: string, input: { stem?: string; explanation?: string | null; choices?: Choice[] }) =>
    request<Question>(`/api/questions/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  approve: (id: string, note?: string) =>
    request<Question>(`/api/questions/${id}/approve`, { method: 'POST', body: JSON.stringify({ note }) }),
  reject: (id: string, note?: string) =>
    request<Question>(`/api/questions/${id}/reject`, { method: 'POST', body: JSON.stringify({ note }) }),
  reopen: (id: string) => request<Question>(`/api/questions/${id}/reopen`, { method: 'POST', body: '{}' }),
  metrics: () => request<Metrics>('/api/metrics'),
  exportGift: async (sourceId?: string): Promise<string> => {
    const params = sourceId ? `?sourceId=${sourceId}` : '';
    const response = await fetch(`/api/export/gift${params}`);
    if (!response.ok) {
      throw new ApiError(response.status, 'export_failed', 'GIFT export failed.');
    }
    return response.text();
  },
};
