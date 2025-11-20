<script setup lang="ts">
import { ClassMeetingModel, MeetingCheckInModel } from 'src/models/attendance.models';
import { formatDate, getStatusColor, getStatusLabel } from './helpers';
import { computed } from 'vue';
import { useAuthStore } from 'src/stores/auth-store';
const props = defineProps<{
  meetings: ClassMeetingModel[];
}>();
const authStore = useAuthStore();
const currentStudent = computed(() => {
  return authStore.studentAccount;
});
const classMeetingHistory = computed(() => {
  return props.meetings.reduce((all, meeting) => {
    all.push(...(meeting.checkIns || []).filter((c) => c.key == currentStudent.value?.ownerKey));
    return all;
  }, [] as MeetingCheckInModel[]);
});
</script>

<template>
  <q-tab-panel name="history">
    <div class="text-h6 q-mb-md">My Attendance History</div>

    <div v-if="classMeetingHistory.length === 0" class="text-center q-pa-lg text-grey">
      No attendance records found.
    </div>

    <q-list v-else bordered separator>
      <q-item v-for="record in classMeetingHistory" :key="record.key" class="q-my-sm">
        <q-item-section>
          <q-item-label>{{ formatDate(record.checkInTime) }}</q-item-label>
          <q-item-label caption> Check-in time: {{ record.checkInTime }} </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-badge :color="getStatusColor(record.status)">
            {{ getStatusLabel(record.status) }}
          </q-badge>
        </q-item-section>
      </q-item>
    </q-list>
  </q-tab-panel>
</template>
