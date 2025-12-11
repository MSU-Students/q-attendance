import { Entity } from './base.model';

export interface ImportHistoryModel extends Entity {
  filename: string;
  date: string; // ISO string
  classKey: string;
  className?: string;
  totalRecords: number;
  importedCount: number;
  skippedCount: number;
  updatedCount: number;
  userKey?: string; // who performed the import
}
