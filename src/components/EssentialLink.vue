<template>
  <!-- <q-item :to="link" clickable>
    <q-item-section v-if="icon" avatar>
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>{{ caption }}</q-item-label>
    </q-item-section>
  </q-item> -->

  <div class="items">
    <q-btn
      no-caps
      :flat="!isActive"
      padding="15px 15px"
      align="left"
      class="buttons"
      :class="{ 'active-button': isActive }"
      :to="link"
      :icon="icon"
      :label="title"
    >
      <q-tooltip v-if="caption?.length != 0">
        {{ caption }}
      </q-tooltip>
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();
const isActive = computed(() => {
  // Remove any trailing slashes for comparison
  const currentPath = route.path.replace(/\/$/, '');
  const linkPath = props.link.replace(/\/$/, '');
  return currentPath === linkPath;
});

export interface EssentialLinkProps {
  title: string;
  caption?: string;
  link?: string;
  icon?: string;
}

const props = withDefaults(defineProps<EssentialLinkProps>(), {
  caption: '',
  link: '#',
  icon: '',
});
</script>

<style>
.items {
  display: flex;
  margin-left: 1rem;
  margin-right: 1rem;
  gap: 10px;
  color: #697a8d;
}

.buttons {
  width: 100%;
  border-radius: 10px;
  margin-bottom: 5px;
  transition: all 0.3s ease;
}

.active-button {
  background-color: #790622; /* Light background for active state */
  color: white; /* Or any color you prefer for active state */
  font-weight: 500;
}
</style>
