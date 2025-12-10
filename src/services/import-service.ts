import { firebaseService } from './firebase-service';
import type { UserModel } from 'src/models/user.models';
import type { ClassModel } from 'src/models/class.models';
import type { ImportHistoryModel } from 'src/models/import.models';

export type DuplicateStrategy = 'skip' | 'update';

class ImportService {
  /**
   * Import students rows into a class.
   * rows: array of parsed objects from Excel. Expected keys: email, fullName (case-insensitive)
   */
  async importStudentsFromRows(options: {
    classKey: string;
    teacherKey?: string; // optional operator or teacher to link students to
    rows: Record<string, any>[];
    filename?: string;
    duplicateStrategy?: DuplicateStrategy;
    operatorKey?: string; // who performed import
  }) {
    const {
      classKey,
      teacherKey,
      rows,
      filename,
      duplicateStrategy = 'skip',
      operatorKey,
    } = options;

    let importedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;

    // load class
    const cls = await firebaseService.getRecord('classes', classKey);
    if (!cls) throw new Error(`Class not found: ${classKey}`);

    // ensure teacher is linked to class teachers subcollection if teacherKey provided
    if (teacherKey) {
      try {
        const teacher = await firebaseService.getRecord('users', teacherKey);
        if (teacher) {
          // create teachers entry under /classes/{classKey}/teachers with teacher.key
          teacher.role = teacher.role || 'teacher';
          await firebaseService.createRecord('teachers', teacher, `/classes/${classKey}`);
          // update class keeping for teacher
          const keep = await firebaseService.getRecord('class-keepings', teacher.key);
          await firebaseService.updateRecord('class-keepings', teacher.key, {
            teaching: [...new Set([...(keep?.teaching || []), classKey])],
          });
        }
      } catch (e) {
        console.warn('failed to link teacher to class', e);
      }
    }

    for (const rawRow of rows) {
      try {
        // Normalize common columns
        const email = (
          rawRow.email ||
          rawRow.Email ||
          rawRow.emailAddress ||
          rawRow['E-mail'] ||
          rawRow.e ||
          ''
        )
          .toString()
          .trim()
          .toLowerCase();
        const fullName = (
          rawRow.fullName ||
          rawRow.name ||
          rawRow.Name ||
          rawRow['Full Name'] ||
          rawRow.f ||
          ''
        )
          .toString()
          .trim();
        if (!email) {
          skippedCount++;
          continue; // skip rows without email
        }

        // search existing user by email
        const foundUsers = await firebaseService.findRecords('users', undefined, {
          email: { '==': email },
        });

        let student: UserModel | undefined;

        if (foundUsers && foundUsers.length) {
          student = foundUsers[0] as UserModel;
          // update or skip based on strategy
          if (duplicateStrategy === 'skip') {
            skippedCount++;
          } else if (duplicateStrategy === 'update') {
            const updatePayload: Partial<UserModel> = {
              fullName: fullName || student.fullName,
              email: student.email || email,
              status: student.status || 'active',
              role: 'student',
            };
            await firebaseService.updateRecord('users', student.key, updatePayload);
            student = { ...student, ...updatePayload } as UserModel;
            updatedCount++;
          }
        } else {
          // create new user
          const newUser: UserModel = {
            key: undefined,
            fullName: fullName || email,
            email,
            role: 'student',
            status: 'active',
          };
          const created = await firebaseService.createRecord('users', newUser);
          if (created) {
            student = created;
            importedCount++;
          }
        }

        if (!student) continue;

        // create or update enrolled record under class
        // ensure enrolled doc uses the student's user key so we can manage it
        try {
          const enrollRecord: UserModel = { ...student };
          enrollRecord.key = student.key;
          await firebaseService.createRecord('enrolled', enrollRecord, `/classes/${classKey}`);

          // update class-keepings for student
          const keepings = await firebaseService.getRecord('class-keepings', student.key);
          await firebaseService.updateRecord('class-keepings', student.key, {
            enrolled: [...new Set([...(keepings?.enrolled || []), classKey])],
          });
        } catch (e) {
          console.warn('failed to enroll student in class', e);
        }
      } catch (e) {
        console.error('row import error', e);
        skippedCount++;
      }
    }

    // write import history - firebaseService CollectionTypes may not include import-history type,
    // so cast to any to avoid TypeScript type restrictions here
    try {
      const history: ImportHistoryModel = {
        key: undefined,
        filename: filename || 'unknown',
        date: new Date().toISOString(),
        classKey: classKey,
        className: cls.name,
        totalRecords: rows.length,
        importedCount,
        skippedCount,
        updatedCount,
        userKey: operatorKey || teacherKey,
      };
      // cast the collection name to any because firebaseService CollectionTypes may not include it
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await firebaseService.createRecord('import-history' as any, history as any);
    } catch (e) {
      console.warn('failed to write import history', e);
    }

    return {
      importedCount,
      skippedCount,
      updatedCount,
      total: rows.length,
    };
  }
}

export const importService = new ImportService();
