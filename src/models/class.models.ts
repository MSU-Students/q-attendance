import { Entity } from './base.model';
import type { StudentUserModel, UserModel } from './user.models';
export interface StudentEnrollment extends StudentUserModel {
  /**
   * perfect : no absences
   * good: with minimal absences or lates
   * warning: absent last meeting or reached 3 absences (non-consecutive)
   * critical: 2 consecutive or 4 non-consecutive absences
   * drop:  3 consecutive or 5 non-consecutive absences
   */
  reportStatus?: 'perfect' | 'good' | 'warning' | 'critical' | 'drop' | undefined;
  totalAbsences?: number | undefined;
  consecutiveAbsences?: number | undefined;
  totalTardiness?: number | undefined;
}
export interface ClassModel extends Entity {
  name: string;
  description?: string;
  schedule?: string;
  room?: string;
  classCode: string;
  teachers?: UserModel[] | undefined;
  section: string;
  academicYear: string;
  enrolled?: StudentEnrollment[] | undefined;
}



