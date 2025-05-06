import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { name: 'home', path: '', component: () => import('pages/HomePage.vue') },
      { name: 'classes', path: 'class', component: () => import('pages/ClassPage.vue') },
      { name: 'attendance', path: 'attendance/:classKey', component: () => import('pages/AttendancePage.vue') },
      { name: 'rollCall', path: 'roll-call/:classKey', component: () => import('pages/RollCallPage.vue') },
    ]
  },

  // Student Page
  {
    path: '/student',
    component: () => import('layouts/StudentLayout.vue'),
    children: [
      { name: 'student', path: '', component: () => import('pages/student/StudentDashboard.vue'), meta: { student: true } },
    ]
  },
  // Teacher Page
  {
    path: '/teacher',
    component: () => import('layouts/TeacherLayout.vue'),
    children: [
      { name: 'teacher', path: '', component: () => import('pages/teacher/TeacherDashboard.vue'), meta: { teacher: true } },
    ]
  },
  // Supervisor Page
  {
    path: '/supervisor',
    component: () => import('layouts/SupervisorLayout.vue'),
    children: [
      { name: 'supervisor', path: '', component: () => import('pages/supervisor/SupervisorDashboard.vue'), meta: { supervisor: true } },
    ]
  },

  // Admin Page
  {
    path: '/admin',
    component: () => import('layouts/AdminLayout.vue'),
    children: [
      { name: 'admin', path: '', component: () => import('pages/admin/DashboardPage.vue'), meta: { admin: true } },
      { name: 'user-approvals', path: 'user-approvals', component: () => import('pages/admin/UserApprovals.vue'), meta: { admin: true } },
      { name: 'users', path: 'users', component: () => import('pages/admin/UsersPage.vue'), meta: { admin: true } },
    ]
  },

  // Status Page
  {
    path: '/status',
    component: () => import('layouts/StatusAccLayout.vue'),
    children: [
      { name: 'status', path: '', component: () => import('pages/StatusPage.vue') },
    ]
  },


  //loginPage
  {
    path: '/auth',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('pages/auth/LoginPage.vue'),
        meta: { anonymous: true }
      },
      { name: 'register', path: 'register', component: () => import('pages/auth/RegisterPage.vue'), meta: { anonymous: true } },

    ]
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
