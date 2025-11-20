<template>
  <router-view />
</template>

<script setup lang="ts">
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
</script>
