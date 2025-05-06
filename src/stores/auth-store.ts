import { defineStore } from 'pinia';
import { Notify } from 'quasar';
import type { UserModel } from 'src/models/user.models';
import { firebaseService } from 'src/services/firebase-service';
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
      await firebaseService.signInWithGoogle();
      return this.authorizeUser();
    },
    async register(email: string, password: string) {
      await firebaseService.registerWithEmailPassword(email, password);
      return this.authorizeUser();
    },
    async authorizeUser() {
      const user = await firebaseService.authorizeUser();
      if (user) {
        this.currentAccount = {
          key: user.uid,
          avatar: user.photoURL || '',
          email: user.email || '',
          emailVerified: !!user.emailVerified,
          fullName: user.displayName || '',
          role: 'student'
        }
        const userKey = this.currentAccount.key || '';
        const userData = await firebaseService.getRecord('users', userKey);
        this.currentAccount = {
          ...this.currentAccount,
          ...userData
        }
        await firebaseService.updateRecord('users', this.currentAccount.key || '', this.currentAccount);
        return this.currentAccount;
      } else {
        this.currentAccount = undefined;
      }
    },
    async updateRole(role: 'student' | 'teacher' | 'supervisor' | 'admin', key: string) {
      await firebaseService.updateRecord('users', key, { role })
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
      await firebaseService.updateRecord('users', key, { status })
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
