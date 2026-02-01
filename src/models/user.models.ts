import { Entity } from './base.model';

interface UserBaseModel extends Entity {
  ownerKey: string;
  fullName: string;
  email: string;
  emailVerified?: boolean;
  avatar?: string;
  dateRegistered?: string;
  status?: 'active' | 'inactive' | 'pending';
};

export interface TeacherUserModel extends UserBaseModel {
  role: 'teacher';
}
export interface AdminUserModel extends UserBaseModel {
  role: 'admin';
}
export interface SupervisorUserModel extends UserBaseModel {
  role: 'supervisor'
}
export interface StudentUserModel extends UserBaseModel {
  role: 'student';
  course?: string;
  contact?: string;
  studentId?: string;
}
export type UserModel = TeacherUserModel | AdminUserModel | SupervisorUserModel | StudentUserModel;

