import { defineStore, acceptHMRUpdate } from 'pinia';
import type { ClassModel } from 'src/models/class.models';
import { usePersistentStore } from './persistent-store';
import { OrgModel } from 'src/models';

interface IState {
  teaching: ClassModel[];
  archivedTeaching: ClassModel[];
  enrolled: ClassModel[];
  archivedEnrolled: ClassModel[];
  memberships: OrgModel[];
  archivedMemberships: OrgModel[];
}

export const useKeepingStore = defineStore('Keeping', {
  state: () =>
    ({
      teaching: [],
      enrolled: [],
      memberships: [],
      archivedEnrolled: [],
      archivedTeaching: [],
      archivedMemberships: []
    }) as IState,

  getters: {},

  actions: {
    async loadUserKeeping(userKey: string, loadArchived?: boolean) {
      const persistentStore = usePersistentStore();
      const classKeeping = await persistentStore.getRecord('class-keepings', userKey);
      if (classKeeping) {
        const classKeys = [...classKeeping.enrolled, ...classKeeping.teaching];
        const orgKeys = [...(classKeeping.memberships || [])]
        if (loadArchived) {
          //TODO:limit size
          classKeys.push(...classKeeping.archivedEnrolled, ...classKeeping.archivedTeaching);
          orgKeys.push(...(classKeeping.archivedMemberships || []));
        }
        const classes = classKeys.length ? await persistentStore.findRecords('classes', undefined, {
          key: { in: classKeys },
        }) : [];
        const orgs = orgKeys.length ? await persistentStore.findRecords('organizations', undefined, {
          key: { in: orgKeys },
        }) : [];
        this.enrolled = classes.filter((cls) => classKeeping.enrolled.includes(cls.key));
        this.teaching = classes.filter((cls) => classKeeping.teaching.includes(cls.key));
        this.memberships = orgs.filter((org) => classKeeping.memberships.includes(org.key));
        this.archivedEnrolled = classes.filter((cls) =>
          classKeeping.archivedEnrolled.includes(cls.key),
        );
        this.archivedTeaching = classes.filter((cls) =>
          classKeeping.archivedTeaching.includes(cls.key),
        );
        this.archivedMemberships = orgs.filter((org) =>
          classKeeping.archivedMemberships.includes(org.key),
        );
      } else {
        await persistentStore.createRecord('class-keepings', {
          key: userKey,
          enrolled: [],
          teaching: [],
          memberships: [],
          archivedEnrolled: [],
          archivedTeaching: [],
          archivedMemberships: []
        });
        this.enrolled = [];
        this.teaching = [];
        this.archivedEnrolled = [];
        this.archivedTeaching = [];
        this.memberships = [];
        this.archivedMemberships = [];
      }
    },
    //mem functions
    addTeaching(cls: ClassModel) {
      this.teaching.push(cls);
    },
    deleteTeaching(classKey: string) {
      this.teaching = this.teaching.filter((c) => c.key !== classKey);
    },
    unEnroll(classKey: string, studentKey: string) {
      //as student
      this.enrolled = this.enrolled.filter((c) => c.key !== classKey);
      //as teacher
      const teaching = this.teaching.find((c) => c.key == classKey);
      if (teaching && teaching.enrolled) {
        const student = teaching.enrolled.find((e) => e.key == studentKey);
        if (student) {
          student.status = 'inactive';
        }
      }
    },
    deleteMembership(orgKey: string) {
      this.memberships = this.memberships.filter((c) => c.key !== orgKey);
    },
    joinOrg(org: OrgModel) {
      this.memberships.push(org);
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useKeepingStore, import.meta.hot));
}
