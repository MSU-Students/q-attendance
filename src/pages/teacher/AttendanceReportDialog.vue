<template>
  <!-- Attendance Report Dialog -->
  <q-dialog v-model="showAttendanceReport">
    <q-card style="min-width: 500px; max-width: 700px">
      <q-card-section class="bg-primary text-white q-pa-md">
        <div class="text-h6 text-center">
          <q-icon name="analytics" class="q-mr-sm" />
          Attendance Report
        </div>
      </q-card-section>

      <q-card-section v-if="attendanceStats" class="q-pa-md q-pt-none">
        <!-- Tabs -->
        <q-tabs
          v-model="activeTab"
          class="text-grey-7 q-mb-sm text-caption q-mt-neg-sm"
          active-color="primary"
          indicator-color="primary"
          dense
        >
          <q-tab
            name="calendar"
            icon="calendar_month"
            label="Calendar View"
            class="text-caption q-px-sm"
          />
          <q-tab
            name="detailed"
            icon="list_alt"
            label="Detailed View"
            class="text-caption q-px-sm"
          />
        </q-tabs>

        <!-- Tab Panels -->
        <q-tab-panels v-model="activeTab" class="q-mb-md">
          <!-- Calendar View -->
          <q-tab-panel name="calendar" class="q-pa-none">
            <div class="calendar-container">
              <!-- Month Navigation -->
              <div class="row items-center justify-between q-mb-sm">
                <q-btn flat round icon="chevron_left" size="sm" @click="previousMonth" />
                <div class="text-body2 text-weight-bold">
                  {{ date.formatDate(currentMonth, 'MMMM YYYY') }}
                </div>
                <q-btn flat round icon="chevron_right" size="sm" @click="nextMonth" />
              </div>

              <!-- Calendar Grid -->
              <div class="calendar-grid" style="max-width: 240px; margin: 0 auto">
                <!-- Day Headers -->
                <div class="row q-mb-xs">
                  <div class="col text-center text-overline text-weight-medium">S</div>
                  <div class="col text-center text-overline text-weight-medium">M</div>
                  <div class="col text-center text-overline text-weight-medium">T</div>
                  <div class="col text-center text-overline text-weight-medium">W</div>
                  <div class="col text-center text-overline text-weight-medium">T</div>
                  <div class="col text-center text-overline text-weight-medium">F</div>
                  <div class="col text-center text-overline text-weight-medium">S</div>
                </div>

                <!-- Calendar Days -->
                <div class="calendar-body">
                  <div class="row" v-for="week in 6" :key="week">
                    <div
                      v-for="day in calendarGrid.slice((week - 1) * 7, week * 7)"
                      :key="day.dateStr"
                      class="col q-pa-none"
                    >
                      <div
                        :class="[
                          'calendar-cell text-center text-overline q-pa-xs cursor-pointer',
                          getCellClass(day.attendanceStatus),
                          { 'text-grey-5': !day.isCurrentMonth && !day.attendanceStatus },
                        ]"
                        :style="{
                          height: '28px',
                          width: '28px',
                          'font-size': '10px',
                          border: '1px solid #e0e0e0',
                          'background-color': getCellBgColor(day.attendanceStatus),
                          margin: '0.5px',
                          display: 'flex',
                          'align-items': 'center',
                          'justify-content': 'center',
                        }"
                      >
                        {{ day.dayNumber }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Legend -->
              <div class="q-mt-sm">
                <div class="legend-container">
                  <div class="legend-item">
                    <div class="legend-dot" style="background: #4caf50"></div>
                    <span>Present</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-dot" style="background: #c8e6c9"></div>
                    <span>Check-in</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-dot" style="background: #ff9800"></div>
                    <span>Late</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-dot" style="background: #f44336"></div>
                    <span>Absent</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-dot" style="background: #ffcdd2"></div>
                    <span>No check-in</span>
                  </div>
                </div>
              </div>
            </div>
          </q-tab-panel>

          <!-- Detailed View -->
          <q-tab-panel name="detailed" class="q-pa-none">
            <q-scroll-area style="height: 200px; border: 1px solid #e0e0e0; border-radius: 4px">
              <q-table
                :rows="studentAttendanceRecords"
                :columns="[
                  {
                    name: 'date',
                    label: 'Date',
                    field: 'date',
                    align: 'left',
                    format: (val) => formatDisplayDate(val),
                    sortable: true,
                  },
                  {
                    name: 'meetingTime',
                    label: 'Meeting Time',
                    field: 'meetingTime',
                    align: 'center',
                  },
                  {
                    name: 'checkInTime',
                    label: 'Check-in Time',
                    field: 'checkInTime',
                    align: 'center',
                  },
                  { name: 'status', label: 'Status', field: 'status', align: 'center' },
                ]"
                row-key="date"
                flat
                dense
                hide-pagination
                :pagination="{ rowsPerPage: 0 }"
                class="compact-table text-caption"
              >
                <template v-slot:body-cell-status="props">
                  <q-td :props="props">
                    <q-chip :color="getStatusColor(props.row.status)" text-color="white" size="xs">
                      {{ props.row.status.toUpperCase() }}
                    </q-chip>
                  </q-td>
                </template>

                <template v-slot:body-cell-checkInTime="props">
                  <q-td :props="props">
                    <div class="text-caption">
                      {{ props.row.checkInTime }}
                    </div>
                  </q-td>
                </template>
              </q-table>
            </q-scroll-area>
          </q-tab-panel>
        </q-tab-panels>

        <!-- Attendance Summary Title -->
        <div class="text-caption text-weight-medium q-mb-xs q-mt-sm">Attendance Summary</div>

        <!-- Summary Metrics Table -->
        <div class="compact-table q-mb-xs">
          <div class="table-header bg-grey-1 q-pa-xs rounded-borders-top">
            <div class="row q-pl-lg">
              <div
                class="col-7 text-overline text-weight-medium text-grey-7"
                style="font-size: 10px"
              >
                Metric
              </div>
              <div
                class="col-5 text-center text-overline text-weight-medium text-grey-7"
                style="font-size: 10px"
              >
                Count
              </div>
            </div>
          </div>

          <div
            class="table-body bg-white rounded-borders-bottom"
            style="border: 1px solid #e0e0e0; border-top: none"
          >
            <!-- Present Row -->
            <div class="table-row q-pa-xs" style="border-bottom: 1px solid #f5f5f5">
              <div class="row items-center q-pl-lg">
                <div class="col-7">
                  <div class="row items-center q-gutter-xs">
                    <q-icon name="check_circle" color="green" size="xs" />
                    <span class="text-caption" style="font-size: 11px">Present</span>
                  </div>
                </div>
                <div class="col-5 text-center">
                  <div class="beautiful-count present-count">
                    {{ attendanceStats.presentCount }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Late Row -->
            <div class="table-row q-pa-xs" style="border-bottom: 1px solid #f5f5f5">
              <div class="row items-center q-pl-lg">
                <div class="col-7">
                  <div class="row items-center q-gutter-xs">
                    <q-icon name="schedule" color="orange" size="xs" />
                    <span class="text-caption" style="font-size: 11px">Late</span>
                  </div>
                </div>
                <div class="col-5 text-center">
                  <div class="beautiful-count late-count">
                    {{ attendanceStats.lateCount }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Absent Row -->
            <div class="table-row q-pa-xs" style="border-bottom: 1px solid #f5f5f5">
              <div class="row items-center q-pl-lg">
                <div class="col-7">
                  <div class="row items-center q-gutter-xs">
                    <q-icon name="cancel" color="red" size="xs" />
                    <span class="text-caption" style="font-size: 11px">Absent</span>
                  </div>
                </div>
                <div class="col-5 text-center">
                  <div class="beautiful-count absent-count">
                    {{ attendanceStats.absentCount }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Current Consecutive Row -->
            <div class="table-row q-pa-xs" style="border-bottom: 1px solid #f5f5f5">
              <div class="row items-center q-pl-lg">
                <div class="col-7">
                  <div class="row items-center q-gutter-xs">
                    <q-icon name="trending_down" color="red" size="xs" />
                    <span class="text-caption" style="font-size: 11px">Current Consecutive</span>
                  </div>
                </div>
                <div class="col-5 text-center">
                  <div class="beautiful-count consecutive-count">
                    {{ attendanceStats.consecutiveAbsent }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Total Meetings Row -->
            <div class="table-row q-pa-xs">
              <div class="row items-center q-pl-lg">
                <div class="col-7">
                  <div class="row items-center q-gutter-xs">
                    <q-icon name="event" color="primary" size="xs" />
                    <span class="text-caption" style="font-size: 11px">Total</span>
                  </div>
                </div>
                <div class="col-5 text-center">
                  <div class="beautiful-count total-count">
                    {{ attendanceStats.totalMeetings }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Conclusion Card -->
        <q-card flat bordered class="bg-grey-1 q-mt-xs">
          <q-card-section class="q-pa-md">
            <div class="text-center">
              <q-icon
                :name="attendanceStatus.icon"
                :color="attendanceStatus.color"
                size="sm"
                class="q-mb-xs"
              />
              <div
                class="text-body2 text-weight-medium text-grey-8"
                v-html="formatConclusionWithColors(attendanceStatus.conclusion)"
              ></div>
            </div>
          </q-card-section>
        </q-card>
      </q-card-section>

      <q-card-section v-else class="text-center q-pa-lg">
        <q-icon name="help_outline" size="lg" color="grey-5" class="q-mb-md" />
        <div class="text-h6 text-grey-6 q-mb-sm">No Data Available</div>
        <div class="text-body2 text-grey-5">
          Attendance analysis will be available after the first meeting
        </div>
      </q-card-section>

      <q-card-actions align="center" class="q-pt-none q-pb-xs q-px-sm">
        <q-btn
          unelevated
          color="primary"
          label="Close"
          icon="close"
          v-close-popup
          class="q-px-sm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script setup lang="ts">
import { date } from 'quasar';
import { ClassMeetingModel, ClassModel, UserModel } from 'src/models';
import { calculateStudentAttendance, getAttendanceStatus } from 'src/utils/attendance-utils';
import { computed } from 'vue';
import { ref } from 'vue';

const showAttendanceReport = defineModel<boolean>({ default: false });
const props = defineProps<{
  targetClass: ClassModel;
  currentStudent: UserModel;
  allMeetings: ClassMeetingModel[];
}>();
const activeTab = ref('calendar');
const currentMonth = ref(new Date());

// Calculate student attendance stats

const attendanceStatus = computed(() => {
  if (!attendanceStats.value) {
    return {
      status: 'no-data',
      color: 'grey',
      icon: 'help_outline',
      conclusion: 'No available data',
    };
  }
  return getAttendanceStatus(
    attendanceStats.value,
    props.currentStudent.fullName || 'Student',
    concludedMeetings.value,
    props.currentStudent.key || '',
  );
});

const concludedMeetings = computed(() => {
  return props.allMeetings.filter((m) => m.status == 'concluded');
});

// Navigate calendar months
function previousMonth() {
  const newDate = new Date(currentMonth.value);
  newDate.setMonth(newDate.getMonth() - 1);
  currentMonth.value = newDate;
}

function nextMonth() {
  const newDate = new Date(currentMonth.value);
  newDate.setMonth(newDate.getMonth() + 1);
  currentMonth.value = newDate;
}

// To create a calendar grid
const calendarGrid = computed(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days = [];
  const current = new Date(startDate);

  for (let i = 0; i < 42; i++) {
    const dateStr = date.formatDate(current, 'YYYY-MM-DD');

    // date matching
    const meetingEvent = calendarEvents.value.find((event) => {
      const eventDateOnly = event.date.split(' ')[0];
      const eventDateFormatted = date.formatDate(eventDateOnly, 'YYYY-MM-DD');

      // For date matching
      if (i < 5) {
        // Only log first few days to avoid spam
        console.log(
          `Comparing calendar date: ${dateStr} with meeting date: ${eventDateOnly} (formatted: ${eventDateFormatted})`,
        );
      }

      // Try multiple date format comparisons
      return eventDateOnly === dateStr || eventDateFormatted === dateStr || event.date === dateStr;
    });

    const dayData = {
      date: new Date(current),
      dateStr,
      dayNumber: current.getDate(),
      isCurrentMonth: current.getMonth() === month,
      // This now receives the correct status from the matched meetingEvent
      attendanceStatus: meetingEvent?.status || null,
    };

    if (meetingEvent) {
      console.log(`Day ${dayData.dayNumber}: Found meeting with status ${meetingEvent.status}`);
    }

    days.push(dayData);

    current.setDate(current.getDate() + 1);
  }

  return days;
});

// Get CSS class for calendar cell based on attendance status
function getCellClass(status: string | null): string {
  switch (status) {
    case 'present':
      return 'text-white';
    case 'check-in':
      return 'text-black';
    case 'late':
      return 'text-white';
    case 'absent':
      return 'text-white';
    case 'no-checkin':
      return 'text-black';
    default:
      return '';
  }
}

// Get background color for calendar cell - matching legend colors
function getCellBgColor(status: string | null): string {
  console.log('getCellBgColor called with status:', status);
  switch (status) {
    case 'present':
      return '#4CAF50'; // bg-green
    case 'check-in':
      return '#C8E6C9'; // very light green
    case 'late':
      return '#FF9800'; // bg-orange
    case 'absent':
      return '#F44336'; // bg-red
    case 'no-checkin':
      return '#FFCDD2'; // bg-red-1
    default:
      return 'transparent';
  }
}

// Calculate student attendance stats
const attendanceStats = computed(() => {
  if (!props.currentStudent.key || concludedMeetings.value.length === 0) {
    return null;
  }
  return calculateStudentAttendance(concludedMeetings.value, props.currentStudent.key);
});

// Get attendance status

function formatConclusionWithColors(text: string): string {
  return text;
}
// Helper function to get status colors

// Format date for display
function formatDisplayDate(dateStr: string): string {
  try {
    return date.formatDate(dateStr, 'MMM DD, YYYY');
  } catch {
    return dateStr;
  }
}

// Student attendance records for detailed view
const studentAttendanceRecords = computed(() => {
  if (!props.currentStudent.key) return [];

  return concludedMeetings.value.map((meeting) => {
    const checkIn = meeting.checkIns?.find((ci) => ci.key === props.currentStudent.key);
    return {
      date: meeting.date,
      meetingTime: extractTimeFromDate(meeting.date),
      checkInTime: checkIn?.checkInTime
        ? extractTimeFromDate(checkIn.checkInTime)
        : 'Not checked in',
      status: checkIn?.status || 'absent',
      meeting,
      fullCheckInTime: checkIn?.checkInTime || 'Not checked in',
    };
  });
});

// Extract time from datetime string
function extractTimeFromDate(dateTimeStr: string): string {
  try {
    // If it's a full datetime string, extract time part
    if (dateTimeStr.includes(' ')) {
      return dateTimeStr.split(' ')[1] || 'N/A';
    }
    // If it's just a date, return N/A
    return 'N/A';
  } catch {
    return 'N/A';
  }
}

// Calendar events for calendar view
const calendarEvents = computed(() => {
  if (!props.currentStudent.key) {
    console.log('No student key available');
    return [];
  }

  const events = concludedMeetings.value.map((meeting) => {
    const checkIn = meeting.checkIns?.find((ci) => ci.key === props.currentStudent.key);
    let status: string;

    if (checkIn) {
      status = checkIn.status;
    } else {
      // No check-in record found - student didn't check in
      status = 'no-checkin';
    }

    const event = {
      date: meeting.date,
      status,
      color: getStatusColor(status),
      meeting,
    };

    console.log('Calendar event:', event);
    return event;
  });

  console.log('Total calendar events for student:', events.length);
  console.log(
    'Sample meeting dates:',
    events.slice(0, 3).map((e) => e.date),
  );
  return events;
});

// Helper function to get status colors
function getStatusColor(status: string): string {
  switch (status) {
    case 'present':
      return 'green';
    case 'check-in':
      return 'light-green';
    case 'late':
      return 'orange';
    case 'absent':
      return 'red';
    default:
      return 'red-1';
  }
}
</script>
<style scoped>
.modern-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  color: #495057;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.modern-count:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.compact-table {
  font-size: 12px;
}

.compact-table .table-row {
  min-height: 28px;
}

.legend-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  padding: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  font-size: 11px;
  font-weight: 500;
  color: #555;
  backdrop-filter: blur(4px);
  transition: all 0.2s ease;
}

.legend-item:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.modern-count-small {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 600;
  color: #495057;
  transition: all 0.2s ease;
}

.modern-count-small:hover {
  transform: translateY(-1px);
}

.beautiful-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  color: white;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.beautiful-count::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0) 50%,
    rgba(0, 0, 0, 0.1) 100%
  );
  border-radius: 50%;
}

.beautiful-count:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.present-count {
  background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
}

.late-count {
  background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
}

.absent-count {
  background: linear-gradient(135deg, #f44336 0%, #ef5350 100%);
}

.consecutive-count {
  background: linear-gradient(135deg, #795548 0%, #8d6e63 100%);
}

.total-count {
  background: linear-gradient(135deg, #607d8b 0%, #78909c 100%);
}
</style>
