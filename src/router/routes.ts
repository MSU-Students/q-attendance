import type { RouteRecordRaw } from 'vue-router';
import TeacherLayout from 'layouts/TeacherLayout.vue';
import TeacherDashboard from 'pages/teacher/TeacherDashboard.vue';
import TeacherClassPage from 'pages/teacher/TeacherClassPage.vue';
import RollCallPage from 'pages/teacher/RollCallPage.vue';
import MainLayout from 'layouts/MainLayout.vue';
import HomePage from 'pages/HomePage.vue';
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => MainLayout,
    children: [
      { name: 'home', path: '', component: () => HomePage },
      { name: 'classes', path: 'class', component: () => import('pages/ClassPage.vue') },
      { name: 'attendance', path: 'attendance/:classKey', component: () => import('pages/AttendancePage.vue') },
    ]
  },

  // Student Page
  {
    path: '/student',
    component: () => import('layouts/StudentLayout.vue'),
    children: [
      { name: 'student', path: '', component: () => import('pages/student/StudentDashboard.vue'), meta: { student: true } },
      { name: 'studentClass', path: 'class/:classKey', component: () => import('pages/student/StudentClassPage.vue'), meta: { student: true } },
    ]
  },
  // Teacher Page
  {
    path: '/teacher',
    component: () => TeacherLayout,
    children: [
      { name: 'teacher', path: '', component: () => TeacherDashboard, meta: { teacher: true } },
      { name: 'teacherClass', path: 'class/:classKey', component: () => TeacherClassPage, meta: { teacher: true } },
      { name: 'createAttendance', path: 'class/:classKey/create-attendance', component: () => import('pages/teacher/CreateAttendancePage.vue'), meta: { teacher: true } },
      { name: 'rollCall', path: 'class/:classKey/meeting/:meetingKey/roll-call', component: () => RollCallPage, meta: { teacher: true } },
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
      { name: 'role-management', path: 'role-management', component: () => import('pages/admin/RoleManagement.vue'), meta: { admin: true } },
      { name: 'org-management', path: 'organizations', component: () => import('pages/admin/OrgsPage.vue'), meta: { admin: true } },
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
    path: '/',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      { path: 'login', name: 'login', component: () => import('pages/auth/LoginPage.vue'), meta: { anonymous: true } },
      { name: 'register', path: 'register', component: () => import('pages/auth/RegisterPage.vue'), meta: { anonymous: true } },
      { name: 'apply-for-role', path: 'apply/:role?', component: () => import('pages/auth/ApplyForRolePage.vue'), meta: {} },
    ]
  },
  {
    path: '/kiosk',
    component: () => import('layouts/KioskLayout.vue'),
    children: [
      {
        path: 'guide', name: 'guide', component: () => import('pages/kiosk/GuidePage.vue'), meta: { anonymous: true }
      }
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
