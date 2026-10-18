import { type JoinPathResult } from '@domain/entities';

export interface PathFinderPort {
  loadGraph(): void;
  findOptimalPath(
    sourceTable: string,
    targetTable: string,
  ): JoinPathResult | null;
}
