<template>
  <q-page class="q-pa-md">
    <!-- ENTER CLASS CODE -->
    <q-card class="q-pa-md q-mb-lg">
      <div class="row items-center q-col-gutter-md">
        <div class="col-8">
          <q-input filled v-model="classCode" label="Enter Class Code" />
        </div>
        <div class="col-4">
          <q-btn label="Load Class" color="primary" class="full-width" @click="loadClass()" />
        </div>
      </div>
    </q-card>

    <!-- SHOW ONLY IF CLASS IS LOADED -->
    <div v-if="cls">
      <!-- FILTER BUTTONS -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-4">
          <q-card
            class="filter-card"
            :class="{ active: filterRange === 'week' }"
            @click="setFilter('week')"
          >
            <q-card-section class="text-center flex flex-center column">
              <q-icon name="event" size="30px" class="q-mb-sm" />
              <div class="text-subtitle1">Week</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-4">
          <q-card
            class="filter-card"
            :class="{ active: filterRange === 'month' }"
            @click="setFilter('month')"
          >
            <q-card-section class="text-center flex flex-center column">
              <q-icon name="calendar_month" size="30px" class="q-mb-sm" />
              <div class="text-subtitle1">Month</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-4">
          <q-card
            class="filter-card"
            :class="{ active: filterRange === 'semester' }"
            @click="setFilter('semester')"
          >
            <q-card-section class="text-center flex flex-center column">
              <q-icon name="school" size="30px" class="q-mb-sm" />
              <div class="text-subtitle1">Semester</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- WEEK SELECTOR -->
      <div v-if="filterRange === 'week'" class="q-mb-md">
        <q-select
          filled
          label="Select Week"
          v-model="selectedWeek"
          :options="weekOptions"
          style="max-width: 160px"
        />
      </div>

      <!-- MONTH + YEAR SIDE-BY-SIDE -->
      <div
        v-if="filterRange === 'month'"
        class="row q-col-gutter-md q-mb-md"
        style="max-width: 340px"
      >
        <div class="col">
          <q-select filled label="Select Month" v-model="selectedMonth" :options="monthOptions" />
        </div>

        <div class="col">
          <q-select filled label="Select Year" v-model="selectedYear" :options="yearOptions" />
        </div>
      </div>

      <!-- TOTAL MEETINGS DISPLAY (NOW USING ALL ATTENDANCE) -->
      <div class="text-h6 q-mb-md">Total Meetings: {{ attendanceHistory.length }}</div>

      <!-- TABLE -->
      <q-card>
        <q-card-section>
          <div class="text-h6">Attendance Summary ({{ filterRange.toUpperCase() }})</div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-none">
          <q-table
            :rows="attendanceStats.studentStats"
            :columns="columns"
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
                {{ props.row.attendanceRate }}%
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAttendanceStore } from 'src/stores/attendance-store';
import { calculateStudentAttendance } from 'src/utils/attendance-utils';
import { useClassStore } from 'src/stores/class-store';

