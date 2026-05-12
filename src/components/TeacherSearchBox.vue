<template>
  <q-form @submit="search()">
    <q-input v-model="keyword" rounded outlined>
      <template v-slot:prepend>
        <q-avatar>
          <q-icon size="sm" name="person" />
        </q-avatar>
      </template>
      <template #append>
        <q-btn icon="search" flat round type="submit" @click="search" />
      </template>
    </q-input>
    <q-dialog v-model="showDialog">
      <q-card>
        <q-card-section>
          <q-table :rows="results" grid>
            <template #item="item">
              <q-card class="col-12 q-ma-sm">
                <q-card-section>
                  <q-avatar size="md">
                    <img
                      :src="(item.row as Match)?.avatar || 'https://cdn.quasar.dev/img/avatar.png'"
                      :alt="((item.row as Match)?.studentName || '0')?.charAt(0).toUpperCase()"
                    />
                  </q-avatar>
                  {{ (item.row as Match).studentName }}
                  <div>
                    <q-chip>{{ (item.row as Match).studentStatus }}</q-chip>
                  </div>
                </q-card-section>
                <q-card-actions>
                  <q-btn
                    :to="{
                      name: 'teacherClass',
                      params: {
                        classKey: (item.row as Match).classKey,
                      },
                    }"
                    >{{ (item.row as Match).className }}
                    {{ (item.row as Match).classSection }}</q-btn
                  >
                  <q-btn :loading="item.row.loading" @click="analyzeStudent(item.row as Match)"
                    >Report</q-btn
                  >
                </q-card-actions>
              </q-card>
            </template>
          </q-table>
        </q-card-section>
        <q-card-actions>
          <q-btn v-close-popup>Close</q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
    <AttendanceReportDialog
      v-if="activeClass && currentStudent"
      v-model="showAttendanceReport"
      :target-class="activeClass"
      :current-student="currentStudent"
      :all-meetings="concludedMeetings"
    />
  </q-form>
</template>
<script lang="ts" setup>
import { ClassMeetingModel, ClassModel, StudentEnrollment } from 'src/models';
import AttendanceReportDialog from 'src/pages/teacher/AttendanceReportDialog.vue';
import { useAttendanceStore } from 'src/stores/attendance-store';
import { useClassStore } from 'src/stores/class-store';
import { useKeepingStore } from 'src/stores/keeping-store';
import { ref } from 'vue';
const keyword = ref('');
const showDialog = ref(false);
const showAttendanceReport = ref(false);
const activeClass = ref<ClassModel>();
const currentStudent = ref<StudentEnrollment>();
const concludedMeetings = ref<ClassMeetingModel[]>([]);
const keepingStore = useKeepingStore();
type Results = ReturnType<typeof keepingStore.searchStudentFromKeepings>;
type Match = Awaited<Results>[number] & { loading?: boolean };
const results = ref<Match[]>([]);
async function search() {
  showDialog.value = true;
  results.value = await keepingStore.searchStudentFromKeepings(keyword.value);
}
async function analyzeStudent(row: Match) {
  row.loading = true;
  try {
    const attendanceStore = useAttendanceStore();
    const classStore = useClassStore();
    const student = await classStore.getClassStudent(row.classKey, row.studentKey);
    if (!student) return;
    activeClass.value = await classStore.loadClass(row.classKey);
    showAttendanceReport.value = false;
    if (!activeClass.value) return;
    currentStudent.value = student;
    concludedMeetings.value = (
      await attendanceStore.loadClassMeetings(activeClass.value.key, {
        student: student.key,
      })
    ).filter((m) => m.status == 'concluded');
    showAttendanceReport.value = true;
  } finally {
    row.loading = false;
  }
}
</script>
