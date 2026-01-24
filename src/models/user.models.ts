import { Entity } from './base.model';

export interface UserModel extends Entity {
  ownerKey: string;
  fullName: string;
  email: string;
  emailVerified?: boolean;
  avatar?: string;
  dateRegistered?: string;
  status?: 'active' | 'inactive' | 'pending';
  role?: 'teacher' | 'admin' | 'supervisor' | 'student' | undefined
}
