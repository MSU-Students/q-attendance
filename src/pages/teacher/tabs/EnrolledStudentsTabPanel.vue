<script setup lang="ts">
import { uid, useQuasar } from 'quasar';
import { ClassModel } from 'src/models/class.models';
import { UserModel } from 'src/models/user.models';
import { useClassStore } from 'src/stores/class-store';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import AttendanceReportDialog from '../AttendanceReportDialog.vue';
import { useAttendanceStore } from 'src/stores/attendance-store';

const props = defineProps<{
  name: string;
  currentClass: ClassModel;
}>();
const $q = useQuasar();
const $route = useRoute();
const classStore = useClassStore();
const attendanceStore = useAttendanceStore();
const activeClass = computed(() => {
  if ($route.params?.classKey === props.currentClass.key) {
    return props.currentClass;
  }
  return undefined;
});
const enrolledStudents = computed(() => {
  return (activeClass.value?.enrolled || []).filter((e) => e.status == 'active');
});
const showNewStudentDialog = ref(false);
const studentName = ref('');
const studentEmail = ref('');
const showAttendanceReport = ref(false);
const currentStudent = ref<UserModel>();
function enrollStudent() {
  showNewStudentDialog.value = true;
  studentName.value = '';
  studentEmail.value = '';
}

async function analyzeStudent(student: UserModel) {
  showAttendanceReport.value = false;
  if (!activeClass.value) return;
  currentStudent.value = student;
  await attendanceStore.loadClassMeetings(activeClass.value.key, {
    student: student.key,
  });
  showAttendanceReport.value = true;
}

async function saveStudent() {
  if (activeClass.value) {
    await classStore.enroll({
      class: activeClass.value,
      student: {
        key: uid(),
        ownerKey: '',
        status: 'active',
        email: studentEmail.value,
        fullName: studentName.value,
        role: 'student',
      },
    });
  }

  showNewStudentDialog.value = false;
}

async function removeStudent(student: UserModel) {
  if (activeClass.value && student.key) {
    await classStore.unEnroll({
      classKey: activeClass.value.key,
      studentEmail: student.email,
    });
  }
}
async function studentsFromClipboard() {
  if (!activeClass.value) return;
  const cls = activeClass.value;
  const content = await navigator.clipboard.readText();
  const lines = content.split(/[\r\n]{1,2}/);
  const headerLine = lines.splice(0, 1)[0] || '';
  const header = headerLine.split('\t');
  const emailHeader = header.findIndex((h) => /email/i.test(h));
  const nameHeader = header.findIndex((h) => /name/i.test(h));
  if (emailHeader >= 0 && nameHeader >= 0) {
    const notify = $q.notify({
      group: false, // required to be updatable
      timeout: 0, // we want to be in control when it gets dismissed
      spinner: true,
      message: 'Importing from Clipboard',
      caption: lines.length + ' Students',
    });
    const students = lines
      .map((line) => {
        const studentLine = line.split('\t');
        const fullName = (studentLine[nameHeader] || '').trim();
        const email = (studentLine[emailHeader] || '').trim();
        return {
          fullName,
          email,
        };
      })
      .filter((s) => s.email && s.fullName);
    for (let index = 0; index < students.length; index++) {
      const student = students[index]!;
      await new Promise<void>((resolve) => {
        notify({
          message: `Import ${student.fullName} (${student.email})`,
          caption: `${index + 1} of ${students.length} students`,
          actions: [
            {
              label: 'Add',
              color: 'yellow',
              noDismiss: true,
              handler: () => {
                classStore
                  .enroll({
                    class: cls,
                    student: {
                      key: uid(),
                      ownerKey: '',
                      email: student.email,
                      fullName: student.fullName,
                      role: 'student',
                      status: 'active',
                    },
                  })
                  .then(resolve, resolve);
              },
            },
            {
              label: 'Skip',
              color: 'white',
              noDismiss: true,
              handler: () => {
                resolve();
              },
            },
          ],
        });
      });
    }
    notify({
      icon: 'done', // we add an icon
      spinner: false, // we reset the spinner setting so the icon can be displayed
      message: 'done!',
      caption: `${students.length} from clipboard`,
      timeout: 2500, // we will timeout it in 2.5s,
      actions: [],
    });
  } else {
    $q.notify({
      type: 'negative',
      message: 'Invalid Clipboard',
    });
  }
}
</script>
<template>
  <q-tab-panel :name="name">
    <div class="q-mb-md flex justify-between items-center">
      <div class="text-h6">Enrolled Students ({{ enrolledStudents.length }})</div>
      <q-btn-dropdown color="primary" label="New Student">
        <q-list>
          <q-item clickable v-close-popup @click="studentsFromClipboard">
            <q-item-section avatar>
              <q-icon name="content_paste" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Import from Clipboard</q-item-label>
            </q-item-section>
            <q-tooltip
              >Paste clipboard from Spreadsheet with headers "Name" and "Email".
            </q-tooltip>
          </q-item>
          <q-item clickable v-close-popup @click="enrollStudent">
            <q-item-section avatar>
              <q-icon name="person_add" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Add Student</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <slot />
          </q-item>
        </q-list>
      </q-btn-dropdown>
    </div>

    <q-list bordered separator>
      <q-item v-for="student in enrolledStudents" :key="String(student.key)" class="q-my-sm">
        <q-item-section avatar>
          <q-avatar color="primary" text-color="white">
            <img
              v-if="student.avatar"
              :src="student.avatar"
              :alt="student.fullName ? student.fullName[0] : 'S'"
            />
            <span v-else>
              {{ student.fullName ? student.fullName[0] : 'S' }}
            </span>
          </q-avatar>
        </q-item-section>

        <q-item-section class="cursor-pointer" @click="analyzeStudent(student)">
          <q-item-label>{{ student.fullName }}</q-item-label>
          <q-item-label caption>{{ student.email }}</q-item-label>
        </q-item-section>

        <q-item-section side>
          <div>
            <q-btn color="red" icon="delete" dense round @click="removeStudent(student)">
              <q-tooltip>Remove Student</q-tooltip>
            </q-btn>
          </div>
        </q-item-section>
      </q-item>

      <q-item v-if="enrolledStudents.length === 0">
        <q-item-section>
          <q-item-label class="text-center text-grey">No students enrolled yet</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
    <q-dialog v-model="showNewStudentDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Add New Student</div>
        </q-card-section>

        <q-form @submit="saveStudent">
          <q-card-section>
            <q-input
              v-model="studentName"
              label="Student Name"
              :rules="[
                (v) => !!v || 'Name is required',
                (v) => v.length >= 3 || 'Name must be at least 3 characters',
              ]"
            />
            <q-input
              v-model="studentEmail"
              label="Student Email"
              type="email"
              :rules="[
                (v) => !!v || 'Email is required',
                (v) =>
                  /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v) ||
                  'Please enter a valid email',
              ]"
            />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="negative" v-close-popup />
            <q-btn
              flat
              type="submit"
              label="Add"
              color="positive"
              :disable="!studentName || !studentEmail"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
    <template v-if="activeClass && currentStudent">
      <AttendanceReportDialog
        v-model="showAttendanceReport"
        :target-class="activeClass"
        :current-student="currentStudent"
        :all-meetings="attendanceStore.meetings"
      />
    </template>
  </q-tab-panel>
</template>
