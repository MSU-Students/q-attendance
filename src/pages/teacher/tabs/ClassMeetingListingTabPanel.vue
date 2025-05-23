<script lang="ts" setup>
import { Notify, QTableColumn } from 'quasar';
import { ClassMeetingModel } from 'src/models/attendance.models';
import { onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AttendanceDetailsDialog from 'src/components/AttendanceDetailsDialog.vue';
import { useAttendanceStore } from 'src/stores/attendance-store';
import { ClassModel } from 'src/models/class.models';

const attendanceColumns: QTableColumn[] = [
  {
    name: 'date',
    required: true,
    label: 'Date',
    align: 'left',
    field: 'date',
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
const $router = useRouter();
const attendanceStore = useAttendanceStore();
const attendanceHistory = ref<ClassMeetingModel[]>([]);
const selectedMeeting = ref<ClassMeetingModel | null>(null);
const showAttendanceDetails = ref(false);

const props = defineProps<{
  cls: ClassModel;
  name: string;
}>();

streamAttendanceHistory();
function streamAttendanceHistory() {
  if (props.cls.key) {
    const unsubscribe = attendanceStore.streamClassMeetings(props.cls.key, {
      onSnapshot(meetings) {
        attendanceHistory.value = meetings;
      },
    });
    onUnmounted(() => {
      unsubscribe();
    });
  } else {
    attendanceHistory.value = [];
  }
}

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
</script>
<template>
  <q-tab-panel :name="name">
    <div class="q-mb-md flex justify-between items-center">
      <div class="text-h6">Meetings ({{ attendanceHistory.length }})</div>
      <q-btn
        color="primary"
        icon="add"
        label="New Meeting"
        :to="{ name: 'createAttendance', params: { classKey: $route.params?.classKey } }"
      />
    </div>

    <q-table
      :rows="attendanceHistory"
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
            <q-btn
              v-if="props.row.status === 'open'"
              color="green"
              icon="how_to_reg"
              dense
              round
              @click="startRollCall(props.row)"
            >
              <q-tooltip>Start Roll Call</q-tooltip>
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
