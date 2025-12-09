<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import ApexCharts from 'apexcharts';

interface StudentStat {
  name: string;
  attendanceRate: number;
}

const props = defineProps<{
  studentStats: StudentStat[];
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  averageAttendanceRate: number;
}>();

const barEl = ref<HTMLElement | null>(null);
const donutEl = ref<HTMLElement | null>(null);
let barChart: ApexCharts | null = null;
let donutChart: ApexCharts | null = null;

function renderBar() {
  if (!barEl.value) return;

  const categories = props.studentStats.map((s) => s.name);
  const series = [
    {
      name: 'Attendance Rate',
      data: props.studentStats.map((s) => s.attendanceRate),
    },
  ];

  const options: ApexCharts.ApexOptions = {
    chart: { type: 'bar', height: 260, toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 6, horizontal: false } },
    dataLabels: { enabled: false },
    xaxis: { categories, labels: { rotate: -15 } },
    yaxis: { max: 100, labels: { formatter: (val) => `${Math.round(Number(val))}%` } },
    tooltip: { y: { formatter: (val) => `${val}%` } },
    series,
    colors: ['#1976d2'],
  };

  if (barChart) {
    barChart.updateOptions(options);
    return;
  }

  barChart = new ApexCharts(barEl.value, options);
  barChart.render();
}

function renderDonut() {
  if (!donutEl.value) return;

  const options: ApexCharts.ApexOptions = {
    chart: { type: 'donut', height: 260 },
    series: [props.totalPresent, props.totalAbsent, props.totalLate],
    labels: ['Present', 'Absent', 'Late'],
    colors: ['#388e3c', '#d32f2f', '#f57c00'],
    legend: { position: 'bottom' },
    responsive: [
      {
        breakpoint: 480,
        options: { chart: { height: 220 }, legend: { position: 'bottom' } },
      },
    ],
  };

  if (donutChart) {
    donutChart.updateOptions(options);
    donutChart.updateSeries([props.totalPresent, props.totalAbsent, props.totalLate]);
    return;
  }

  donutChart = new ApexCharts(donutEl.value, options);
  donutChart.render();
}

onMounted(() => {
  renderBar();
  renderDonut();
});

onBeforeUnmount(() => {
  barChart?.destroy();
  donutChart?.destroy();
  barChart = null;
  donutChart = null;
});

watch(
  () => [props.studentStats, props.totalPresent, props.totalAbsent, props.totalLate],
  () => {
    renderBar();
    renderDonut();
  },
  { deep: true }
);
</script>

<template>
  <div class="row q-col-gutter-md">
    <div class="col-xs-12 col-md-8">
      <q-card>
        <q-card-section>
          <div class="text-h6">Attendance by Student</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div ref="barEl" />
        </q-card-section>
      </q-card>
    </div>

    <div class="col-xs-12 col-md-4">
      <q-card>
        <q-card-section>
          <div class="text-h6">Class Summary</div>
          <div class="text-subtitle2">Avg {{ props.averageAttendanceRate }}%</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div ref="donutEl" />
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<style scoped>
/* Ensure ApexCharts has space */
div[ref] {
  min-height: 220px;
}
</style>
