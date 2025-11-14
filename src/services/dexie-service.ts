import Dexie, { EntityTable } from 'dexie';
import { ClassMeetingModel } from 'src/models/attendance.models';
import { ClassKeepingModel, ClassModel } from 'src/models/class.models';
import { UserModel } from 'src/models/user.models';
import { CollectionName, CollectionTypes } from './collection.type';

const DB_NAME = "attendance-db";
type DexieCollectionsType = {
  [table in CollectionName]: EntityTable<CollectionTypes[table], 'key'>
}
export const localDb = new Dexie(DB_NAME) as Dexie & DexieCollectionsType;

// Declare tables, IDs and indexes
localDb.version(1).stores({
  users: 'key',
  classes: 'key',
  'teachers': '[path+key]',
  'enrolled': '[path+key]',
  meetings: 'key',
  'check-ins': '[path+key]',
  'class-keepings': '[path+key]',
});




