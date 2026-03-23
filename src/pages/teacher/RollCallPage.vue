<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { date, Dialog, Notify, useQuasar } from 'quasar';
import { ClassMeetingModel, MeetingCheckInModel } from 'src/models/attendance.models';
import { useAttendanceStore } from 'src/stores/attendance-store';
import { useRoute, useRouter } from 'vue-router';
import { ClassModel, StudentEnrollment } from 'src/models/class.models';
import RollCallDialog from './RollCallDialog.vue';
import { useClassStore } from 'src/stores/class-store';
import { calculateStudentAttendance, getAttendanceStatus } from 'src/utils/attendance-utils';
import AttendanceReportDialog from './AttendanceReportDialog.vue';

type StudentKey = string;

const route = useRoute();
const router = useRouter();
const attendanceStore = useAttendanceStore();
const classStore = useClassStore();
const $q = useQuasar();

const currentClass = ref<ClassModel>();
const currentMeeting = ref<ClassMeetingModel>();
const studentCheckIns = ref<MeetingCheckInModel[]>([]);
const enrolledStudents = computed(() => currentClass.value?.enrolled || []);
const studentsCallStack = ref<StudentEnrollment[]>([]);
const studentsUpdateStack = ref<StudentEnrollment[]>([]);
const isSubmitting = ref(false);
const selectedStatuses = ref<Record<StudentKey, MeetingCheckInModel['status']>>({});
const activeClass = computed(() => {
  if (route.params?.classKey === currentClass.value?.key) {
    return currentClass.value;
  }
  return undefined;
});
const presentCount = computed(() => {
  return studentsWithStatus.value.filter((c) => c.status == 'present').length;
});
const absentCount = computed(() => {
  return studentsWithStatus.value.filter((c) => c.status == 'absent').length;
});
const lateCount = computed(() => {
  return studentsWithStatus.value.filter((c) => c.status == 'late').length;
});
const excusedCount = computed(() => {
  return studentsWithStatus.value.filter((c) => c.status == 'excused').length;
});
onMounted(async () => {
  const meetingKey = route.params.meetingKey as string;
  const classKey = route.params.classKey as string;
  studentsCallStack.value = [];
  if (!meetingKey || !classKey) {
    Notify.create({
      message: 'Invalid meeting or class information',
      color: 'negative',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    });
    void router.push({ name: 'teacherClass', params: { classKey } });
    return;
  }
  if (typeof classKey === 'string') {
    currentClass.value = await classStore.loadClass(classKey);
  }
  currentMeeting.value = await attendanceStore.loadMeeting(meetingKey);
  attendanceStore.streamCheckIns(meetingKey, (checkIns) => {
    studentCheckIns.value = checkIns;
    initializeSelectedStatuses();
  });
});
function randomizeStudents() {
  const students = [...enrolledStudents.value];
  const random: StudentEnrollment[] = [];
  while (students.length) {
    const randomIndex = Math.floor(Math.random() * students.length);
    const [randomStudent] = students.splice(randomIndex, 1);
    random.push(randomStudent!);
  }
  return random;
}

