<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ClassModel } from 'src/models/class.models';
import ClassMeetingListingTabPanel from './tabs/ClassMeetingListingTabPanel.vue';
import EnrolledStudentsTabPanel from './tabs/EnrolledStudentsTabPanel.vue';
import AnalysisTabPanel from './tabs/AnalysisTabPanel.vue';
import { useClassStore } from 'src/stores/class-store';

const route = useRoute();
const classStore = useClassStore();

const tab = ref('attendance');

const activeClass = computed(() => {
  if (route.params?.classKey === currentClass.value?.key) {
    return currentClass.value;
  }
  return undefined;
});

const currentClass = ref<ClassModel>();

onMounted(async () => {
  if (typeof route.params?.classKey === 'string') {
    currentClass.value = await classStore.loadClass(route.params.classKey);
  }
});
</script>

<template>
  <q-page style="margin: 2rem 1rem 2rem 1.5rem">
    <div class="class-dashboard q-mb-md" v-if="activeClass">
      <q-card>
        <q-card-section>
          <div class="text-h5">{{ activeClass.name }}</div>
          <div class="text-subtitle2">
            Section: {{ activeClass.section }} | Academic Year: {{ activeClass.academicYear }}
          </div>
          <div class="text-caption">Class Code: {{ activeClass.classCode }}</div>
        </q-card-section>
      </q-card>
    </div>

    <q-tabs
      v-model="tab"
      class="text-primary"
      active-color="primary"
      indicator-color="primary"
      align="justify"
      narrow-indicator
    >
      <q-tab name="attendance" label="Attendance History" icon="history" />
      <q-tab name="students" label="Students" icon="people" />
      <q-tab name="analysis" label="Analysis" icon="analytics" />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model="tab" v-if="activeClass" animated>
      <EnrolledStudentsTabPanel :current-class="activeClass" name="students" />
      <ClassMeetingListingTabPanel :cls="activeClass" name="attendance" />
      <AnalysisTabPanel :cls="activeClass" name="analysis" />
    </q-tab-panels>
  </q-page>
</template>

<style scoped>
.class-dashboard {
  border-radius: 8px;
  overflow: hidden;
}
</style>
