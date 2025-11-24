<script setup lang="ts">
import { useAttendanceStore } from 'src/stores/attendance-store';
import { useAuthStore } from 'src/stores/auth-store';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ClassMeetingModel } from 'src/models/attendance.models';
import { ClassModel } from 'src/models/class.models';
import CheckInTabPanel from './tabs/CheckInTabPanel.vue';
import ClassHistoryTabPanel from './tabs/ClassHistoryTabPanel.vue';
import { useClassStore } from 'src/stores/class-store';

const route = useRoute();
const classStore = useClassStore();
const attendanceStore = useAttendanceStore();
const authStore = useAuthStore();

const tab = ref('check-in');

const activeClass = computed(() => {
  if (route.params?.classKey === currentClass.value?.key) {
    return currentClass.value;
  }
  return undefined;
});
const currentClass = ref<ClassModel>();
const currentStudent = computed(() => {
  return authStore.studentAccount;
});

onMounted(async () => {
  if (typeof route.params?.classKey === 'string') {
    currentClass.value = await classStore.loadClass(route.params.classKey);
    loadAttendanceSessions();
  }
});

function loadAttendanceSessions() {
  if (activeClass.value?.key) {
    const unsubscribe = attendanceStore.streamClassMeetings(activeClass.value.key, {
      student: currentStudent.value?.ownerKey || '',
      onSnapshot(records) {
        meetings.value = [...records];
      },
    });
    onUnmounted(unsubscribe);
  }
}
const meetings = ref<ClassMeetingModel[]>([]);
const openMeetings = computed(() => {
  return meetings.value.filter((meeting) => {
    if (meeting.status !== 'open') return false;
    return !(
      meeting.checkIns &&
      meeting.checkIns.some((checkIn) => checkIn.key === currentStudent.value?.ownerKey)
    );
  });
});
const historyMeetings = computed(() => {
  return meetings.value.filter((meeting) => {
    return (
      meeting.checkIns &&
      meeting.checkIns.some((checkIn) => checkIn.key === currentStudent.value?.ownerKey)
    );
  });
});
</script>

<template>
  <q-page padding>
    <div class="q-pa-md">
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6">{{ activeClass?.name || 'Class' }}</div>
          <div v-if="activeClass" class="text-subtitle2">Section: {{ activeClass.section }}</div>
        </q-card-section>
      </q-card>
      <q-tabs
        v-model="tab"
        class="text-primary"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="check-in" label="Check-in" icon="how_to_reg" />
        <q-tab name="history" label="Attendance History" icon="history" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <!-- Check-in Tab -->
        <CheckInTabPanel name="check-in" :meetings="openMeetings" @checked-in="tab = 'history'" />
        <!-- Attendance History Tab -->
        <ClassHistoryTabPanel name="history" :meetings="historyMeetings" />
      </q-tab-panels>
    </div>
  </q-page>
</template>
