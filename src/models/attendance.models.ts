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
export interface MeetingCheckInModel extends Entity {
  checkInTime: string;
  status: 'check-in' | 'absent' | 'late' | 'present';
  markedInTime?: string;
  comments?: CheckInComments[];
}
export interface CheckInComments extends Entity {
  msg: string,
  from: string,
  date: string
}


//Org Models
export interface OrgEventModel extends Entity {
  orgKey: string;
  date: string;
  status: 'open' | 'cancelled' | 'concluded';
  organizer: string;
  confirmations?: MeetingCheckInModel[] | undefined,
  latestConfirmation?: string;
  confirmationCount?: number;
}
