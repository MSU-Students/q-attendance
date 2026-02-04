<script lang="ts" setup>
import { date, Notify, QTableColumn, useQuasar } from 'quasar';
import { ClassMeetingModel } from 'src/models/attendance.models';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AttendanceDetailsDialog from 'src/components/AttendanceDetailsDialog.vue';
import { useAttendanceStore } from 'src/stores/attendance-store';
import { ClassModel } from 'src/models/class.models';

const attendanceColumns: QTableColumn[] = [
  {
    name: 'date',
    required: true,
    label: 'Date',
    align: 'left',
    field(record: ClassMeetingModel) {
      return date.formatDate(record.date, 'YYYY/MM/DD ddd hh:mmA');
    },
    sortable: true,
  },
  {
    name: 'status',
    align: 'center',
    label: 'Status',
    field: 'status',
    sortable: true,
  },
  {
    name: 'check-ins',
    align: 'center',
    label: 'Check-ins',
    field: (row: ClassMeetingModel) => row.checkInCount || 0,
    sortable: true,
  },
  {
    name: 'actions',
    align: 'right',
    label: 'Actions',
    field: 'actions',
    sortable: false,
  },
];
const $q = useQuasar();
const $route = useRoute();
const $router = useRouter();
const attendanceStore = useAttendanceStore();
const attendanceHistory = ref<ClassMeetingModel[]>([]);
const selectedMeeting = ref<ClassMeetingModel | null>(null);
const showAttendanceDetails = ref(false);
const showPastMeetings = ref(false);
defineProps<{
  cls: ClassModel;
  name: string;
}>();
onMounted(async () => {
  await streamAttendanceHistory();
});
async function streamAttendanceHistory() {
  if (typeof $route.params.classKey == 'string') {
    const schedules = await attendanceStore.loadClassMeetings($route.params.classKey);
    attendanceHistory.value = schedules.sort((a, b) => a.date.localeCompare(b.date));
    const unsubscribe = attendanceStore.streamClassMeetings($route.params.classKey, {
      onSnapshot(meetings) {
        if (meetings.length >= 0) {
          attendanceHistory.value = meetings.sort((a, b) => a.date.localeCompare(b.date));
        }
      },
    });
    onUnmounted(() => {
      unsubscribe();
    });
    $router.afterEach((to) => {
      unsubscribe();
      if (to.name == 'teacherClass') {
        streamAttendanceHistory();
      }
    });
  } else {
    attendanceHistory.value = [];
  }
}
const meetings = computed(() => {
  if (showPastMeetings.value) {
    return attendanceHistory.value;
  } else {
    const now = new Date();
    return attendanceHistory.value.filter((item) => date.getDateDiff(item.date, now, 'days') >= 0);
  }
});
function viewAttendanceDetails(meeting: ClassMeetingModel) {
  selectedMeeting.value = meeting;
  showAttendanceDetails.value = true;
}

function startRollCall(meeting: ClassMeetingModel) {
  if (meeting.status !== 'open') {
    Notify.create({
      message: 'Roll call can only be performed for open attendance sessions',
      color: 'negative',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    });
    return;
  }

  void $router.push({
    name: 'rollCall',
    params: {
      classKey: $router.currentRoute.value.params.classKey as string,
      meetingKey: meeting.key,
    },
  });
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
</script>
<template>
  <q-tab-panel :name="name">
    <div class="q-mb-md flex justify-between items-center">
      <div class="text-h6">Meetings ({{ attendanceHistory.length }})</div>
      <q-toggle v-model="showPastMeetings" label="Past Meetings" />
      <q-btn
        color="primary"
        icon="add"
        label="New Meeting"
        :to="{ name: 'createAttendance', params: { classKey: $route.params?.classKey } }"
      />
    </div>

    <q-table
      :rows="meetings"
      :columns="attendanceColumns"
      row-key="key"
      :rows-per-page-options="[30, 40, 50]"
      v-if="attendanceHistory.length > 0"
    >
      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-badge
            :color="
              props.row.status === 'open'
                ? 'green'
                : props.row.status === 'cancelled'
                  ? 'red'
                  : 'blue'
            "
          >
            {{ props.row.status }}
          </q-badge>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <div>
            <q-btn v-if="props.row.status === 'open'" color="green" icon="apps" dense round>
              <q-menu fit>
                <q-list style="min-width: 100px">
                  <q-item clickable @click="startRollCall(props.row)">
                    <q-item-section avatar><q-icon name="how_to_reg"></q-icon></q-item-section>
                    <q-item-section>Attendance</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="cancelMeeting(props.row)">
                    <q-item-section avatar><q-icon name="event_busy"></q-icon></q-item-section>
                    <q-item-section>Cancel</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
            <q-btn
              v-else
              color="primary"
              icon="visibility"
              dense
              round
              @click="viewAttendanceDetails(props.row)"
            >
              <q-tooltip>View Details</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>
    </q-table>

    <div v-else class="text-center q-pa-lg text-grey">No attendance records found</div>
    <!-- Attendance Details Dialog -->
    <attendance-details-dialog
      v-if="selectedMeeting"
      :meeting="selectedMeeting"
      :target-class="cls"
      v-model:show="showAttendanceDetails"
    />
  </q-tab-panel>
</template>
