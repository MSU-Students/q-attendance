<template>
  <router-view />
  <q-badge v-if="offline" class="fixed-bottom-left z-max">offline</q-badge>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { usePersistentStore } from './stores/persistent-store';
import { ref } from 'vue';

const offline = ref(false);
const persistentStore = usePersistentStore();
//when online update set persistent to online true
window.addEventListener('online', () => {
  offline.value = false;
  persistentStore.updateOnlineState(true);
});
window.addEventListener('offline', () => {
  offline.value = true;
  persistentStore.updateOnlineState(false);
});
onMounted(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Reload the page to apply the update
      window.location.reload();
    });
  }
});
</script>