function toValidDate(str: string) {
  return new Date(str.replace(/\//g, '-').replace(' ', 'T'));
}

const $q = useQuasar();
const attendanceStore = useAttendanceStore();
const classStore = useClassStore();

const classCode = ref('');
const cls = ref<any>(null);
const attendanceHistory = ref<any[]>([]);

let unsubscribe: any = null;

async function loadClass() {
  const code = classCode.value.trim();
  if (!code) {
    $q.notify({ type: 'negative', message: 'Enter class code!' });
    return;
  }

  const found = await classStore.findClassByCode(code);

  if (!found) {
    $q.notify({ type: 'negative', message: 'Class not found!' });
    cls.value = null;
    return;
  }

  const loadedClass = await classStore.loadClass(found.key);

  if (!loadedClass) {
    $q.notify({ type: 'negative', message: 'Failed to load class data!' });
    return;
  }

  cls.value = loadedClass;

  if (unsubscribe) unsubscribe();

  unsubscribe = attendanceStore.streamClassMeetings(loadedClass.key, {
    loadAllCheckIns: true,
    onSnapshot(meetings) {
      attendanceHistory.value = meetings;
    },
  });
}

const filterRange = ref<'week' | 'month' | 'semester'>('week');
const setFilter = (r: 'week' | 'month' | 'semester') => {
  filterRange.value = r;
};

const selectedWeek = ref(1);
const weekOptions = [
  { label: '1st Week', value: 1 },
  { label: '2nd Week', value: 2 },
  { label: '3rd Week', value: 3 },
  { label: '4th Week', value: 4 },
];

const selectedMonth = ref(new Date().getMonth());
const monthOptions = [
  { label: 'January', value: 0 },
  { label: 'February', value: 1 },
  { label: 'March', value: 2 },
  { label: 'April', value: 3 },
  { label: 'May', value: 4 },
  { label: 'June', value: 5 },
  { label: 'July', value: 6 },
  { label: 'August', value: 7 },
  { label: 'September', value: 8 },
  { label: 'October', value: 9 },
  { label: 'November', value: 10 },
  { label: 'December', value: 11 },
];

const selectedYear = ref(new Date().getFullYear());
const yearOptions = [
  { label: '2023', value: 2023 },
  { label: '2024', value: 2024 },
  { label: '2025', value: 2025 },
  { label: '2026', value: 2026 },
];

const filteredMeetings = computed(() => {
  const all = attendanceHistory.value;

  if (filterRange.value === 'month') {
    return all.filter((m) => {
      const d = toValidDate(m.date);
      return d.getMonth() === selectedMonth.value && d.getFullYear() === selectedYear.value;
    });
  }

  if (filterRange.value === 'week') {
    let startDay = 1;
    let endDay = 7;

    if (selectedWeek.value === 2) {
      startDay = 8;
      endDay = 14;
    } else if (selectedWeek.value === 3) {
      startDay = 15;
      endDay = 22;
    } else if (selectedWeek.value === 4) {
      startDay = 23;
      endDay = 31;
    }

    return all.filter((m) => {
      const d = toValidDate(m.date);
      if (d.getMonth() !== selectedMonth.value) return false;
      if (d.getFullYear() !== selectedYear.value) return false;
      return d.getDate() >= startDay && d.getDate() <= endDay;
    });
  }

  if (filterRange.value === 'semester') {
    const semStart = new Date('2025-06-01');
    const semEnd = new Date('2025-10-31');

    return all.filter((m) => {
      const d = toValidDate(m.date);
      return d >= semStart && d <= semEnd;
    });
  }

  return all;
});

void filteredMeetings.value;

type Column = {
  name: string;
  label: string;
  field: string | ((row: any) => any);
  align?: 'left' | 'center' | 'right';
};

const columns: Column[] = [
  { name: 'name', label: 'Student Name', field: 'name', align: 'left' },
  { name: 'total', label: 'Total Meetings', field: 'totalMeetings', align: 'center' },
  { name: 'present', label: 'Present', field: 'presentCount', align: 'center' },
  { name: 'absent', label: 'Absent', field: 'absentCount', align: 'center' },
  { name: 'rate', label: 'Attendance Rate', field: 'attendanceRate', align: 'center' },
];

function getAttendanceColor(rate: number) {
  if (rate >= 80) return 'green';
  if (rate >= 60) return 'orange';
  return 'red';
}

const attendanceStats = computed(() => {
  if (!cls.value) return { studentStats: [] };

  const students = cls.value.enrolled || [];

  // 🔥 NOW ALWAYS USE ALL MEETINGS
  const meetings = attendanceHistory.value;
  const totalMeetings = meetings.length;

  const studentStats = students.map((student: any) => {
    // 🔥 CALCULATE USING ALL MEETINGS (NOT FILTERED)
    const stats = calculateStudentAttendance(meetings, student.ownerKey);

    return {
      name: student.fullName,
      totalMeetings,
      presentCount: stats.presentCount,
      absentCount: stats.absentCount,
      attendanceRate: stats.attendanceRate,
    };
  });

  return { studentStats };
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});
</script>

<style scoped>
.filter-card {
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.25s ease;
  background-color: #fbfafa;
  border-radius: 12px;
  transform: scale(1);
}

.filter-card:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
}

.filter-card.active {
  border-color: #1976d2;
  background-color: #e3f2fd;
  transform: scale(1.05);
  box-shadow: 0 6px 18px rgba(25, 118, 210, 0.3);
}
</style>
