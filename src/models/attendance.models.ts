import { Entity } from './base.model';

export interface ClassMeetingModel extends Entity {
  classKey: string;
  date: string;
  status: 'open' | 'cancelled' | 'concluded';
  teacher: string;
  checkIns?: MeetingCheckInModel[] | undefined,
  latestCheckIn?: string;
  latestCall?: string;
  checkInCount?: number;
}
export interface CheckInComments extends Entity {
  msg: string,
  from: string,
  date: string
}
export interface MeetingCheckInModel extends Entity {
  checkInTime: string;
  status: 'check-in' | 'absent' | 'late' | 'present';
  markedInTime?: string;
  comments?: CheckInComments[];
  validation?: {
    status: 'valid' | 'invalid' | 'unverified';
    reason?: string;
  }
}
