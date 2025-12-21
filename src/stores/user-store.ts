import { defineStore, acceptHMRUpdate } from 'pinia';
import { UserModel } from 'src/models/user.models';
import { firebaseService } from 'src/services/firebase-service';
import { usePersistentStore } from './persistent-store';

interface IState {
  users: UserModel[]
}
export const useUsersStore = defineStore('users', {
  state: () => ({
    users: []
  } as IState),

  getters: {

  },

  actions: {
    async loadUsers() {
      const users = await firebaseService.findRecords('users');
      this.users = users;
    },
    async importUsers(users: UserModel[], onProgress?: (done: number, total: number) => void) {
      const persistentStore = usePersistentStore();
      const errors: { user: UserModel; error: string }[] = [];
      let done = 0;
      for (const u of users) {
        try {
          await persistentStore.createRecord('users', u);
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          errors.push({ user: u, error: errMsg });
          console.error('failed to import user', u, e);
        } finally {
          done++;
          onProgress?.(done, users.length);
        }
      }
      await this.loadUsers();
      return {
        success: users.length - errors.length,
        failed: errors.length,
        errors,
      } as const;
    }
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUsersStore, import.meta.hot));
}
