<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="col">
        <h5>Attendance Reporting Dashboard</h5>
        <div class="text-subtitle2">Per-student attendance summary</div>
      </div>
      <div class="col-auto">
        <q-btn label="Export CSV" @click="exportCsv" icon="download" color="primary" />
      </div>
    </div>

    <div class="row q-gutter-md">
      <div class="col-12 col-md-4">
        <q-card>
          <q-card-section>
            <div class="text-h6">Filters</div>
            <div class="text-caption">Limit dataset by section and date range</div>
          </q-card-section>

          <q-card-section>
            <q-input filled v-model="sectionModel" label="Section (optional)" dense />
            <div class="row q-col-gutter-sm q-mt-sm">
              <div class="col-6">
                <q-input filled v-model="dateFromModel" label="From (YYYY-MM-DD)" mask="####-##-##" dense />
              </div>
              <div class="col-6">
                <q-input filled v-model="dateToModel" label="To (YYYY-MM-DD)" mask="####-##-##" dense />
              </div>
            </div>

            <div class="row q-gutter-sm q-mt-sm">
              <q-btn label="Apply" @click="loadData" color="primary" class="q-mr-sm" />
              <q-btn outline label="Reset" @click="resetFilters" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-8">
        <q-card>
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-h6">Class Summary</div>
              <div class="text-caption">Showing {{ summaries.length }} students</div>
            </div>
            <div class="text-right">
              <div>Total sessions in range: <strong>{{ totalSessionsInRange }}</strong></div>
              <div>Class average presence: <strong>{{ classAveragePresence.toFixed(2) }}%</strong></div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section style="min-height: 280px;">
            <canvas id="presenceChart" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-separator spaced />

    <q-table
      :columns="columns"
      :rows="summaries"
      row-key="studentId"
      class="q-mt-md"
      :rows-per-page-options="[5,10,20,50]"
    >
      <template v-slot:top-right>
        <q-input dense debounce="300" v-model="tableFilter" placeholder="Search student..." />
      </template>

      <template v-slot:body-cell-presencePercent="props">
        <q-td :props="props">
          <q-badge :label="props.row.presencePercent + '%'" :color="props.row.presencePercent >= threshold ? 'positive' : 'negative'" />
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn dense flat round icon="info" @click="viewStudentDetail(props.row)" />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import { fetchStudents, fetchAttendanceRecords, computeSummaries, type StudentSummary } from "src/services/attendanceService";

/* Chart.js registration */
import {
  Chart,
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

let chartInstance: Chart | null = null;

export default defineComponent({
  name: "ReportingDashboard",
  setup() {
    const sectionModel = ref<string | null>(null);
    const dateFromModel = ref<string | null>(null); // YYYY-MM-DD or null
    const dateToModel = ref<string | null>(null);

    const summaries = ref<StudentSummary[]>([]);
    const totalSessionsInRange = ref<number>(0);
    const classAveragePresence = ref<number>(0);
    const tableFilter = ref("");
    const threshold = 75;

    const columns = [
      { name: "student", label: "Student", field: (r: any) => r.name ?? r.studentId, sortable: true },
      { name: "totalSessions", label: "Total Sessions", field: "totalSessions", sortable: true },
      { name: "presentCount", label: "Present", field: "presentCount", sortable: true },
      { name: "absentCount", label: "Absent", field: "absentCount", sortable: true },
      { name: "presencePercent", label: "Presence %", field: "presencePercent", sortable: true },
      { name: "actions", label: "Actions", field: "actions" }
    ];

    async function loadData() {
      try {
        // convert models to either Date or undefined
        const dateFrom = dateFromModel.value ? new Date(dateFromModel.value) : undefined;
        const dateTo = dateToModel.value ? new Date(dateToModel.value) : undefined;
        // convert section to string | undefined (null -> undefined)
        const section = sectionModel.value ?? undefined;

        // fetch students and attendance
        const students = await fetchStudents(section);
        const attendance = await fetchAttendanceRecords({ section: section, dateFrom: dateFrom, dateTo: dateTo });

        const s = computeSummaries(students, attendance);
        summaries.value = s.sort((a, b) => b.presencePercent - a.presencePercent);

        totalSessionsInRange.value = attendance.length ? new Set(attendance.map(r => r.sessionId ?? r.id ?? "__s")).size : 0;
        classAveragePresence.value = summaries.value.length ? (summaries.value.reduce((acc, x) => acc + x.presencePercent, 0) / summaries.value.length) : 0;

        renderChart();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error loading reporting data", err);
        // In Quasar app you might prefer Notify
        alert("Error loading data: see console");
      }
    }

    function resetFilters() {
      sectionModel.value = null;
      dateFromModel.value = null;
      dateToModel.value = null;
      loadData();
    }

    function exportCsv() {
      const rows = [
        ["studentId", "name", "totalSessions", "presentCount", "absentCount", "lateCount", "presencePercent"],
        ...summaries.value.map(r => [r.studentId, r.name ?? "", r.totalSessions, r.presentCount, r.absentCount, r.lateCount, r.presencePercent])
      ];
      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-summary-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    function viewStudentDetail(row: StudentSummary) {
      // small stub; replace with router push or modal if desired
      alert(`${row.name} — Presence: ${row.presencePercent}%\nPresent: ${row.presentCount}, Absent: ${row.absentCount}`);
    }

    function renderChart() {
      const el = document.getElementById("presenceChart") as HTMLCanvasElement | null;
      if (!el) return;
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      const top = summaries.value.slice(0, 10);
      const labels = top.map(s => s.name || s.studentId);
      const data = top.map(s => s.presencePercent);

      chartInstance = new Chart(el, {
        type: "bar",
        data: {
          labels,
          datasets: [
            { label: "Presence % (Top 10)", data }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, max: 100 }
          }
        }
      });
    }

    onMounted(() => {
      loadData();
    });

    return {
      sectionModel, dateFromModel, dateToModel, summaries, columns, tableFilter,
      loadData, resetFilters, exportCsv, viewStudentDetail,
      totalSessionsInRange, classAveragePresence, threshold
    };
  }
});
</script>

<style scoped>
#presenceChart { width: 100%; height: 280px; display: block; }
</style>
