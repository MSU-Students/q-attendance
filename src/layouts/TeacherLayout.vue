<script setup lang="ts">
import EssentialLink, { EssentialLinkProps } from 'src/components/EssentialLink.vue';
import { useAuthStore } from 'src/stores/auth-store';
import { useKeepingStore } from 'src/stores/keeping-store';
import { useLogout } from 'src/utils/redirect';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const { logout } = useLogout();
const authStore = useAuthStore();
const classStore = useKeepingStore();

const drawer = ref(false);
const miniState = ref(false);
const router = useRouter();

onMounted(async () => {
  if (authStore.isUserTeacher) {
    await classStore.loadUserKeeping(authStore.teacherAccount!.ownerKey);
  }
});

const linksList: EssentialLinkProps[] = [
  {
    title: 'Dashboard',
    icon: 'space_dashboard',
    link: '/teacher',
  },
];

function drawerClick() {
  if (miniState.value) {
    miniState.value = false;
  }
}

function openCreateClassDialog() {
  void router.push('/teacher').then(() => {
    setTimeout(() => {
      const enrollEvent = new CustomEvent('open-create-class-dialog');
      window.dispatchEvent(enrollEvent);
    }, 100);
  });
}
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="header-container">
      <q-toolbar class="q-toolbar responsive-toolbar">
        <q-btn flat round dense icon="menu" @click="drawer = !drawer" />

        <q-toolbar-title class="ellipsis">
          <span class="greeting">Hi,</span>
          {{
            authStore.currentUser?.displayName
              ? authStore.currentUser?.displayName.split(' ')[0]
              : ''
          }}!
        </q-toolbar-title>

        <div class="action-buttons">
          <q-btn flat round icon="add" @click="openCreateClassDialog()" class="add-btn" />

          <q-btn flat round class="avatar-btn">
            <q-avatar size="32px">
              <img
                :src="authStore.currentUser?.photoURL || 'https://cdn.quasar.dev/img/avatar.png'"
              />
            </q-avatar>
            <q-menu>
              <q-list style="min-width: 100px">
                <q-item clickable v-close-popup @click="logout">
                  <q-item-section>Logout</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawer"
      show-if-above
      bordered
      :mini="!drawer || miniState"
      @click.capture="drawerClick()"
    >
      <q-scroll-area class="fit" :horizontal-thumb-style="{ opacity: '0' }">
        <q-card style="padding-top: 1rem">
          <q-card-section>
            <div class="flex items-center gap-2">
              <q-btn dense flat :to="{ name: 'home' }">
                <q-icon size="2rem" class="self-center">
                  <img src="https://cdn.quasar.dev/logo-v2/svg/logo.svg" />
                </q-icon>
                <q-tooltip>Go to Home Page</q-tooltip>
              </q-btn>
              <div v-if="!miniState" style="font-size: 1.4rem; margin-left: 0.5rem">
                <strong>Q-Class Attendance</strong>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-list padding>
          <EssentialLink v-for="link in linksList" :key="link.title" v-bind="link" />

          <q-separator class="q-my-md" />

          <q-item-label header class="text-weight-bold q-pb-xs">Classes</q-item-label>
          <EssentialLink
            v-for="theClass in classStore.teaching"
            :key="theClass.key"
            :title="theClass.name"
            :icon="'class'"
            :link="`/teacher/class/${theClass.key}`"
          />
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style lang="scss">
.header-container {
  margin: 1rem;
  margin-left: 1.5rem;
  border-radius: 10px;

  @media (max-width: 599px) {
    margin: 0.5rem;
    margin-left: 0.5rem;
  }
}

.responsive-toolbar {
  min-height: 56px;
  padding: 0 12px;

  .q-toolbar-title {
    font-size: 1.1rem;
    line-height: 1.2;

    @media (max-width: 599px) {
      font-size: 1rem;
      max-width: 150px;
    }

    .greeting {
      @media (max-width: 350px) {
        display: none;
      }
    }
  }

  .action-buttons {
    display: flex;
    align-items: center;
    gap: 8px;

    @media (max-width: 599px) {
      gap: 4px;
    }

    .add-btn {
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
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
