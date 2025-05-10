import { Entity } from './base.model';

export interface UserModel extends Entity {
  fullName: string;
  email: string;
  emailVerified?: boolean;
  avatar?: string;
  status?: 'active' | 'inactive' | 'pending';
  role?: 'teacher' | 'admin' | 'supervisor' | 'student' | undefined
}
