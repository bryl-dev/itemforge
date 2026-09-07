import type { Transaction } from 'sequelize';
import { ReviewEvent } from '../domain/models/ReviewEvent.js';
import type { ReviewAction } from '../domain/types.js';

export interface CreateReviewEventRecord {
  questionId: string;
  action: ReviewAction;
  actor?: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  stemBefore?: string | null;
  stemAfter?: string | null;
  editDistance?: number | null;
  note?: string | null;
}

export class ReviewEventRepository {
  async create(input: CreateReviewEventRecord, transaction?: Transaction): Promise<ReviewEvent> {
    return ReviewEvent.create(
      {
        questionId: input.questionId,
        action: input.action,
        actor: input.actor ?? 'educator',
        fromStatus: input.fromStatus ?? null,
        toStatus: input.toStatus ?? null,
        stemBefore: input.stemBefore ?? null,
        stemAfter: input.stemAfter ?? null,
        editDistance: input.editDistance ?? null,
        note: input.note ?? null,
      },
      { transaction },
    );
  }

  async listByQuestion(questionId: string): Promise<ReviewEvent[]> {
    return ReviewEvent.findAll({
      where: { questionId },
      order: [['createdAt', 'ASC']],
    });
  }

  async listAll(): Promise<ReviewEvent[]> {
    return ReviewEvent.findAll({ order: [['createdAt', 'ASC']] });
  }
}
