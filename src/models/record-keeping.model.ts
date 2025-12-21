import { Entity } from './base.model';



export interface RecordKeepingModel extends Entity {
  teaching: string[];
  archivedTeaching: string[];
  enrolled: string[];
  archivedEnrolled: string[];
  memberships: string[];
  archivedMemberships: string[];
}
