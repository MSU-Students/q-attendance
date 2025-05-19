import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth-store';
import { useRouter } from 'vue-router';

export function useLogout() {
  const $q = useQuasar();
  const router = useRouter();
  const authStore = useAuthStore();

  const logout = () => {
    $q.dialog({
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout?',
      cancel: true,
      persistent: true,
    }).onOk(() => {
      void authStore.logout();
      void router.push('/');
    });
  };

  return { logout };
}
