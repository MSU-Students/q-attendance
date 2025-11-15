import { defineStore } from 'pinia';
import { Notify } from 'quasar';
import type { UserModel } from 'src/models/user.models';
import { firebaseService } from 'src/services/firebase-service';
import { usePersistentStore } from './persistent-store';
interface IState {
  currentAccount?: UserModel | undefined
}
export const useAuthStore = defineStore('auth', {
  state: () => ({} as IState),
  getters: {
    isUserAdmin: (state) => state.currentAccount?.role == 'admin',
  },
  actions: {
    async login(username: string, password: string) {
      await firebaseService.signWithEmailPassword(username, password);
      return this.authorizeUser();
    },
    async loginWithGoogle() {
      const persistentStore = usePersistentStore();
      await firebaseService.signInWithGoogle();
      const user = await firebaseService.authorizeUser();
      if (user) {
        const userKey = user.uid;
        const userData = await persistentStore.getRecord('users', userKey);

        if (userData) {
          return false;
        }
        return true;
      }
      return false;
    },
    async register(email: string, password: string, displayName: string, role: string) {
      await firebaseService.registerWithEmailPassword(email, password);
      return this.authorizeUser(displayName, role);
    },
    async authorizeUser(displayName: string = '', role: string = '') {
      const user = await firebaseService.authorizeUser();
      if (user) {
        const persistentStore = usePersistentStore();
        persistentStore.updateOnlineState(true);
        this.currentAccount = {
          key: user.uid,
          avatar: user.photoURL || '',
          email: user.email || '',
          emailVerified: !!user.emailVerified,
          fullName: user.displayName || displayName,
          role: role as UserModel['role'],
          status: 'active',
        }
        const userKey = this.currentAccount.key || '';
        const userData = await persistentStore.getRecord('users', userKey);
        this.currentAccount = {
          ...this.currentAccount,
          ...userData
        }
        await persistentStore.updateRecord('users', this.currentAccount.key || '', this.currentAccount);
        return this.currentAccount;
      } else {
        this.currentAccount = undefined;
      }
    },
    async updateRole(role: 'student' | 'teacher' | 'supervisor' | 'admin', key: string) {
      const persistentStore = usePersistentStore();
      await persistentStore.updateRecord('users', key, { role })
        .then(() => {
          Notify.create({
            message: 'Role updated',
            color: 'green',
            icon: 'check_circle',
            position: 'top',
            timeout: 3000,
            progress: true
          });
        })
    },
    async updateStatus(status: 'active' | 'inactive' | 'pending', key: string) {
      const persistentStore = usePersistentStore();
      await persistentStore.updateRecord('users', key, { status })
        .then(() => {
          Notify.create({
            message: `Status updated to ${status}`,
            color: status === 'active' ? 'green' : status === 'pending' ? 'orange' : 'red',
            icon: status === 'active' ? 'check_circle' : status === 'pending' ? 'schedule' : 'block',
            position: 'top',
            timeout: 3000,
            progress: true
          });
        })
    },
    async logout() {
      await firebaseService.signOut();
    },
    sendForgetPassword(email: string) {
      return firebaseService.resetPassword(email);
    }
  },
});
