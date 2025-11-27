import { defineStore, acceptHMRUpdate } from 'pinia';
import { usePersistentStore } from './persistent-store';
import { ClassModel, UserModel } from 'src/models';
import { useKeepingStore } from './keeping-store';

export const useClassStore = defineStore('class', {
  state: () => ({}),
  getters: {},
  actions: {
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
      const keepingStore = useKeepingStore();
      await persistentStore.deleteRecord('classes', key);
      keepingStore.deleteTeaching(key);
    },

    async saveClass(payload: ClassModel, teacher: UserModel) {
      const persistentStore = usePersistentStore();
      const keepingStore = useKeepingStore();
      const record = await persistentStore.createRecord('classes', {
        ...payload,
        teachers: undefined,
        enrolled: undefined,
      });
      if (record) {
        keepingStore.addTeaching(record);
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
        const keepingStore = useKeepingStore();
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
        keepingStore.unEnroll(payload.classKey, payload.studentKey);
        return true;
      } catch (error) {
        console.error('Error un-enrolling student:', error);
        return false;
      }
    },
  }
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useClassStore, import.meta.hot));
}
