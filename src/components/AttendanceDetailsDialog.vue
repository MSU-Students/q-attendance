<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Dialog, Notify } from 'quasar';
import { ClassMeetingModel } from 'src/models/attendance.models';
import { useAttendanceStore } from 'src/stores/attendance-store';
import { ClassModel } from 'src/models/class.models';
import { formatDate, getStatusColor, getStatusLabel } from 'src/pages/student/tabs/helpers';

const props = defineProps<{
  meeting: ClassMeetingModel;
  targetClass: ClassModel;
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'attendance-updated'): void;
}>();

const attendanceStore = useAttendanceStore();
const currentMeeting = ref<ClassMeetingModel>();
const isUpdating = ref(false);
onMounted(async () => {
  currentMeeting.value = await attendanceStore.loadMeeting(props.meeting.key);
});
const allCheckIns = computed(() => {
  return currentMeeting.value?.checkIns || [];
});
const checkedInStudents = computed(() => {
  if (!allCheckIns.value.length) return [];
  return allCheckIns.value
    .map((checkIn) => {
      const student = (props.targetClass.enrolled || []).find((user) => user.key === checkIn.key);
      return {
        ...checkIn,
        avatar: student?.avatar || '',
        studentName: student?.fullName || 'Unknown Student',
      };
    })
    .filter((c) => c.status != 'absent');
});

const absentStudents = computed(() => {
  if (!allCheckIns.value.length) return [];

  return (props.targetClass.enrolled || [])
    .map((student) => {
      const checkIn = allCheckIns.value?.find((c) => c.key == student.key);
      return {
        student: student.key || '',
        studentName: student.fullName || 'Unknown Student',
        checkInTime: checkIn?.checkInTime || '-',
        status: checkIn?.status || 'absent',
      };
    })
    .filter((c) => c.status == 'absent');
});

function closeAttendanceSession() {
  Dialog.create({
    title: 'Close Attendance Session',
    message:
      'Are you sure you want to close this attendance session? This will mark all students who have not checked in as absent.',
    persistent: true,
    ok: {
      label: 'Yes, Close Session',
      color: 'primary',
    },
    cancel: {
      label: 'Cancel',
      flat: true,
    },
  }).onOk(() => {
    try {
      isUpdating.value = true;

      attendanceStore
        .concludeMeeting(props.meeting.key)
        .then(() => {
          Notify.create({
            message: 'Attendance session closed successfully',
            color: 'green',
            icon: 'check_circle',
            position: 'top',
            timeout: 3000,
          });

          emit('attendance-updated');

          emit('update:show', false);
        })
        .catch((error) => {
          console.error('Error closing attendance session:', error);
          Notify.create({
            message: 'Failed to close attendance session',
            color: 'negative',
            icon: 'error',
            position: 'top',
            timeout: 3000,
          });
        })
        .finally(() => {
          isUpdating.value = false;
        });
    } catch (error) {
      console.error('Error initiating close attendance session:', error);
      isUpdating.value = false;
    }
  });
}

function reopenAttendanceSession() {
  Dialog.create({
    title: 'Re-open Attendance Session',
    message: 'Are you sure you want to re-open this attendance session?',
    persistent: true,
    ok: {
      label: 'Yes, Re-open Session',
      color: 'primary',
    },
    cancel: {
      label: 'Cancel',
      flat: true,
    },
  }).onOk(() => {
    try {
      isUpdating.value = true;

      attendanceStore
        .reopenMeeting(props.meeting.key)
        .then(() => {
          Notify.create({
            message: 'Attendance session re-opened successfully',
            color: 'green',
            icon: 'check_circle',
            position: 'top',
            timeout: 3000,
          });

          emit('attendance-updated');

          emit('update:show', false);
        })
        .catch((error) => {
          console.error('Error re-opening attendance session:', error);
          Notify.create({
            message: 'Failed to re-open attendance session',
            color: 'negative',
            icon: 'error',
            position: 'top',
            timeout: 3000,
          });
        })
        .finally(() => {
          isUpdating.value = false;
        });
    } catch (error) {
      console.error('Error initiating re-open attendance session:', error);
      isUpdating.value = false;
    }
  });
}
</script>

<template>
  <q-dialog
    :model-value="show"
    @update:model-value="emit('update:show', $event)"
    persistent
    maximized
  >
    <q-card>
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Attendance Details</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <div class="text-subtitle1">{{ formatDate(meeting.date) }}</div>
        <q-badge
          :color="
            meeting.status === 'open' ? 'green' : meeting.status === 'cancelled' ? 'red' : 'blue'
          "
        >
          {{ meeting.status }}
        </q-badge>
      </q-card-section>

      <q-card-section>
        <div></div>

        <q-list bordered separator>
          <q-item-label header class="text-h5 q-mb-md bg-primary">Student Attendance</q-item-label>
          <q-item v-for="student in checkedInStudents" :key="student.key" class="q-my-sm">
            <q-item-section>
              <q-item-label>{{ student.studentName }}</q-item-label>
              <q-item-label caption> Check-in time: {{ student.checkInTime }} </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-badge :color="getStatusColor(student.status)">
                {{ getStatusLabel(student.status) }}
              </q-badge>
            </q-item-section>
          </q-item>
          <q-item-label v-if="absentStudents.length" header class="text-h5 q-mb-md bg-primary"
            >Absent</q-item-label
          >
          <q-item v-for="student in absentStudents" :key="student.student" class="q-my-sm">
            <q-item-section>
              <q-item-label>{{ student.studentName }}</q-item-label>
              <q-item-label caption> Check-in time: {{ student.checkInTime }} </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-badge color="red"> {{ getStatusLabel(student.status) }} </q-badge>
            </q-item-section>
          </q-item>

          <q-item v-if="checkedInStudents.length === 0 && absentStudents.length === 0">
            <q-item-section>
              <q-item-label class="text-center text-grey"
                >No attendance data available</q-item-label
              >
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-if="meeting.status === 'open'"
          color="primary"
          label="Close Attendance Session"
          :loading="isUpdating"
          @click="closeAttendanceSession"
        />
        <q-btn
          v-if="meeting.status === 'concluded'"
          color="primary"
          label="Re-open Attendance Session"
          :loading="isUpdating"
          @click="reopenAttendanceSession"
        />
        <q-btn flat label="Close" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
