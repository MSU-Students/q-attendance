import {
  ClassMeetingModel,
  ClassModel,
  MeetingCheckInModel, OrgEventModel, OrgModel, RecordKeepingModel, UserModel
} from 'src/models';

export type CollectionTypes = {
  users: UserModel;
  classes: ClassModel;
  'teachers': UserModel;
  'enrolled': UserModel;
  meetings: ClassMeetingModel;
  'check-ins': MeetingCheckInModel,
  'class-keepings': RecordKeepingModel,
  'organizations': OrgModel,
  'officers': UserModel,
  'members': UserModel,
  'org-events': OrgEventModel,
  confirmations: MeetingCheckInModel,
}

export type CollectionName = keyof CollectionTypes;
