import { defineStore } from 'pinia';
import { Notify } from 'quasar';
import type { UserModel } from 'src/models/user.models';
import { firebaseService } from 'src/services/firebase-service';
import { usePersistentStore } from './persistent-store';
import { User } from 'firebase/auth';
interface IState {
  currentAccounts: UserModel[],
  currentUser?: User | undefined
}
export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentAccounts: []
  } as IState),
  getters: {
    isUserLoggedIn: (state) => !!state.currentUser,
    isUserAdmin: (state) => state.currentAccounts.some(a => a.role == 'admin'),
    isUserSupervisor: (state) => state.currentAccounts.some(a => a.role == 'supervisor'),
    isUserTeacher: (state) => state.currentAccounts.some(a => a.role == 'teacher'),
    isUserStudent: (state) => state.currentAccounts.some(a => a.role == 'student'),
    adminAccount: (state) => state.currentAccounts.find(a => a.role == 'admin'),
    supervisorAccount: (state) => state.currentAccounts.find(a => a.role == 'supervisor'),
    teacherAccount: (state) => state.currentAccounts.find(a => a.role == 'teacher'),
    studentAccount: (state) => state.currentAccounts.find(a => a.role == 'student'),
  },
  actions: {
    async login(username: string, password: string) {
      await firebaseService.signWithEmailPassword(username, password);
      return this.authorizeUser();
    },
    async loginWithGoogle() {
      await firebaseService.signInWithGoogle();
      const user = await firebaseService.authorizeUser();
      return !!user;
    },
    async register(email: string, password: string, displayName: string) {
      await firebaseService.registerWithEmailPassword(email, password, displayName);
    },
    async authorizeUser() {
      if (this.currentUser) {
        return this.currentUser;
      }
      this.currentUser = await firebaseService.authorizeUser();
      if (this.currentUser) {
        const persistentStore = usePersistentStore();
        const accounts = await persistentStore.findRecords('users', undefined, {
          ownerKey: this.currentUser.uid
        });
        this.currentAccounts = accounts;
      }
      return this.currentUser;
    },
    async applyForRole(role: UserModel['role']) {
      if (!this.currentUser) {
        throw new Error('Unauthorized access');
      }
      const account: UserModel = {
        key: `${this.currentUser.uid}-${role}`,
        email: this.currentUser.email || '',
        emailVerified: this.currentUser.emailVerified,
        fullName: this.currentUser.displayName || 'Anonymous',
        ownerKey: this.currentUser.uid,
        avatar: this.currentUser.photoURL || '',
        role,
        status: ['student', 'teacher'].includes(role || '') ? 'active' : 'pending',
      };
      const persistentStore = usePersistentStore();
      const oldAccount = await persistentStore.getRecord('users', account.key);
      if (oldAccount) {
        throw new Error('Account already exists: ' + (oldAccount.status));
      } else {
        return await persistentStore.createRecord('users', account);
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
