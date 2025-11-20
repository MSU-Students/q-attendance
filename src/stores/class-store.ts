import { defineStore, acceptHMRUpdate } from 'pinia';
import type { ClassModel } from 'src/models/class.models';
import type { UserModel } from 'src/models/user.models';
import { usePersistentStore } from './persistent-store';

interface IState {
  teaching: ClassModel[];
  archivedTeaching: ClassModel[];
  enrolled: ClassModel[];
  archivedEnrolled: ClassModel[];
}

export const useClassStore = defineStore('Class', {
  state: () =>
    ({
      teaching: [],
      enrolled: [],
      archivedEnrolled: [],
      archivedTeaching: [],
    }) as IState,

  getters: {},

  actions: {
    async loadUserClasses(userKey: string, loadArchived?: boolean) {
      const persistentStore = usePersistentStore();
      const classKeeping = await persistentStore.getRecord('class-keepings', userKey);
      if (classKeeping) {
        const classKeys = [...classKeeping.enrolled, ...classKeeping.teaching];
        if (loadArchived) {
          //TODO:limit size
          classKeys.push(...classKeeping.archivedEnrolled, ...classKeeping.archivedTeaching);
        }
        const classes = await persistentStore.findRecords('classes', undefined, {
          key: { in: classKeys },
        });
        this.enrolled = classes.filter((cls) => classKeeping.enrolled.includes(cls.key));
        this.teaching = classes.filter((cls) => classKeeping.teaching.includes(cls.key));
        this.archivedEnrolled = classes.filter((cls) =>
          classKeeping.archivedEnrolled.includes(cls.key),
        );
        this.archivedTeaching = classes.filter((cls) =>
          classKeeping.archivedTeaching.includes(cls.key),
        );
      } else {
        await persistentStore.createRecord('class-keepings', {
          key: userKey,
          enrolled: [],
          teaching: [],
          archivedEnrolled: [],
          archivedTeaching: [],
        });
        this.enrolled = [];
        this.teaching = [];
        this.archivedEnrolled = [];
        this.archivedTeaching = [];
      }
    },

    async findClassByCode(classCode: string) {
      const persistentStore = usePersistentStore();
      const records = await persistentStore.findRecords('classes', undefined, {
        classCode: { '==': classCode },
      });
      const foundClass = records.find((record) => record.classCode === classCode);
      return foundClass;
    },
    async loadClass(key: string) {
      const persistentStore = usePersistentStore();
      const [record, enrolled, teachers] = await Promise.all([
        persistentStore.getRecord('classes', key),
        persistentStore.findRecords('enrolled', `/classes/${key}`),
        persistentStore.findRecords('teachers', `/classes/${key}`),
      ]);
      if (record) {
        record.enrolled = enrolled;
        record.teachers = teachers;
        return record;
      }
    },
    async deleteClass(key: string) {
      const persistentStore = usePersistentStore();
      await persistentStore.deleteRecord('classes', key);
      this.teaching = this.teaching.filter((c) => c.key !== key);
    },

    async saveClass(payload: ClassModel, teacher: UserModel) {
      const persistentStore = usePersistentStore();
      const record = await persistentStore.createRecord('classes', {
        ...payload,
        teachers: undefined,
        enrolled: undefined,
      });
      if (record) {
        this.teaching.push(record);
        await this.join({
          class: record,
          teacher: teacher,
        });
      }
    },

    async enroll(payload: { class: ClassModel; student: UserModel }) {
      const persistentStore = usePersistentStore();
      const [student, cls] = await Promise.all([
        persistentStore.createRecord('enrolled', {
          ...payload.student,
          key: payload.student.ownerKey,
        }, `/classes/${payload.class.key}`),
        persistentStore.getRecord('classes', payload.class.key),
      ]);
      if (student && cls) {
        cls.enrolled = cls.enrolled || [];
        cls.enrolled.push(student);
        const keepings = await persistentStore.getRecord('class-keepings', payload.student.ownerKey);
        await persistentStore.updateRecord('class-keepings', payload.student.ownerKey, {
          enrolled: [...new Set([...(keepings?.enrolled || []), cls.key])],
        });
      }
    },
    async join(payload: { class: ClassModel; teacher: UserModel }) {
      const persistentStore = usePersistentStore();
      const [teacher, cls] = await Promise.all([
        persistentStore.createRecord('teachers', {
          ...payload.teacher,
          key: payload.teacher.ownerKey
        }, `/classes/${payload.class.key}`),
        persistentStore.getRecord('classes', payload.class.key),
      ]);
      if (teacher && cls) {
        cls.teachers = cls.teachers || [];
        cls.teachers.push(teacher);
        const keepings = await persistentStore.getRecord('class-keepings', payload.teacher.ownerKey);
        await persistentStore.updateRecord('class-keepings', payload.teacher.ownerKey, {
          teaching: [...new Set([...(keepings?.teaching || []), cls.key])],
        });
      }
    },

    async unEnroll(payload: { classKey: string; studentKey: string }) {
      try {
        const persistentStore = usePersistentStore();
        const cls = await this.loadClass(payload.classKey);

        if (
          !cls ||
          !cls.key ||
          !cls.enrolled ||
          !cls.enrolled.find((e) => e.key == payload.studentKey)
        ) {
          return false;
        }

        await persistentStore.updateRecord(
          'enrolled',
          payload.studentKey,
          {
            status: 'inactive',
          },
          `/classes/${payload.classKey}`,
        );

        const keepings = await persistentStore.getRecord('class-keepings', payload.studentKey);
        if (keepings) {
          const updatedEnrolled = (keepings.enrolled || []).filter(
            (classKey: string) => classKey !== payload.classKey,
          );

          await persistentStore.updateRecord('class-keepings', payload.studentKey, {
            enrolled: updatedEnrolled,
          });
        }

        this.enrolled = this.enrolled.filter((c) => c.key !== payload.classKey);

        const teaching = this.teaching.find((c) => c.key == cls.key);
        if (teaching && teaching.enrolled) {
          const student = teaching.enrolled.find((e) => e.key == payload.studentKey);
          if (student) {
            student.status = 'inactive';
          }
        }

        return true;
      } catch (error) {
        console.error('Error un-enrolling student:', error);
        return false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useClassStore, import.meta.hot));
}
