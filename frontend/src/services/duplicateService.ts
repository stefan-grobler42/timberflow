import { api } from './api';
import type {
  DuplicateDetectionRequest,
  DuplicateDetectionResponse,
  DuplicateMergeRequest,
  DuplicateMergeResponse,
} from '../types/duplicates';

export const duplicateService = {
  findDuplicates: (request: DuplicateDetectionRequest) =>
    api.post<DuplicateDetectionResponse>('/duplicates/find', request),

  mergeDuplicates: (request: DuplicateMergeRequest) =>
    api.post<DuplicateMergeResponse>('/duplicates/merge', request),
};
