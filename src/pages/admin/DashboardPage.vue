<script setup lang="ts">
import ApexCharts from 'apexcharts';
import { onMounted, onUnmounted, ref } from 'vue';
import { useUsersStore } from 'src/stores/user-store';
import { useKeepingStore } from 'src/stores/keeping-store';
import { MeetingCheckInModel } from 'src/models/attendance.models';

// Initialize stores
const userStore = useUsersStore();
const classStore = useKeepingStore();

// Stats data
const totalStudents = ref(0);
const totalClasses = ref(0);
const totalTeachers = ref(0);
const presentCount = ref(0);
const absentCount = ref(0);
const recentActivities = ref<
  Array<{
    name: string;
    time: string;
    status: MeetingCheckInModel['status'];
  }>
>([]);

// Chart configurations
const OverAllAttendance = ref({
  chart: {
    type: 'area',
    height: 350,
  },
  series: [
    {
      name: 'BS - Information Technology (Database Systems)',
      data: [30, 40, 35, 50, 49, 60, 70],
    },
    {
      name: 'BS - Information Technology (Networking Systems)',
      data: [20, 30, 25, 40, 39, 50, 60],
    },
    {
      name: 'BS - Information Systems',
      data: [10, 20, 15, 30, 29, 40, 50],
    },
    {
      name: 'BS - Computer Science',
      data: [5, 10, 8, 15, 14, 20, 25],
    },
  ],
  xaxis: {
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560'],
  stroke: {
    curve: 'smooth',
  },
});

const Attendance = {
  chart: {
    type: 'area',
    height: 100,
    sparkline: {
      enabled: true,
    },
  },
  series: [
    {
      name: 'Attendance',
      data: [130, 128, 130, 135, 131, 138, 140],
    },
  ],
  stroke: {
    curve: 'smooth',
    width: 2,
  },
  colors: ['#28c76f'],
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.7,
      opacityTo: 0.9,
      stops: [0, 90, 100],
    },
  },
};

