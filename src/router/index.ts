import { defineRouter } from '#q-app/wrappers';
import { Notify } from 'quasar';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { useAuthStore } from 'src/stores/auth-store';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  const authStore = useAuthStore();

  const showNotification = () => {
    Notify.create({
      message: 'You do not have access to this page',
      color: 'negative',
      icon: 'warning',
      position: 'top',
      timeout: 3000,
      progress: true,
    });
  };

  Router.beforeEach(async (to, from, next) => {
    await authStore.authorizeUser();
    if (to.meta?.anonymous && authStore.isUserLoggedIn) {
      showNotification();
      next({ name: 'home' });
    } if (to.meta?.admin && !authStore.isUserAdmin) {
      showNotification();
      next({ name: 'home' });
    } else if (to.meta?.supervisor && !authStore.isUserSupervisor) {
      showNotification();
      next({ name: 'home' });
    } else if (to.meta?.teacher && !authStore.isUserTeacher) {
      showNotification();
      next({ name: 'home' });
    } else if (to.meta?.student && !authStore.isUserStudent) {
      if (!authStore.isUserLoggedIn && to.query?.joinCode) {
        next({
          name: 'login',
          query: { redirect: to.fullPath }
        })
      } else if (authStore.isUserLoggedIn) {
        next({
          name: 'apply-for-role',
          params: { role: 'student' },
          query: { redirect: to.fullPath }
        })
      } else {
        showNotification();
        next({ name: 'home' });
      }
    } else {
      next();
    }
  });

  return Router;
});
