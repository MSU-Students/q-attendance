<script setup lang="ts">
import { Notify } from 'quasar';
import { ClassMeetingModel } from 'src/models/attendance.models';
import { useAttendanceStore } from 'src/stores/attendance-store';
import { useAuthStore } from 'src/stores/auth-store';
import { computed, ref } from 'vue';
import { formatDate } from './helpers';

const attendanceStore = useAttendanceStore();
const authStore = useAuthStore();
defineProps<{
  name: string;
  meetings: ClassMeetingModel[];
}>();
const currentStudent = computed(() => {
  return authStore.studentAccount;
});
const isCheckingIn = ref(false);
async function checkInToSession(meeting: ClassMeetingModel) {
  if (!currentStudent.value?.key) {
    Notify.create({
      message: 'You must be logged in to check in',
      color: 'negative',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    });
    return;
  }

  const canCheckIn = validateCheckInTime(meeting.date);
  if (!canCheckIn.valid) {
    Notify.create({
      message: canCheckIn.message,
      color: 'red',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    });
    return;
  }

  isCheckingIn.value = true;
  try {
    await attendanceStore.checkInAttendance({
      student: currentStudent.value.key,
      meeting: meeting,
      status: 'check-in',
    });

    Notify.create({
      message:
        'Successfully checked in to class. Your status is "Checked In (Not Yet Present)" until the teacher confirms your attendance.',
      color: 'positive',
      icon: 'check_circle',
      position: 'top',
      timeout: 5000,
    });
  } catch (error) {
    console.error('Error checking in:', error);
    Notify.create({
      message: 'Failed to check in',
      color: 'negative',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    });
  } finally {
    isCheckingIn.value = false;
  }
}

function validateCheckInTime(classDateString: string): { valid: boolean; message: string } {
  try {
    const classDateTime = new Date(classDateString);
    const currentTime = new Date();
    currentTime.setHours(currentTime.getHours() - 6);

    if (currentTime == classDateTime) {
      const graceEndTime = new Date(classDateTime.getTime() + 30 * 60 * 1000);

      if (currentTime <= graceEndTime) {
        return { valid: true, message: '' };
      }

      return {
        valid: false,
        message:
          'Check-in is only available before or within 30 minutes of the scheduled class time.',
      };
    }

    return { valid: true, message: '' };
  } catch (error) {
    console.error('Error validating check-in time:', error);
    return {
      valid: false,
      message: 'Unable to validate check-in time. Please try again.',
    };
  }
}
</script>
<template>
  <q-tab-panel :name="name">
    <div class="text-h6 q-mb-md">Available Check-ins</div>

    <div v-if="meetings.length === 0" class="text-center q-pa-lg text-grey">
      No open attendance sessions available.
    </div>

    <q-list v-else bordered separator>
      <q-item v-for="session in meetings" :key="session.key" class="q-my-sm">
        <q-item-section>
          <q-item-label>{{ formatDate(session.date) }}</q-item-label>
          <q-item-label caption>
            Status:
            <q-badge color="green">{{ session.status }}</q-badge>
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-btn
            color="primary"
            label="Check-in"
            :loading="isCheckingIn"
            @click="checkInToSession(session)"
          />
        </q-item-section>
      </q-item>
    </q-list>
  </q-tab-panel>
</template>
