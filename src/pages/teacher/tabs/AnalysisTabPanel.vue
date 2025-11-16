<script setup lang="ts">
import { ClassModel } from 'src/models/class.models';
import { ClassMeetingModel } from 'src/models/attendance.models';
import { useAttendanceStore } from 'src/stores/attendance-store';
import { computed, ref, onUnmounted } from 'vue';

const props = defineProps<{
  name: string;
  cls: ClassModel;
}>();

const attendanceStore = useAttendanceStore();
const attendanceHistory = ref<ClassMeetingModel[]>([]);

// Stream attendance history
if (props.cls.key) {
  const unsubscribe = attendanceStore.streamClassMeetings(props.cls.key, {
    loadAllCheckIns: true,
    onSnapshot(meetings: ClassMeetingModel[]) {
      attendanceHistory.value = meetings;
    },
  });
  onUnmounted(() => {
    unsubscribe();
  });
}

function getAttendanceColor(rate: number): string {
  if (rate >= 80) return 'green';
  if (rate >= 60) return 'orange';
  return 'red';
}

// Compute attendance statistics
const attendanceStats = computed(() => {
  const meetings = attendanceHistory.value;
  const students = props.cls?.enrolled || [];

  if (meetings.length === 0 || students.length === 0) {
    return {
      totalMeetings: 0,
      averageAttendanceRate: 0,
      totalPresent: 0,
      totalAbsent: 0,
      totalLate: 0,
      studentStats: [],
    };
  }

  const studentStats: Array<{
    name: string;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendanceRate: number;
    maxConsecutiveAbsences: number;
  }> = [];

  students.forEach((student) => {
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let consecutiveAbsent = 0;
    let maxConsecutiveAbsences = 0;

    meetings
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((meeting: ClassMeetingModel, index) => {
        const checkIn = meeting.checkIns?.find((ci) => ci.key === student.ownerKey);
        if (checkIn) {
          if (checkIn.status === 'present' || checkIn.status === 'check-in') {
            presentCount++;
          } else if (checkIn.status === 'absent') {
            absentCount++;
            consecutiveAbsent++;
          } else if (checkIn.status === 'late') {
            lateCount++;
            presentCount++;
          }
        } else {
          absentCount++;
          consecutiveAbsent++;
        }
        if (
          ((checkIn && checkIn?.status != 'absent') || index + 1 == meetings.length) &&
          consecutiveAbsent
        ) {
          maxConsecutiveAbsences = Math.max(maxConsecutiveAbsences, consecutiveAbsent);
          consecutiveAbsent = 0;
        }
      });

    const attendanceRate =
      meetings.length > 0 ? Math.round(((presentCount + lateCount) / meetings.length) * 100) : 0;

    studentStats.push({
      name: student.fullName || 'Unknown',
      presentCount,
      absentCount,
      lateCount,
      attendanceRate,
      maxConsecutiveAbsences: maxConsecutiveAbsences > 1 ? maxConsecutiveAbsences : 0,
    });
  });

  const totalPresent = studentStats.reduce((sum, s) => sum + s.presentCount, 0);
  const totalAbsent = studentStats.reduce((sum, s) => sum + s.absentCount, 0);
  const totalLate = studentStats.reduce((sum, s) => sum + s.lateCount, 0);

  const averageAttendanceRate =
    studentStats.length > 0
      ? Math.round(studentStats.reduce((sum, s) => sum + s.attendanceRate, 0) / studentStats.length)
      : 0;

  return {
    totalMeetings: meetings.length,
    averageAttendanceRate,
    totalPresent,
    totalAbsent,
    totalLate,
    studentStats,
  };
});
</script>

<template>
  <q-tab-panel :name="name" class="q-pa-md">
    <div class="row q-col-gutter-md q-mb-lg">
      <!-- Summary Cards -->
      <div class="col-xs-12 col-sm-6 col-md-3">
        <q-card class="bg-blue-1">
          <q-card-section>
            <div class="text-h6">Total Meetings</div>
            <div class="text-h4 text-blue">{{ attendanceStats.totalMeetings }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-xs-12 col-sm-6 col-md-3">
        <q-card class="bg-green-1">
          <q-card-section>
            <div class="text-h6">Avg Attendance</div>
            <div class="text-h4 text-green">{{ attendanceStats.averageAttendanceRate }}%</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-xs-12 col-sm-6 col-md-3">
        <q-card class="bg-orange-1">
          <q-card-section>
            <div class="text-h6">Total Present</div>
            <div class="text-h4 text-orange">{{ attendanceStats.totalPresent }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-xs-12 col-sm-6 col-md-3">
        <q-card class="bg-red-1">
          <q-card-section>
            <div class="text-h6">Total Absent</div>
            <div class="text-h4 text-red">{{ attendanceStats.totalAbsent }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Student Attendance Details Table -->
    <q-card>
      <q-card-section>
        <div class="text-h6">Student Attendance Summary</div>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-pa-none">
        <q-table
          :rows="attendanceStats.studentStats"
          :columns="[
            { name: 'name', label: 'Student Name', field: 'name', align: 'left' },
            { name: 'present', label: 'Present', field: 'presentCount', align: 'center' },
            {
              name: 'absent',
              label: 'Consecutive',
              field: 'maxConsecutiveAbsences',
              align: 'center',
            },
            { name: 'absent', label: 'Absent', field: 'absentCount', align: 'center' },
            { name: 'late', label: 'Late', field: 'lateCount', align: 'center' },
            { name: 'rate', label: 'Attendance Rate', field: 'attendanceRate', align: 'center' },
          ]"
          row-key="name"
          flat
          bordered
        >
          <template #body-cell-rate="props">
            <q-td :props="props">
              <q-linear-progress
                :value="props.row.attendanceRate / 100"
                :color="getAttendanceColor(props.row.attendanceRate)"
                class="q-my-sm"
              />
              <span>{{ props.row.attendanceRate }}%</span>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-tab-panel>
</template>

<style scoped>
.bg-blue-1 {
  background-color: #e3f2fd;
}

.bg-green-1 {
  background-color: #e8f5e9;
}

.bg-orange-1 {
  background-color: #fff3e0;
}

.bg-red-1 {
  background-color: #ffebee;
}

.text-blue {
  color: #1976d2;
}

.text-green {
  color: #388e3c;
}

.text-orange {
  color: #f57c00;
}

.text-red {
  color: #d32f2f;
}
</style>
