<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from 'src/stores/auth-store';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const drawer = ref(false);

const navLinks = [
  { label: 'Home', path: '/#home', target: 'home' },
  { label: 'Features', path: '/#features', target: 'features' },
  { label: 'About', path: '/#about', target: 'about' },
  { label: 'Contact', path: '/#contact', target: 'contact' },
];

// Function to scroll to section
const scrollToSection = (targetId: string) => {
  // Close drawer if open
  if (drawer.value) {
    drawer.value = false;
  }

  // If we're not on the home page, navigate there first
  if (route.path !== '/') {
    void router.push('/').then(() => {
      // Wait for navigation to complete
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    });
  } else {
    // We're already on the home page, just scroll
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

const signinButton = () => {
  void router.push({name:'login'});
};

const signupButton = () => {
  void router.push({name:'register'});
};

const gotoDashboard = () => {
  void router.push({name:`${authStore.currentAccount?.role}`});
};
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-white text-primary shadow-1">
      <div class="header-container">
        <q-toolbar class="centered-toolbar">
          <!-- Logo and Title (Left) -->
          <div class="logo-section">
            <div class="row items-center cursor-pointer" @click="scrollToSection('home')">
              <q-avatar class="q-mr-sm" size="32px">
                <img src="~assets/msulogo.png" />
              </q-avatar>
              <q-toolbar-title class="text-primary text-weight-bold"> Q-attendance </q-toolbar-title>
            </div>
          </div>

          <!-- Desktop Navigation (Center) -->
          <div class="nav-section desktop-nav">
            <div class="row justify-center items-center">
              <div v-for="link in navLinks" :key="link.label" class="q-mx-sm">
                <q-btn flat no-caps class="nav-link" @click="scrollToSection(link.target)">{{
                  link.label
                }}</q-btn>
              </div>
            </div>
          </div>

          <!-- Auth Buttons (Right) -->
          <div class="auth-section desktop-nav">
            <div v-if="authStore.currentAccount">
              <q-btn unelevated color="primary" no-caps @click="gotoDashboard"> Dashboard </q-btn>
            </div>
            <div v-else>
              <q-btn outline color="primary" no-caps class="q-mr-sm" @click="signinButton">
                Sign In
              </q-btn>
              <q-btn unelevated color="primary" no-caps @click="signupButton"> Get Started </q-btn>
            </div>
          </div>

          <!-- Mobile Menu Button -->
          <div class="mobile-only">
            <q-btn flat round icon="menu" @click="drawer = !drawer" />
          </div>
        </q-toolbar>
      </div>
    </q-header>

    <!-- Mobile Drawer -->
    <q-drawer v-model="drawer" bordered side="right" class="mobile-drawer">
      <q-list>
        <q-item-label header class="text-primary text-weight-bold">Menu</q-item-label>

        <q-item
          v-for="link in navLinks"
          :key="link.label"
          clickable
          v-ripple
          @click="scrollToSection(link.target)"
        >
          <q-item-section>{{ link.label }}</q-item-section>
        </q-item>

        <q-separator spaced />

        <q-item v-if="authStore.currentAccount" clickable v-ripple @click="gotoDashboard">
          <q-item-section>Dashboard</q-item-section>
        </q-item>
        <template v-else>
          <q-item clickable v-ripple @click="signinButton">
            <q-item-section>Sign In</q-item-section>
          </q-item>
          <q-item clickable v-ripple @click="signupButton">
            <q-item-section>Get Started</q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style lang="scss" scoped>
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.header-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.centered-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;

  .logo-section {
    flex: 0 0 auto;
    min-width: 180px;
  }

  .nav-section {
    flex: 1 1 auto;
    display: flex;
    justify-content: center;
  }

  .auth-section {
    flex: 0 0 auto;
    display: flex;
    justify-content: flex-end;
    min-width: 180px;
  }
}

.desktop-nav {
  display: flex;

  .nav-link {
    position: relative;
    font-weight: 500;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 0;
      height: 2px;
      background-color: #790622;
      transition: all 0.3s ease;
      transform: translateX(-50%);
    }

    &:hover::after,
    &.router-link-active::after {
      width: 80%;
    }
  }
}

.mobile-drawer {
  background-color: white;
}

// Footer styles
.q-footer {
  a {
    text-decoration: none;
    transition: opacity 0.3s;

    &:hover {
      opacity: 0.8;
    }
  }

  .q-btn {
    opacity: 0.9;
    transition: opacity 0.3s;

    &:hover {
      opacity: 1;
    }
  }
}

@media (min-width: 1024px) {
  .mobile-only {
    display: none;
  }
}

@media (max-width: 1023px) {
  .desktop-nav {
    display: none;
  }

  .centered-toolbar {
    justify-content: space-between;

    .logo-section {
      flex: 1;
      min-width: 0;
    }
  }
}

@media (max-width: 599px) {
  .centered-toolbar {
    padding: 0 8px;

    .q-toolbar-title {
      font-size: 1.1rem;
    }
  }
}
</style>
