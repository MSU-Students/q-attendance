<script setup lang="ts">
import { useUsersStore } from 'src/stores/user-store';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { firebaseService } from 'src/services/firebase-service';
import { ClassModel } from 'src/models/class.models';

const userStore = useUsersStore();
const router = useRouter();

// Stats data
const totalClasses = ref(0);
const totalTeachers = ref(0);
const totalStudents = ref(0);
const presentCount = ref(0);
const absentCount = ref(0);
const recentActivities = ref<
  Array<{
    name: string;
    time: string;
    status: string;
  }>
>([]);

// Classes data
const allClasses = ref<ClassModel[]>([]);

// Function to generate random colors for class cards
function getRandomColor(seed: string) {
  const colors = [
    '#790622', // Theme color
    '#1976D2',
    '#388E3C',
    '#D32F2F',
    '#7B1FA2',
    '#C2185B',
    '#0097A7',
    '#FFA000',
  ];

  // Simple hash function to get consistent colors for the same seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

// Format relative time
function formatRelativeTime(timestamp: string): string {
  try {
    const now = new Date();
    const checkInTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - checkInTime.getTime()) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  } catch {
    return 'Unknown time';
  }
}

// Load all classes directly from Firebase
async function loadAllClasses() {
  try {
    const classes = await firebaseService.findRecords('classes');
    allClasses.value = classes;
    totalClasses.value = classes.length;

    // For each class, load teacher information
    for (const cls of allClasses.value) {
      if (cls.key) {
        const teachers = await firebaseService.findRecords('teachers', `/classes/${cls.key}`);
        cls.teachers = teachers;
      }
    }

    return classes;
  } catch (error) {
    console.error('Error loading all classes:', error);
    return [];
  }
}

// Load recent attendance activities
async function loadRecentActivities() {
  try {
    // Get all meetings
    const meetings = await firebaseService.findRecords('meetings');

    // Sort meetings by date (most recent first)
    meetings.sort((a, b) => {
      const dateA = new Date(a.date || '');
      const dateB = new Date(b.date || '');
      return dateB.getTime() - dateA.getTime();
    });

    // Get the 5 most recent meetings
    const recentMeetings = meetings.slice(0, 5);

    // For each meeting, get check-ins
    const activities: Array<{
      name: string;
      time: string;
      status: string;
      timestamp: Date;
    }> = [];

    for (const meeting of recentMeetings) {
      if (meeting.key) {
        const checkIns = await firebaseService.findRecords('check-ins', `/meetings/${meeting.key}`);

        for (const checkIn of checkIns) {
          // Find student name
          const student = userStore.users.find((user) => user.key === checkIn.key);

          if (student) {
            activities.push({
              name: student.fullName,
              time: checkIn.checkInTime,
              status: checkIn.status,
              timestamp: new Date(checkIn.checkInTime),
            });
          }
        }
      }
    }

    // Sort activities by time (most recent first)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Take the 5 most recent activities
    recentActivities.value = activities.slice(0, 5).map((activity) => ({
      name: activity.name,
      time: formatRelativeTime(activity.time),
      status: activity.status,
    }));

    // Count present and absent
    const allCheckIns = activities.map((a) => a.status);
    presentCount.value = allCheckIns.filter(
      (status) => status === 'present' || status === 'check-in',
    ).length;
    absentCount.value = allCheckIns.filter((status) => status === 'absent').length;
  } catch (error) {
    console.error('Error loading recent activities:', error);
  }
}

onMounted(async () => {
  // Load users
  await userStore.loadUsers();

  // Calculate user stats
  totalTeachers.value = userStore.users.filter((user) => user.role === 'teacher').length;
  totalStudents.value = userStore.users.filter((user) => user.role === 'student').length;

  // Load all classes
  await loadAllClasses();

  // Load recent activities
  await loadRecentActivities();

  // If no recent activities were found, use sample data
  if (recentActivities.value.length === 0) {
    recentActivities.value = [
      { name: 'John Doe', time: '2 hours ago', status: 'present' },
      { name: 'Jane Smith', time: '3 hours ago', status: 'absent' },
      { name: 'Robert Johnson', time: '5 hours ago', status: 'present' },
      { name: 'Emily Davis', time: '6 hours ago', status: 'present' },
      { name: 'Michael Wilson', time: '7 hours ago', status: 'absent' },
    ];

    // Set sample counts
    presentCount.value = 3;
    absentCount.value = 2;
  }
});

function navigateToClasses() {
  void router.push('/supervisor/classes');
}

function navigateToReports() {
  void router.push('/supervisor/reports');
}

function navigateToTeachers() {
  void router.push('/supervisor/teachers');
}

function navigateToStudents() {
  void router.push('/supervisor/students');
}

function navigateToClass(classKey: string) {
  void router.push(`/supervisor/class/${classKey}`);
}
</script>