const initializeSelectedStatuses = () => {
  if (!currentMeeting.value) return;

  const statusMap: Record<StudentKey, MeetingCheckInModel['status']> = selectedStatuses.value || {};
  //assume everyone is absent first
  enrolledStudents.value.forEach((student) => {
    if (student.key) {
      statusMap[student.key] = statusMap[student.key] || 'absent';
    }
  });

  if (studentCheckIns.value.length) {
    studentCheckIns.value.forEach((checkIn) => {
      statusMap[checkIn.key] = checkIn.status;
    });
  }
  selectedStatuses.value = statusMap;
};
const studentsWithStatus = computed(() => {
  if (!currentMeeting.value) return [];

  return enrolledStudents.value.map((student) => {
    const studentKey = student.key || '';
    const checkIn = studentCheckIns.value.find((c) => c.key === studentKey);
    return {
      key: studentKey,
      validation: checkIn?.validation || { status: 'unverified' },
      name: student.fullName || 'Unknown Student',
      email: student.email || '',
      avatar: student.avatar,
      reportStatus: student.reportStatus,
      status: selectedStatuses.value[studentKey] || 'check-in',
      checkInTime: checkIn?.checkInTime || '[NO CHECKED-IN]',
      checkInKey: checkIn?.key || student.key || '',
    };
  });
});
function formatDate(dateString: string) {
  try {
    return date.formatDate(dateString, 'MMMM D, YYYY - HH:mm');
  } catch {
    return dateString;
  }
}
async function updateStudentStatus(studentKey: string, status: MeetingCheckInModel['status']) {
  selectedStatuses.value[studentKey] = status;
  if (currentCheckIn.value) {
    currentCheckIn.value.status = status;
  }
  if (!currentClass.value) return;
  const student = await classStore.getClassStudent(currentClass.value.key, studentKey);
  if (!student) {
    console.error(`Student ${studentKey} not found`);
    return;
  }
  studentsUpdateStack.value.push(student);
  const meetings = (
    await attendanceStore.loadClassMeetings(currentClass.value?.key || '', {
      student: studentKey,
    })
  ).filter((m) => m.status == 'concluded');

  const studentStat = calculateStudentAttendance(meetings, studentKey);
  const stats = getAttendanceStatus(
    {
      absentCount: studentStat.absentCount || 0,
      consecutiveAbsent: studentStat.consecutiveAbsent || 0,
      attendanceRate: studentStat.attendanceRate,
      lateCount: studentStat.lateCount || 0,
      maxConsecutiveAbsences: studentStat.maxConsecutiveAbsences || 0,
      presentCount: studentStat.presentCount,
      totalMeetings: studentStat.totalMeetings,
      excusedCount: studentStat.excusedCount,
    },
    student.fullName || '',
    meetings,
    studentKey,
  );

  await classStore.updateStudentStatus({
    class: currentClass.value,
    student: {
      ...student,
      totalAbsences: stats.absentCount,
      consecutiveAbsences: stats.consecutiveAbsent,
      totalTardiness: stats.lateCount,
      reportStatus: stats.status as StudentEnrollment['reportStatus'],
    },
  });
  studentsUpdateStack.value = studentsUpdateStack.value.filter((s) => s.key != student.key);
}
async function saveRollCall(isSubmit: boolean = false) {
  if (isSubmit) {
    if (studentsUpdateStack.value.length > 0) {
      Notify.create({
        message: 'Failed to submit roll call since students updates is in progress',
        color: 'negative',
        icon: 'error',
        position: 'top',
        timeout: 3000,
      });
      return;
    }
    Dialog.create({
      title: 'Submit Roll Call',
      message: 'Are you sure you want to submit this roll call?',
      persistent: true,
      ok: {
        label: 'Yes, Submit',
        color: 'primary',
      },
      cancel: {
        label: 'Cancel',
        flat: true,
      },
    }).onOk(async () => {
      isSubmitting.value = true;
      try {
        await attendanceStore.concludeMeeting(currentMeeting.value?.key || '');
        void router.push({
          name: 'teacherClass',
          params: {
            classKey: route.params.classKey as string,
          },
        });
      } finally {
        isSubmitting.value = false;
      }
    });
  } else {
    try {
      isSubmitting.value = true;
      await attendanceStore.latestCallMeeting(currentMeeting.value?.key || '');
      Notify.create({
        message: 'Roll call saved',
        color: 'green',
        icon: 'check_circle',
        position: 'top',
        timeout: 3000,
      });

      await router.push({
        name: 'teacherClass',
        params: {
          classKey: route.params.classKey as string,
        },
      });
    } catch (error) {
      console.error('Error submitting roll call:', error);
      Notify.create({
        message: 'Failed to submit roll call',
        color: 'negative',
        icon: 'error',
        position: 'top',
        timeout: 3000,
      });
    } finally {
      isSubmitting.value = false;
    }
  }
}
async function overrideValidationForRow(row: ClassMeetingModel) {
  try {
    const reason = await new Promise((resolve) => {
      const d = Dialog.create({
        title: 'Override Validation',
        prompt: { model: '', type: 'text' },
        ok: { label: 'Next' },
        cancel: true,
      });
      d.onOk((val) => resolve(val));
      d.onCancel(() => resolve(null));
    });
    if (reason === null) return;
    const confirmed = await new Promise((resolve) => {
      const d2 = Dialog.create({
        title: 'Select Validation',
        message: 'Choose the validation status for this check-in',
        ok: { label: 'Valid', color: 'green' },
        cancel: { label: 'Invalid', color: 'red' },
      });
      d2.onOk(() => resolve(true));
      d2.onCancel(() => resolve(false));
    });
    const status = confirmed ? 'valid' : 'invalid';
    await attendanceStore.updateCheckInValidation({
      meetingKey: currentMeeting.value?.key || '',
      checkInKey: row.key,
      status,
      reason: reason as string,
    });
    currentMeeting.value = await attendanceStore.loadMeeting(currentMeeting.value?.key || '');
    Notify.create({ message: 'Override applied' });
  } catch (err) {
    console.error('Override failed', err);
    Notify.create({ message: 'Override failed', color: 'negative' });
  }
}
function cancelRollCall() {
  void router.push({
    name: 'teacherClass',
    params: {
      classKey: route.params.classKey as string,
    },
  });
}
//roll-call dialog states
const showDialog = ref(false);
const skipPresent = ref(true);
const currentStudent = ref<StudentEnrollment>();
const currentCheckIn = ref<MeetingCheckInModel>();
function selectNextStudent(reverse?: boolean) {
  let nextIndex = 0;

  // Find starting point
  if (currentStudent.value) {
    nextIndex =
      studentsCallStack.value.findIndex((s) => s.key == currentStudent.value?.key) +
      (reverse ? -1 : 1);
  }
  nextIndex = nextIndex >= 0 ? nextIndex : 0;
  // Get next student in sequence
  if (nextIndex < studentsCallStack.value.length) {
    const student = studentsCallStack.value[nextIndex];
    if (student) {
      currentStudent.value = { ...student };
      currentCheckIn.value = studentCheckIns.value.find((c) => c.key == student.key);
    } else {
      currentStudent.value = undefined;
      showDialog.value = false;
    }
  } else {
    // No more students
    currentStudent.value = undefined;
    showDialog.value = false;
  }
}
function onCallStatus(student: string, status: MeetingCheckInModel['status'] | 'later' | 'back') {
  if (!currentStudent.value) return;
  switch (status) {
    case 'absent':
    case 'check-in':
    case 'late':
    case 'present':
    case 'excused':
      selectNextStudent();
      updateStudentStatus(student, status);
      break;
    case 'back':
      selectNextStudent(true);
      break;
    case 'later':
    default:
      selectNextStudent();
      break;
  }
}
function startRollCall() {
  studentsCallStack.value = randomizeStudents();
  if (skipPresent.value) {
    studentsCallStack.value = studentsCallStack.value.filter(
      (s) => selectedStatuses.value[s.key] !== 'present',
    );
  }
  selectNextStudent();
  if (currentStudent.value && activeClass.value) {
    showDialog.value = true;
  } else {
    Notify.create({
      message: 'All Students are marked',
      color: 'info',
      icon: 'info',
      position: 'center',
      timeout: 3000,
    });
  }
}
function cancelMeeting(meeting: ClassMeetingModel) {
  $q.notify({
    timeout: 0,
    color: 'secondary',
    textColor: 'primary',
    position: 'center',
    message: 'Cancel meeting',
    caption: `Date: ${meeting.date}`,
    actions: [
      {
        label: 'Proceed',
        icon: 'arrow_circle_right',
        handler: async () => {
          await attendanceStore.cancelMeeting(meeting.key);
        },
      },
      { label: 'Abort', icon: 'cancel' },
    ],
  });
}
const showAttendanceReport = ref(false);
const concludedMeetings = ref<ClassMeetingModel[]>([]);
async function analyzeStudent(studentKey: string) {
  showAttendanceReport.value = false;
  if (!activeClass.value) return;
  const student = await classStore.getClassStudent(activeClass.value.key, studentKey);
  if (!student) return;
  currentStudent.value = student;
  concludedMeetings.value = (
    await attendanceStore.loadClassMeetings(activeClass.value.key, {
      student: student.key,
    })
  ).filter((m) => m.status == 'concluded');
  showAttendanceReport.value = true;
}
</script>

