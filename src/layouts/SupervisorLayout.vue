<script setup lang="ts">
import EssentialLink, { EssentialLinkProps } from 'src/components/EssentialLink.vue';
import { useAuthStore } from 'src/stores/auth-store';
import { useClassStore } from 'src/stores/class-store';
import { useLogout } from 'src/utils/redirect';
import { ref, onMounted } from 'vue';
const { logout } = useLogout();
const authStore = useAuthStore();
const classStore = useClassStore();

const drawer = ref(false);

const linksList: EssentialLinkProps[] = [
  {
    title: 'Dashboard',
    icon: 'dashboard',
    link: '/supervisor',
  },
  {
    title: 'Classes',
    icon: 'school',
    link: '/supervisor/classes',
  },
  {
    title: 'Reports',
    icon: 'assessment',
    link: '/supervisor/reports',
  },
  {
    title: 'Teachers',
    icon: 'person',
    link: '/supervisor/teachers',
  },
  {
    title: 'Students',
    icon: 'people',
    link: '/supervisor/students',
  },
];

onMounted(async () => {
  if (authStore.isUserSupervisor) {
    await classStore.loadUserClasses('');
  }
});

function signOff() {
  logout();
}
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header style="margin: 1rem; border-radius: 10px">
      <q-toolbar class="classroom-toolbar">
        <div class="row items-center no-wrap full-width">
          <div class="row items-center">
            <q-btn flat round dense icon="menu" @click="drawer = !drawer" />

            <q-avatar class="q-ml-sm" size="32px">
              <img src="https://cdn.quasar.dev/logo-v2/svg/logo.svg" />
            </q-avatar>

            <q-toolbar-title class="text-primary q-ml-sm">
              Hi,
              {{
                authStore.currentUser?.displayName
                  ? authStore.currentUser?.displayName.split(' ')[0]
                  : ''
              }}
            </q-toolbar-title>
          </div>

          <q-space />

          <div class="row items-center q-gutter-sm">
            <q-btn flat round>
              <q-avatar size="32px">
                <img
                  :src="authStore.currentUser?.photoURL || 'https://cdn.quasar.dev/img/avatar.png'"
                />
              </q-avatar>
              <q-menu>
                <q-list style="min-width: 200px">
                  <q-item>
                    <q-item-section avatar>
                      <q-avatar>
                        <img
                          :src="
                            authStore.currentUser?.photoURL ||
                            'https://cdn.quasar.dev/img/avatar.png'
                          "
                        />
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ authStore.currentUser?.displayName }}</q-item-label>
                      <q-item-label caption>{{ authStore.currentUser?.email }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable v-close-popup @click="signOff">
                    <q-item-section>Logout</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawer"
      show-if-above
      bordered
      :width="256"
      :breakpoint="500"
      class="classroom-drawer"
    >
      <div class="drawer-content">
        <div class="drawer-header q-px-md q-py-sm">
          <div class="row items-center no-wrap">
            <q-icon size="28px" class="q-mr-sm">
              <img src="https://cdn.quasar.dev/logo-v2/svg/logo.svg" />
            </q-icon>
            <div class="text-subtitle1 text-weight-bold">Q-Class Attendance</div>
          </div>
        </div>

        <q-scroll-area class="drawer-scroll-area">
          <q-list padding class="classroom-nav-list">
            <EssentialLink v-for="link in linksList" :key="link.title" v-bind="link" />

            <q-separator class="q-my-md" />

            <q-item-label header class="text-weight-bold q-pb-xs">All Classes</q-item-label>
            <EssentialLink
              v-for="theClass in [...classStore.teaching, ...classStore.enrolled]"
              :key="theClass.key"
              :title="theClass.name"
              :caption="theClass.section"
              :icon="'class'"
              :link="`/supervisor/class/${theClass.key}`"
            />
          </q-list>
        </q-scroll-area>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.classroom-toolbar {
  height: 64px;
  padding: 0 16px;
  border-bottom: 1px solid #e0e0e0;
}

.classroom-drawer {
  background-color: white;
}

.drawer-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.drawer-header {
  flex-shrink: 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.drawer-scroll-area {
  flex-grow: 1;
  height: calc(100% - 56px);
}

.classroom-nav-list .q-item {
  border-radius: 0 24px 24px 0;
  margin-right: 12px;
  padding: 8px 12px;
  min-height: 48px;
  font-weight: 500;
}

.classroom-nav-list .q-item.active-button {
  background-color: #e6f4ea;
  color: #1a73e8;
}

.classroom-nav-list .q-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
