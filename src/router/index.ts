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

  const showNotif = () => {
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
    const user = await authStore.authorizeUser();
    if (to.meta?.anonymous && user) {
      showNotif();
      next({ name: 'home' });
    }
    // if (to.meta?.admin && user?.role !== 'admin') {
    //   showNotif();
    //   next({ name: 'home' });
    // }
    else if (to.meta?.supervisor && user?.role !== 'supervisor' && to.name != 'home') {
      showNotif();
      next({ name: 'home' });
    } else if (to.meta?.teacher && user?.role !== 'teacher') {
      showNotif();
      next({ name: 'home' });
    } else if (to.meta?.student && user?.role !== 'student') {
      showNotif();
      next({ name: 'home' });
    } else {
      next();
    }
  });

  return Router;
});
