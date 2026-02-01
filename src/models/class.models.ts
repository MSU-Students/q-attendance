import { Entity } from './base.model';
import type { UserModel } from './user.models';

export interface ClassModel extends Entity {
  name: string;
  description?: string;
  schedule?: string;
  room?: string;
  classCode: string;
  teachers?: UserModel[] | undefined;
  section: string;
  academicYear: string;
  enrolled?: UserModel[] | undefined;
}



