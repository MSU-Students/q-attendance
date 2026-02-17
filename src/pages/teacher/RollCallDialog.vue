<script setup lang="ts">
import { ClassMeetingModel, MeetingCheckInModel } from 'src/models/attendance.models';
import { ClassModel, StudentEnrollment } from 'src/models/class.models';
import { useAttendanceStore } from 'src/stores/attendance-store';
import {
  AttendanceStatus,
  calculateStudentAttendance,
  getAttendanceStatus,
} from 'src/utils/attendance-utils';
import { computed, ref } from 'vue';
import { date } from 'quasar';
import AttendanceReportDialog from './AttendanceReportDialog.vue';

const props = defineProps<{
  targetClass: ClassModel;
  targetMeeting: ClassMeetingModel;
  currentStudent: StudentEnrollment;
  currentCheckIn?: MeetingCheckInModel | undefined;
}>();

const show = defineModel<boolean>({ required: true });
const attendanceStore = useAttendanceStore();
const showAttendanceReport = ref(false);
const allMeetings = ref<ClassMeetingModel[]>([]);

if (props.targetClass.key) {
  attendanceStore.streamClassMeetings(props.targetClass.key, {
    loadAllCheckIns: true,
    onSnapshot(meetings) {
      const now = new Date();
      allMeetings.value = meetings.filter((m) => date.getDateDiff(m.date, now, 'days') < 0);
    },
  });
}

// Calculate student attendance stats
const attendanceStats = computed(() => {
  if (!props.currentStudent.key || allMeetings.value.length === 0) {
    return null;
  }
  return calculateStudentAttendance(allMeetings.value, props.currentStudent.key);
});

// Get attendance status
const attendanceStatus = computed<AttendanceStatus>(() => {
  if (!attendanceStats.value) {
    return {
      status: 'no-data',
      color: 'grey',
      icon: 'help_outline',
      conclusion: 'No available data',
      absentCount: 0,
      attendanceRate: 0,
      consecutiveAbsent: 0,
      lateCount: 0,
      maxConsecutiveAbsences: 0,
      presentCount: 0,
      totalMeetings: 0,
    };
  }
  return getAttendanceStatus(
    attendanceStats.value,
    props.currentStudent.fullName || 'Student',
    allMeetings.value,
    props.currentStudent.key || '',
  );
});

const emits = defineEmits<{
  (event: 'callStatus', status: MeetingCheckInModel['status'] | 'later'): void;
}>();

function callStatus(status: MeetingCheckInModel['status'] | 'later') {
  const stats = attendanceStatus.value;
  if (stats.status !== 'no-data' && status === 'later') {
    // const classStore = useClassStore();
    // await classStore.updateStudentStatus({
    //   class: props.targetClass,
    //   student: {
    //     ...props.currentStudent,
    //     reportStatus: stats.status,
    //     consecutiveAbsences: stats.consecutiveAbsent,
    //     totalAbsences: stats.absentCount,
    //     totalTardiness: stats.lateCount,
    //   },
    // });
  }
  emits('callStatus', status);
}
</script>
<template>
  <q-dialog :model-value="show" :maximized="$q.screen.lt.sm">
    <q-card>
      <q-toolbar>
        <q-btn icon="close" v-close-popup round size="sm" class="q-mr-lg"></q-btn>
        <q-badge>{{ targetClass.academicYear }}</q-badge>
        <q-toolbar-title>{{ targetClass.name }} : {{ targetClass.section }}</q-toolbar-title>
        <q-badge color="secondary">{{ currentCheckIn?.checkInTime }}</q-badge>
        <q-chip icon="event">{{ targetMeeting.date }}</q-chip>
      </q-toolbar>
      <q-card-section class="q-pa-lg">
        <div class="row items-center justify-center q-gutter-md">
          <!-- Avatar on the left -->
          <div class="col-auto">
            <q-avatar size="100px">
              <img
                :src="currentStudent.avatar || 'https://cdn.quasar.dev/img/avatar.png'"
                :alt="currentStudent.fullName?.charAt(0).toUpperCase()"
              />
            </q-avatar>
          </div>

          <!-- Student info on the right -->
          <div class="col-auto">
            <div class="text-h5 text-weight-medium">{{ currentStudent.fullName }}</div>
            <div class="text-caption text-grey-5 q-mb-sm">{{ currentStudent.email }}</div>

            <!-- Status Section -->
            <div class="q-mb-sm">
              <div class="row items-center q-gutter-sm">
                <div class="text-body2 text-grey-6 text-uppercase text-weight-medium">Status:</div>
                <q-chip
                  :color="
                    attendanceStatus.status === 'critical'
                      ? 'orange'
                      : attendanceStatus.status === 'drop'
                        ? 'red'
                        : attendanceStatus.color
                  "
                  text-color="white"
                  :icon="attendanceStatus.icon"
                  size="md"
                  class="q-px-md"
                >
                  {{ attendanceStatus.status.toUpperCase().replace('-', ' ') }}
                </q-chip>
              </div>
            </div>

            <!-- View Details Button -->
            <q-btn
              flat
              dense
              color="primary"
              icon="analytics"
              label="View Details"
              size="sm"
              class="q-px-md"
              @click="showAttendanceReport = true"
            />
          </div>
        </div>
      </q-card-section>
      <q-card-actions class="q-gutter-lg" align="evenly">
        <q-btn color="info" @click="callStatus('later')">Call Later</q-btn>
        <q-btn
          color="negative"
          :outline="currentCheckIn?.status == 'absent'"
          @click="callStatus('absent')"
          >Absent</q-btn
        >
        <q-btn
          color="warning"
          :outline="currentCheckIn?.status == 'late'"
          @click="callStatus('late')"
          >Late</q-btn
        >
      </q-card-actions>
      <q-card-section>
        <q-btn
          color="positive"
          class="full-width"
          :outline="currentCheckIn?.status == 'present'"
          @click="callStatus('present')"
          >Present</q-btn
        >
      </q-card-section>
      <q-card-section v-if="currentCheckIn?.comments">
        <q-scroll-area style="height: 100px">
          <q-chat-message
            v-for="comment in currentCheckIn.comments"
            :key="comment.key"
            :text="[comment.msg]"
            :sent="comment.from != 'student'"
          ></q-chat-message>
        </q-scroll-area>
      </q-card-section>
    </q-card>
    <AttendanceReportDialog
      v-model="showAttendanceReport"
      :target-class="targetClass"
      :current-student="currentStudent"
      :all-meetings="allMeetings"
      skip-saving
    />
  </q-dialog>
</template>
