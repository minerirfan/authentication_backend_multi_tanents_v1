import { Request } from 'express';
import { PaginationParams } from '../types/pagination';

export function parsePaginationParams(req: Request): PaginationParams | undefined {
  const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const sortBy = req.query.sortBy as string | undefined;
  const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

  // Only return pagination params if at least one is provided
  if (page !== undefined || limit !== undefined || sortBy !== undefined || sortOrder !== undefined) {
    return {
      page: page || 1,
      limit: limit || 10,
      sortBy,
      sortOrder: sortOrder || 'desc',
    };
  }

  return undefined;
}

