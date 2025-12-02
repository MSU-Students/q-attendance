<script setup lang="ts">
import { ref } from 'vue';
import { fetchStudents, fetchAttendanceRecords, computeSummaries, StudentSummary } from 'src/services/attendanceService';

const section = ref('');
const dateFrom = ref<string>('');
const dateTo = ref<string>('');

const summaries = ref<StudentSummary[]>([]);
const totalSessions = ref(0);
const totalPresent = ref(0);
const totalAbsent = ref(0);
const avgPresence = ref(0);

const applyFilter = async () => {
  if (!section.value) {
    alert('Please enter a section');
    return;
  }

  // Convert date strings to Date objects
  const from = dateFrom.value ? new Date(dateFrom.value) : undefined;
  const to = dateTo.value ? new Date(dateTo.value) : undefined;

  try {
    const students = await fetchStudents(section.value);
    const attendance = await fetchAttendanceRecords({
      section: section.value,
      dateFrom: from,
      dateTo: to
    });

    const computed = computeSummaries(students, attendance);
    summaries.value = computed.sort((a, b) => b.presencePercent - a.presencePercent);

    // Compute overall stats
    totalSessions.value = computed.reduce((acc, s) => acc + s.totalSessions, 0);
    totalPresent.value = computed.reduce((acc, s) => acc + s.presentCount, 0);
    totalAbsent.value = computed.reduce((acc, s) => acc + s.absentCount, 0);
    avgPresence.value = computed.length > 0 ? (totalPresent.value / totalSessions.value) * 100 : 0;

  } catch (err) {
    console.error(err);
    alert('Error fetching data. Make sure section exists and dates are valid.');
  }
};
</script>

<template>
  <div class="reporting-dashboard q-pa-md">
    <h2>Class Summary</h2>
    
    <div class="filters q-mb-md row items-center">
      <q-input v-model="section" label="Section" outlined class="q-mr-md" />
      <q-input v-model="dateFrom" type="date" label="Date From" outlined class="q-mr-md" />
      <q-input v-model="dateTo" type="date" label="Date To" outlined class="q-mr-md" />
      <q-btn label="Apply" color="primary" @click="applyFilter" />
    </div>

    <div v-if="summaries.length === 0">
      <p>No attendance data found for this filter.</p>
    </div>

    <div v-else>
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="row q-gutter-md">
            <div>Total Sessions: {{ totalSessions }}</div>
            <div>Total Present: {{ totalPresent }}</div>
            <div>Total Absent: {{ totalAbsent }}</div>
            <div>Avg Presence: {{ avgPresence.toFixed(2) }}%</div>
          </div>
        </q-card-section>
      </q-card>

      <q-table
        title="Student Attendance Summary"
        :rows="summaries"
        row-key="studentId"
        flat
      >
        <template v-slot:header>
          <q-tr>
            <q-th>Name</q-th>
            <q-th>Total Sessions</q-th>
            <q-th>Present</q-th>
            <q-th>Absent</q-th>
            <q-th>Late</q-th>
            <q-th>Presence %</q-th>
          </q-tr>
        </template>

        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td>{{ props.row.name }}</q-td>
            <q-td>{{ props.row.totalSessions }}</q-td>
            <q-td>{{ props.row.presentCount }}</q-td>
            <q-td>{{ props.row.absentCount }}</q-td>
            <q-td>{{ props.row.lateCount }}</q-td>
            <q-td>{{ props.row.presencePercent.toFixed(2) }}%</q-td>
          </q-tr>
        </template>
      </q-table>
    </div>
  </div>
</template>

<style scoped>
.reporting-dashboard {
  max-width: 900px;
  margin: 0 auto;
}
.filters {
  flex-wrap: wrap;
}
</style>