// Load data
async function loadDashboardData() {
  try {
    // Load users
    await userStore.loadUsers();

    // Calculate user stats
    totalStudents.value = userStore.users.filter((user) => user.role === 'student').length;
    totalTeachers.value = userStore.users.filter((user) => user.role === 'teacher').length;

    // For classes, we'll use what's available in the store
    // Since loadAllClasses doesn't exist, we'll count what we can
    await classStore.loadUserKeeping('');
    totalClasses.value = classStore.teaching.length + classStore.enrolled.length;

    // For attendance data, we'll use what's available
    // Since we don't have a loadAllMeetings method, we'll use sample data for now
    // In a real implementation, you would need to add this method to the store

    // Sample data for demonstration
    const sampleActivities = [
      { name: 'John Doe', time: '2 hours ago', status: 'present' as MeetingCheckInModel['status'] },
      {
        name: 'Jane Smith',
        time: '3 hours ago',
        status: 'absent' as MeetingCheckInModel['status'],
      },
      {
        name: 'Robert Johnson',
        time: '5 hours ago',
        status: 'present' as MeetingCheckInModel['status'],
      },
      { name: 'Emily Davis', time: '6 hours ago', status: 'late' as MeetingCheckInModel['status'] },
      {
        name: 'Michael Wilson',
        time: '7 hours ago',
        status: 'check-in' as MeetingCheckInModel['status'],
      },
    ];

    // Set sample data
    recentActivities.value = sampleActivities;
    presentCount.value = userStore.users.filter((user) => user.role === 'student').length * 0.8; // 80% present rate
    absentCount.value = userStore.users.filter((user) => user.role === 'student').length * 0.2; // 20% absent rate

    // In a real implementation, you would process actual attendance data here
    // and update the chart with real data
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

onMounted(async () => {
  // Load dashboard data
  await loadDashboardData();

  // Render charts
  const chart = new ApexCharts(document.querySelector('#chart'), OverAllAttendance.value);
  void chart.render();

  const attendance = new ApexCharts(document.querySelector('#attendance'), Attendance);
  void attendance.render();
});

onUnmounted(() => {
  const chart = ApexCharts.getChartByID('chart');
  const attendance = ApexCharts.getChartByID('attendance');
  if (chart) chart.destroy();
  if (attendance) attendance.destroy();
});
</script>

<template>
  <q-page class="q-pa-md admindashboard">
    <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 1rem">
      <div class="cardContainer">
        <q-card class="card">
          <q-card-section>
            <div style="display: flex; gap: 1rem">
              <q-icon class="icon" name="people" color="primary" size="2rem" />
              <div>
                <h4 class="no-margin">
                  <strong>{{ totalStudents }}</strong>
                </h4>
                <p class="no-margin">Total Students</p>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="card">
          <q-card-section>
            <div style="display: flex; gap: 1rem">
              <q-icon class="icon" name="today" color="primary" size="2rem" />
              <div>
                <h4 class="no-margin">
                  <strong>{{ totalClasses }}</strong>
                </h4>
                <p class="no-margin">Total Classes</p>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="card">
          <q-card-section>
            <div style="display: flex; gap: 1rem">
              <q-icon class="icon" name="check" color="primary" size="2rem" />
              <div>
                <h4 class="no-margin">
                  <strong>{{ presentCount }}</strong>
                </h4>
                <p class="no-margin">Present</p>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="card">
          <q-card-section>
            <div style="display: flex; gap: 1rem">
              <q-icon class="icon" name="clear" color="primary" size="2rem" />
              <div>
                <h4 class="no-margin">
                  <strong>{{ absentCount }}</strong>
                </h4>
                <p class="no-margin">Absent</p>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="card">
          <q-card-section>
            <div style="display: flex; gap: 1rem">
              <q-icon class="icon" name="person" color="primary" size="2rem" />
              <div>
                <h4 class="no-margin">
                  <strong>{{ totalTeachers }}</strong>
                </h4>
                <p class="no-margin">Total Teachers</p>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="cardContainer" style="justify-content: space-between">
        <div id="chart" style="flex: 1.5 1 0; margin: 8px; margin-top: 0"></div>
        <q-markup-table class="table" style="flex: 1 1 0; margin: 8px; margin-top: 0">
          <thead>
            <tr>
              <th style="text-align: left; font-size: 2rem">Recent activity</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="recentActivities.length === 0">
              <td colspan="3" class="text-center">No recent activities</td>
            </tr>
            <tr v-for="(activity, index) in recentActivities" :key="index">
              <td>{{ activity.name }}</td>
              <td>{{ activity.time }}</td>
              <td>
                <q-badge
                  :color="
                    activity.status === 'present' || activity.status === 'check-in'
                      ? 'green'
                      : activity.status === 'late'
                        ? 'orange'
                        : 'red'
                  "
                >
                  {{
                    activity.status === 'present'
                      ? 'Present'
                      : activity.status === 'check-in'
                        ? 'Checked In'
                        : activity.status === 'late'
                          ? 'Late'
                          : 'Absent'
                  }}
                </q-badge>
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </div>
    </div>

    <div>
      <router-view />
    </div>
  </q-page>
</template>

<style scoped>
.no-margin {
  margin: 0;
}

#chart {
  background-color: white;
  border-radius: 10px;
  border: solid 0.5px rgb(224, 224, 224);
}

.admindashboard {
  background-color: #f3f3f7;
}

.cardSection > div {
  margin-left: 1rem;
}

.card {
  max-height: auto;
  background-color: white;
  border-radius: 10px;
  border: solid 0.5px rgb(224, 224, 224);
  display: flex;

  p {
    color: #aeb0cc;
  }
  flex: 1 1 0;
  margin: 8px;
}

.cardContainer {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  align-items: stretch;
}

.icon {
  background-color: #ffefe2;
  padding: 1rem;
  border-radius: 50%;
}

.table {
  color: #616161;
  border-radius: 10px;

  td:first-child {
    font-size: 1.2rem;
  }
}
</style>
