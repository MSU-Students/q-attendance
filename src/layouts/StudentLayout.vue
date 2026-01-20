<script setup lang="ts">
import EssentialLink, { EssentialLinkProps } from 'src/components/EssentialLink.vue';
import { useAuthStore } from 'src/stores/auth-store';
import { useKeepingStore } from 'src/stores/keeping-store';
import { useLogout } from 'src/utils/redirect';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const { logout } = useLogout();
const authStore = useAuthStore();
const classStore = useKeepingStore();
const router = useRouter();

const drawer = ref(false);

const linksList: EssentialLinkProps[] = [
  {
    title: 'Home',
    icon: 'home',
    link: '/student',
  },
];

onMounted(async () => {
  const studentAccount = authStore.studentAccount;
  if (studentAccount) {
    await classStore.loadUserKeeping(studentAccount.ownerKey);
  }
});

function openEnrollDialog() {
  void router.push('/student').then(() => {
    setTimeout(() => {
      const enrollEvent = new CustomEvent('open-enroll-dialog');
      window.dispatchEvent(enrollEvent);
    }, 100);
  });
}
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="header-container">
      <q-toolbar class="classroom-toolbar">
        <div class="row items-center no-wrap full-width">
          <div class="row items-center header-left">
            <q-btn flat round dense icon="menu" @click="drawer = !drawer" />

            <q-toolbar-title class="q-ml-sm username-title">
              <span class="greeting">Hi, </span>
              <span class="name">{{
                authStore.currentUser?.displayName
                  ? authStore.currentUser?.displayName.split(' ')[0]
                  : ''
              }}</span>
            </q-toolbar-title>
          </div>

          <q-space />

          <div class="row items-center header-actions">
            <q-btn
              flat
              round
              icon="add"
              color="grey-8"
              @click="openEnrollDialog"
              class="action-btn"
            >
              <q-tooltip>Join class</q-tooltip>
            </q-btn>

            <q-btn flat round class="avatar-btn">
              <q-avatar size="32px">
                <img
                  :src="authStore.currentUser?.photoURL || 'https://cdn.quasar.dev/img/avatar.png'"
                />
              </q-avatar>
              <q-menu anchor="bottom right" self="top right">
                <q-list style="min-width: 200px">
                  <q-item class="user-info">
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
                      <q-item-label class="ellipsis">{{
                        authStore.currentUser?.displayName
                      }}</q-item-label>
                      <q-item-label caption class="ellipsis">{{
                        authStore.currentUser?.email
                      }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable v-close-popup @click="logout">
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
            <q-btn dense flat :to="{ name: 'home' }">
              <q-icon size="2rem" class="self-center">
                <img src="https://cdn.quasar.dev/logo-v2/svg/logo.svg" />
              </q-icon>
              <q-tooltip>Go to Home Page</q-tooltip>
            </q-btn>
            <div class="text-subtitle1 text-weight-bold">Q-Class Attendance</div>
          </div>
        </div>

        <q-scroll-area class="drawer-scroll-area">
          <q-list padding class="classroom-nav-list">
            <EssentialLink v-for="link in linksList" :key="link.title" v-bind="link" />

            <q-separator class="q-my-md" />

            <q-item-label header class="text-weight-bold q-pb-xs">Enrolled</q-item-label>
            <EssentialLink
              v-for="theClass in classStore.enrolled"
              :key="theClass.key"
              :title="theClass.name"
              :caption="theClass.section"
              :icon="'class'"
              :link="`/student/class/${theClass.key}`"
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
.header-container {
  margin: 1rem;
  border-radius: 10px;

  @media (max-width: 599px) {
    margin: 0.5rem;
  }
}

.classroom-toolbar {
  height: 64px;
  padding: 0 16px;
  border-bottom: 1px solid #e0e0e0;

  @media (max-width: 599px) {
    height: 56px;
    padding: 0 8px;
  }
}

.header-left {
  flex-shrink: 0;
  max-width: 60%;

  .app-logo {
    @media (max-width: 350px) {
      display: none;
    }
  }
}

.username-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 1.1rem;

  @media (max-width: 599px) {
    font-size: 1.1rem;
    max-width: 150px;
  }

  .greeting {
    @media (max-width: 350px) {
      display: none;
    }
  }

  .name {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: bottom;
  }
}

.header-actions {
  gap: 8px;

  @media (max-width: 599px) {
    gap: 4px;
  }

  .action-btn {
    @media (max-width: 599px) {
      padding: 4px;
    }
  }

  .avatar-btn {
    @media (max-width: 599px) {
      padding: 4px;
    }
  }
}

.user-info {
  max-width: 200px;

  .q-item-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
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
