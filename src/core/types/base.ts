/**
 * Base entity interface for all persisted domain objects in Tilo.
 * All records include workspaceId for multi-workspace architectural readiness.
 */
export interface BaseEntity {
  id: string;
  workspaceId: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null; // null/undefined for active, timestamp for soft-deleted/trash
}
