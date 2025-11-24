import { defineStore, acceptHMRUpdate } from 'pinia';
import { usePersistentStore } from './persistent-store';
import { useKeepingStore } from './keeping-store';
import { OrgModel, UserModel } from 'src/models';

export const useOrgStore = defineStore('orgStore', {
  state: () => ({}),
  getters: {},
  actions: {
    async findOrgsByCode(orgCode: string) {
      const persistentStore = usePersistentStore();
      const records = await persistentStore.findRecords('organizations', undefined, {
        orgCode: { '==': orgCode },
      });
      const foundClass = records.find((record) => record.orgCode === orgCode);
      return foundClass;
    },
    async loadOrganization(key: string, loadMembers = false) {
      const persistentStore = usePersistentStore();
      const [record, officers, members] = await Promise.all([
        persistentStore.getRecord('organizations', key),
        persistentStore.findRecords('officers', `/organizations/${key}`),
        loadMembers ? persistentStore.findRecords('members', `/organizations/${key}`) : Promise.resolve([]),
      ]);
      if (record) {
        record.officers = officers;
        record.members = members;
        return record;
      }
    },
    async deleteOrg(key: string) {
      const persistentStore = usePersistentStore();
      const keepingStore = useKeepingStore();
      await persistentStore.deleteRecord('organizations', key);
      keepingStore.deleteMembership(key);
    },

    async saveOrg(payload: OrgModel, officer: UserModel) {
      const persistentStore = usePersistentStore();
      const keepingStore = useKeepingStore();
      const record = await persistentStore.createRecord('organizations', {
        ...payload,
        officers: [],
        members: [],
      });
      if (record) {
        keepingStore.joinOrg(record);
        await this.appointOfficer({
          org: record,
          officer: officer,
        });
      }
    },

    async join(payload: { org: OrgModel; student: UserModel }) {
      const persistentStore = usePersistentStore();
      const [student, org] = await Promise.all([
        persistentStore.createRecord('members', {
          ...payload.student,
          key: payload.student.ownerKey,
        }, `/organizations/${payload.org.key}`),
        persistentStore.getRecord('organizations', payload.org.key),
      ]);
      if (student && org) {
        org.members = org.members || [];
        org.members.push(student);
        const keepings = await persistentStore.getRecord('class-keepings', payload.student.ownerKey);
        await persistentStore.updateRecord('class-keepings', payload.student.ownerKey, {
          memberships: [...new Set([...(keepings?.memberships || []), org.key])],
        });
      }
    },
    async appointOfficer(payload: { org: OrgModel; officer: UserModel }) {
      const persistentStore = usePersistentStore();
      const [officer, org] = await Promise.all([
        persistentStore.createRecord('officers', {
          ...payload.officer,
          key: payload.officer.ownerKey
        }, `/organizations/${payload.org.key}`),
        persistentStore.getRecord('organizations', payload.org.key),
      ]);
      if (officer && org) {
        org.officers = org.officers || [];
        org.officers.push(officer);
        const keepings = await persistentStore.getRecord('class-keepings', payload.officer.ownerKey);
        await persistentStore.updateRecord('class-keepings', payload.officer.ownerKey, {
          memberships: [...new Set([...(keepings?.memberships || []), org.key])],
        });
      }
    },

    async dismissMember(payload: { orgKey: string; studentKey: string }) {
      try {
        const persistentStore = usePersistentStore();
        const keepingStore = useKeepingStore();
        const membership = await persistentStore.getRecord(
          'members',
          payload.studentKey,
          `/organizations/${payload.orgKey}`,
        );

        if (
          !membership ||
          !membership.key ||
          membership.status == 'inactive'
        ) {
          return false;
        }

        await persistentStore.updateRecord(
          'members',
          payload.studentKey,
          {
            status: 'inactive',
          },
          `/organizations/${payload.orgKey}`,
        );

        const keepings = await persistentStore.getRecord('class-keepings', payload.studentKey);
        if (keepings) {
          const updatedMemberships = (keepings.memberships || []).filter(
            (orgKey: string) => orgKey !== payload.orgKey,
          );

          await persistentStore.updateRecord('class-keepings', payload.studentKey, {
            memberships: updatedMemberships,
          });
        }
        keepingStore.deleteMembership(payload.orgKey);
        return true;
      } catch (error) {
        console.error('Error dismissing student membership:', error);
        return false;
      }
    },
  }
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOrgStore, import.meta.hot));
}
