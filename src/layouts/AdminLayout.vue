<script setup lang="ts">
import { ref } from 'vue';
import EssentialLink, { type EssentialLinkProps } from 'src/components/EssentialLink.vue';
import { useLogout } from 'src/utils/redirect';
import { useAuthStore } from 'src/stores/auth-store';

const { logout } = useLogout();
const authStore = useAuthStore();

const drawer = ref(false);
const miniState = ref(false);
const userManagementExpanded = ref(true);
const orgManagementExpanded = ref(true);

const linksList: EssentialLinkProps[] = [
  {
    title: 'Dashboard',
    icon: 'space_dashboard',
    link: '/admin',
  },
];

const userManagementLinks: EssentialLinkProps[] = [
  {
    title: 'Users',
    icon: 'people',
    link: '/admin/users',
  },
  {
    title: 'Role Management',
    icon: 'admin_panel_settings',
    link: '/admin/role-management',
  },
  {
    title: 'User Approvals',
    icon: 'how_to_reg',
    link: '/admin/user-approvals',
  },
];

const orgManagementLinks: EssentialLinkProps[] = [
  {
    title: 'Organizations',
    icon: 'people',
    link: '/admin/organizations',
  },
];

function drawerClick() {
  if (miniState.value) {
    miniState.value = false;
  }
}

function signOff() {
  logout();
}

function toggleUserManagement() {
  userManagementExpanded.value = !userManagementExpanded.value;
  console.log(userManagementExpanded.value);
}
</script>

<template>
  <q-layout view="lHh Lpr lFf" style="background-color: #f3f3f7">
    <q-header style="margin: 1rem; margin-left: 1.5rem; border-radius: 10px">
      <q-toolbar>
        <q-btn flat round dense icon="menu" @click="drawer = !drawer" />

        <q-toolbar-title>Admin Dashboard</q-toolbar-title>

        <q-btn round>
          <q-avatar>
            <img
              :src="authStore.currentUser?.photoURL || 'https://cdn.quasar.dev/img/avatar.png'"
            />
          </q-avatar>
          <q-menu>
            <q-btn color="primary" label="Logout" @click="signOff" />
          </q-menu>
        </q-btn>
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
              <q-icon size="2rem" class="self-center">
                <img src="https://cdn.quasar.dev/logo-v2/svg/logo.svg" />
              </q-icon>
              <div v-if="!miniState" style="font-size: 1.4rem; margin-left: 0.5rem">
                <strong>Q-Class Attendance</strong>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-list padding>
          <EssentialLink v-for="link in linksList" :key="link.title" v-bind="link" />

          <q-expansion-item
            v-if="!miniState"
            v-model="userManagementExpanded"
            icon="groups"
            label="User Management"
            @click="userManagementExpanded != userManagementExpanded"
          >
            <q-list>
              <EssentialLink
                v-for="subLink in userManagementLinks"
                :key="subLink.title"
                v-bind="subLink"
                class="q-pl-xl"
              />
            </q-list>
          </q-expansion-item>
          <q-expansion-item
            v-if="!miniState"
            v-model="orgManagementExpanded"
            icon="groups"
            label="Org Management"
            @click="orgManagementExpanded != orgManagementExpanded"
          >
            <q-list>
              <EssentialLink
                v-for="subLink in orgManagementLinks"
                :key="subLink.title"
                v-bind="subLink"
                class="q-pl-xl"
              />
            </q-list>
          </q-expansion-item>

          <q-item v-else clickable v-ripple @click="toggleUserManagement">
            <q-item-section avatar>
              <q-icon name="groups" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>

      <div class="q-mini-drawer-hide absolute" style="top: 1.7rem; right: -17px">
        <q-btn
          dense
          round
          unelevated
          color="accent"
          icon="chevron_left"
          @click="miniState = true"
        />
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
