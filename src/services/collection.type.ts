import { ClassMeetingModel, MeetingCheckInModel } from 'src/models/attendance.models';
import { ClassModel, ClassKeepingModel } from 'src/models/class.models';
import { UserModel } from 'src/models/user.models';

export type CollectionTypes = {
  users: UserModel;
  classes: ClassModel;
  'teachers': UserModel;
  'enrolled': UserModel;
  meetings: ClassMeetingModel;
  'check-ins': MeetingCheckInModel,
  'class-keepings': ClassKeepingModel
}

export type CollectionName = keyof CollectionTypes;