<template>
  <q-page padding>
    <div class="q-pa-md">
      <q-card v-if="currentMeeting">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">Roll Call: {{ activeClass?.name }} {{ activeClass?.section }}</div>
          <div class="text-subtitle1">{{ formatDate(currentMeeting.date) }}</div>
          <q-badge
            :color="
              currentMeeting.status === 'open'
                ? 'green'
                : currentMeeting.status === 'cancelled'
                  ? 'red'
                  : 'blue'
            "
          >
            {{ currentMeeting.status }}
          </q-badge>
          <q-chip dense icon="verified_user">{{ presentCount }}</q-chip>
          <q-chip dense icon="cancel">{{ absentCount }}</q-chip>
          <q-chip dense icon="schedule">{{ lateCount }}</q-chip>
          <q-chip dense icon="sick">{{ excusedCount }}</q-chip>
          <q-btn dense class="q-m-sm" icon="delete" @click="cancelMeeting(currentMeeting)"
            >Cancel Meeting</q-btn
          >
        </q-card-section>

        <q-card-section>
          <div class="text-h6 q-mb-md">Student Attendance</div>

          <q-table
            :rows="studentsWithStatus"
            :columns="[
              { name: 'avatar', label: '', field: 'avatar' },
              { name: 'name', label: 'Student Name', field: 'name', align: 'left', sortable: true },
              { name: 'checkInTime', label: 'Check-in Time', field: 'checkInTime', align: 'left' },
              { name: 'status', label: 'Status', field: 'status', align: 'center' },
              { name: 'validation', label: 'Validation', field: 'validation', align: 'center' },
            ]"
            row-key="key"
            :pagination="{ rowsPerPage: 0 }"
            :grid="$q.screen.sm || $q.screen.lt.sm"
          >
            <template v-slot:body-cell-avatar="props">
              <q-td :props="props">
                <q-avatar size="md">
                  <img
                    :src="props.row?.avatar || 'https://cdn.quasar.dev/img/avatar.png'"
                    :alt="(props.row?.fullName || '0')?.charAt(0).toUpperCase()"
                  />
                </q-avatar>
              </q-td>
            </template>
            <template v-slot:body-cell-status="props">
              <q-td :props="props" class="q-gutter-sm">
                <q-btn-toggle
                  v-model="selectedStatuses[props.row.key]"
                  toggle-color="primary"
                  clearable
                  toggle-text-color="black"
                  :options="[
                    { label: 'Present', value: 'present', color: 'green' },
                    { label: 'Late', value: 'late', color: 'orange' },
                    { label: 'Excuse', value: 'excused', color: 'green-9' },
                    { label: 'Absent', value: 'absent', color: 'red' },
                  ]"
                  @update:model-value="updateStudentStatus(props.row.key, $event)"
                />
              </q-td>
            </template>
            <template v-slot:body-cell-validation="props">
              <q-td :props="props" class="q-gutter-sm">
                <q-badge
                  :color="
                    props.row.validation?.status === 'valid'
                      ? 'green'
                      : props.row.validation?.status === 'invalid'
                        ? 'red'
                        : 'grey'
                  "
                >
                  {{ props.row.validation?.status || 'unverified' }}
                </q-badge>
                <q-btn
                  flat
                  small
                  dense
                  icon="replay"
                  @click.stop.prevent="
                    attendanceStore.validateCheckIn(currentMeeting.key, props.row.key)
                  "
                />
                <q-btn
                  flat
                  small
                  dense
                  icon="edit"
                  @click.stop.prevent="overrideValidationForRow(props.row)"
                />
              </q-td>
            </template>
            <template v-slot:item="props">
              <div class="q-pa-xs col-12 grid-style-transition">
                <q-card
                  bordered
                  flat
                  :class="props.selected ? ($q.dark.isActive ? 'bg-grey-9' : 'bg-grey-2') : ''"
                >
                  <q-card-section @click="analyzeStudent(props.row)">
                    <q-avatar size="md" color="primary" text-color="white">
                      <img
                        v-if="props.row.avatar"
                        :src="props.row.avatar"
                        :alt="props.row.name ? props.row.name[0] : 'S'"
                      />
                      <span v-else>
                        {{ props.row.name ? props.row.name[0] : 'S' }}
                      </span>
                    </q-avatar>
                    {{ props.row.name }}
                    <q-badge v-if="props.row.reportStatus">
                      {{ props.row.reportStatus }}
                    </q-badge>
                  </q-card-section>
                  <q-separator />
                  <q-list dense>
                    <q-item
                      v-for="col in props.cols.filter(
                        (col: any) => col.name !== 'name' && col.name !== 'avatar',
                      )"
                      :key="col.name"
                    >
                      <q-item-section>
                        <q-item-label>{{ col.label }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-item-label caption>{{ col.value }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                  <q-card-actions align="center">
                    <q-btn-toggle
                      spread
                      dense
                      class="full-width"
                      v-model="selectedStatuses[props.row.key]"
                      toggle-color="primary"
                      clearable
                      toggle-text-color="black"
                      :options="[
                        { label: 'Absent', value: 'absent', color: 'red' },
                        { label: 'Late', value: 'late', color: 'orange' },
                        { label: 'Excuse', value: 'excused', color: 'green-9' },
                        { label: 'Present', value: 'present', color: 'green' },
                      ]"
                      @update:model-value="updateStudentStatus(props.row.key, $event)"
                    />
                  </q-card-actions>
                </q-card>
              </div>
            </template>
          </q-table>
        </q-card-section>

        <q-card-actions align="right">
          <q-toggle v-model="skipPresent">
            <span v-if="$q.screen.gt.sm">Skip Present</span>
            <q-tooltip v-else>Skip Present</q-tooltip>
          </q-toggle>
          <q-space />
          <q-btn
            color="negative"
            :label="$q.screen.gt.sm ? 'Back' : ''"
            :icon="$q.screen.gt.sm ? undefined : 'close'"
            :disable="isSubmitting"
            @click="cancelRollCall"
          />
          <q-btn color="orange" label="Save" :loading="isSubmitting" @click="saveRollCall(false)" />
          <q-btn
            color="primary"
            label="Submit"
            class="q-mr-lg"
            :loading="isSubmitting"
            @click="saveRollCall(true)"
          />
          <q-btn
            icon="play_arrow"
            class="fixed-bottom-right q-mr-xs q-mb-xs"
            round
            color="primary"
            @click="startRollCall"
          ></q-btn>
        </q-card-actions>
      </q-card>

      <div v-else class="text-center q-pa-xl">
        <q-spinner-dots color="primary" size="40px" />
        <div class="q-mt-md">Loading roll call data...</div>
      </div>
    </div>
    <RollCallDialog
      v-if="activeClass && currentStudent && currentMeeting"
      v-model="showDialog"
      :current-student="currentStudent"
      :target-meeting="currentMeeting"
      :target-class="activeClass"
      :current-check-in="currentCheckIn"
      @call-status="onCallStatus"
    />
    <q-page-sticky
      class="z-max"
      position="bottom-left"
      v-if="studentsUpdateStack.length > 0"
      :offset="[18, 18]"
    >
      <q-badge>Updating {{ studentsUpdateStack.length }} Students</q-badge>
    </q-page-sticky>
    <template v-if="activeClass && currentStudent">
      <AttendanceReportDialog
        v-model="showAttendanceReport"
        :target-class="activeClass"
        :current-student="currentStudent"
        :all-meetings="concludedMeetings"
      />
    </template>
  </q-page>
</template>
