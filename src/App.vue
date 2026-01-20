<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { usePersistentStore } from './stores/persistent-store';

//
const persistentStore = usePersistentStore();
//when online update set persistent to online true
window.addEventListener('online', () => {
  persistentStore.updateOnlineState(true);
});
window.addEventListener('offline', () => {
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
