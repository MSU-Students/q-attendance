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
      allMeetings.value = meetings.filter((m) => m.status == 'concluded');
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
  (event: 'callStatus', status: MeetingCheckInModel['status'] | 'later' | 'back'): void;
}>();

function callStatus(status: MeetingCheckInModel['status'] | 'later' | 'back') {
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
          <div class="col-12 text-center">
            <q-avatar size="100px" class="outlined">
              <img
                v-if="currentStudent.avatar"
                :src="currentStudent.avatar"
                :alt="currentStudent.fullName ? currentStudent.fullName[0] : 'S'"
              />
              <span v-else>
                {{ currentStudent.fullName ? currentStudent.fullName[0] : 'S' }}
              </span>
            </q-avatar>
          </div>

          <!-- Student info on the right -->
          <div class="col-12 text-center">
            <div class="text-h5 text-weight-medium">{{ currentStudent.fullName }}</div>
            <div class="text-caption text-grey-5 q-mb-sm">{{ currentStudent.email }}</div>

            <!-- Status Section -->
            <div class="q-mb-sm">
              <q-chip
                v-if="allMeetings.length"
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
                clickable
                @click="showAttendanceReport = true"
              >
                {{ attendanceStatus.status.toUpperCase().replace('-', ' ') }}
              </q-chip>
            </div>
          </div>
        </div>
      </q-card-section>
      <q-card-actions class="q-gutter-lg" align="evenly">
        <q-btn round icon="undo" @click="callStatus('back')" />
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