<template>
  <q-page class="q-pa-md" style="background-color: #f3f3f7">
    <div class="text-h5 q-mb-md">Supervisor Dashboard</div>

    <!-- Stats Cards -->
    <div class="row q-col-gutter-md">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="dashboard-card">
          <q-card-section>
            <div style="display: flex; gap: 1rem">
              <q-icon class="icon" name="school" color="primary" size="2rem" />
              <div>
                <h4 class="no-margin">
                  <strong>{{ totalClasses }}</strong>
                </h4>
                <p class="no-margin">Total Classes</p>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="dashboard-card">
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

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="dashboard-card">
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
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="dashboard-card">
          <q-card-section>
            <div style="display: flex; gap: 1rem">
              <q-icon class="icon" name="how_to_reg" color="primary" size="2rem" />
              <div>
                <h4 class="no-margin">
                  <strong>{{ presentCount }}/{{ presentCount + absentCount }}</strong>
                </h4>
                <p class="no-margin">Attendance Rate</p>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="row q-col-gutter-md q-mt-md">
      <div class="col-12 col-md-6">
        <q-card class="dashboard-card">
          <q-card-section>
            <div class="text-h6">Quick Actions</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <div class="row q-col-gutter-sm">
              <div class="col-6 col-md-3">
                <q-btn
                  color="primary"
                  class="full-width"
                  icon="school"
                  label="Classes"
                  @click="navigateToClasses"
                />
              </div>
              <div class="col-6 col-md-3">
                <q-btn
                  color="primary"
                  class="full-width"
                  icon="assessment"
                  label="Reports"
                  @click="navigateToReports"
                />
              </div>
              <div class="col-6 col-md-3 q-mt-sm q-mt-md-none">
                <q-btn
                  color="primary"
                  class="full-width"
                  icon="person"
                  label="Teachers"
                  @click="navigateToTeachers"
                />
              </div>
              <div class="col-6 col-md-3 q-mt-sm q-mt-md-none">
                <q-btn
                  color="primary"
                  class="full-width"
                  icon="people"
                  label="Students"
                  @click="navigateToStudents"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card class="dashboard-card">
          <q-card-section>
            <div class="text-h6">Recent Activity</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-list separator>
              <q-item v-for="(activity, index) in recentActivities" :key="index" dense>
                <q-item-section>
                  <q-item-label>{{ activity.name }}</q-item-label>
                  <q-item-label caption>{{ activity.time }}</q-item-label>
                </q-item-section>
                <q-item-section side>
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
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Classes Overview -->
    <div class="row q-mt-md">
      <div class="col-12">
        <q-card class="dashboard-card">
          <q-card-section class="row items-center justify-between">
            <div class="text-h6">Classes Overview</div>
            <q-btn flat color="primary" label="View All" @click="navigateToClasses" />
          </q-card-section>

          <q-card-section class="q-pt-none">
            <div class="row q-col-gutter-md">
              <div
                v-for="(theClass, index) in allClasses.slice(0, 4)"
                :key="theClass.key"
                class="col-12 col-sm-6 col-md-3"
              >
                <q-card class="class-card" @click="navigateToClass(theClass.key || '')">
                  <q-card-section
                    class="class-card-header"
                    :style="{
                      backgroundColor: getRandomColor(theClass.key || 'class-' + index),
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }"
                  >
                    <div class="row items-center no-wrap full-width justify-between">
                      <div class="text-h6 ellipsis text-white">{{ theClass.name }}</div>
                    </div>
                  </q-card-section>

                  <q-card-section>
                    <div class="text-subtitle2">Section: {{ theClass.section || 'N/A' }}</div>
                    <div class="text-caption">
                      Teacher:
                      {{
                        theClass.teachers && theClass.teachers.length > 0 && theClass.teachers[0]
                          ? theClass.teachers[0].fullName
                          : 'Not Assigned'
                      }}
                    </div>
                  </q-card-section>

                  <q-card-section class="q-pt-none">
                    <div class="row items-center">
                      <div>
                        <div class="text-caption">
                          {{ theClass.enrolled ? theClass.enrolled.length : 0 }} students
                        </div>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <!-- Show placeholder if no classes are available -->
              <div v-if="allClasses.length === 0" class="col-12 text-center q-pa-lg">
                <q-icon name="school" size="4rem" color="grey-5" />
                <div class="text-h6 text-grey-7 q-mt-md">No classes available</div>
                <div class="text-caption text-grey-7">
                  Classes will appear here once they are created
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.dashboard-card {
  background-color: white;
  border-radius: 10px;
  border: solid 0.5px rgb(224, 224, 224);
}

.class-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  overflow: hidden;
  height: 100%;
  box-shadow:
    0 1px 2px 0 rgba(60, 64, 67, 0.3),
    0 1px 3px 1px rgba(60, 64, 67, 0.15);
}

.class-card:hover {
  box-shadow:
    0 2px 10px 0 rgba(60, 64, 67, 0.3),
    0 6px 10px 4px rgba(60, 64, 67, 0.15);
  transform: translateY(-2px);
}

.class-card-header {
  height: 100px;
  padding: 16px;
}

.no-margin {
  margin: 0;
}

.icon {
  background-color: #ffefe2;
  padding: 1rem;
  border-radius: 50%;
}

p {
  color: #aeb0cc;
}
</style>
