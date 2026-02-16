import { defineStore, acceptHMRUpdate } from 'pinia';
import { usePersistentStore } from './persistent-store';
import { ClassModel, StudentEnrollment, StudentUserModel, UserModel } from 'src/models';
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

    async enroll(payload: { class: ClassModel; student: StudentUserModel }) {
      const persistentStore = usePersistentStore();
      const cls = await persistentStore.getRecord('classes', payload.class.key);
      const enrolled = cls?.enrolled?.find(e => e.email == payload.student.email);
      if (cls && !enrolled) {
        const student = await persistentStore.createRecord('enrolled', {
          ...payload.student,
          key: payload.student.key,
        }, `/classes/${payload.class.key}`);
        if (student && cls) {
          cls.enrolled = cls.enrolled || [];
          cls.enrolled.push(student);
        }
      } else if (enrolled && payload.student.ownerKey) {
        const student = await persistentStore.getRecord('enrolled', enrolled.key, `/classes/${payload.class.key}`);
        if (student) {
          student.ownerKey = payload.student.ownerKey;
          student.dateRegistered = payload.student.dateRegistered as string;
          student.avatar = payload.student.avatar as string;
          student.fullName = payload.student.fullName;
          student.emailVerified = payload.student.emailVerified as boolean;
          await persistentStore.updateRecord('enrolled', enrolled.key, student, `/classes/${payload.class.key}`);
        }
      }
      if (cls && payload.student.ownerKey) {
        const keepings = await persistentStore.getRecord('class-keepings', payload.student.ownerKey);
        await persistentStore.updateRecord('class-keepings', payload.student.ownerKey, {
          enrolled: [...new Set([...(keepings?.enrolled || []), cls.key])],
        });
      }
    },
    async updateStudentStatus(payload: { class: ClassModel; student: StudentEnrollment }) {
      const persistentStore = usePersistentStore();
      const student = await persistentStore.getRecord('enrolled', payload.student.key, `/classes/${payload.class.key}`);
      if (student) {
        student.reportStatus = payload.student.reportStatus;
        student.totalAbsences = payload.student.totalAbsences;
        student.consecutiveAbsences = payload.student.consecutiveAbsences;
        student.totalTardiness = payload.student.totalTardiness;
        await persistentStore.updateRecord('enrolled', payload.student.key, student, `/classes/${payload.class.key}`);
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

    async unEnroll(payload: { classKey: string; studentEmail: string }) {
      try {
        const persistentStore = usePersistentStore();
        const keepingStore = useKeepingStore();
        const cls = await this.loadClass(payload.classKey);

        const enrolled = cls?.enrolled?.find((e) => e.email == payload.studentEmail);
        if (
          !cls ||
          !cls.key ||
          !enrolled
        ) {
          return false;
        }
        await persistentStore.updateRecord(
          'enrolled',
          enrolled.key,
          {
            status: 'inactive',
          },
          `/classes/${payload.classKey}`,
        );

        const keepings = await persistentStore.getRecord('class-keepings', enrolled.key);
        if (keepings) {
          const updatedEnrolled = (keepings.enrolled || []).filter(
            (classKey: string) => classKey !== payload.classKey,
          );

          await persistentStore.updateRecord('class-keepings', enrolled.key, {
            enrolled: updatedEnrolled,
          });
        }
        keepingStore.unEnroll(payload.classKey, enrolled.key);
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
