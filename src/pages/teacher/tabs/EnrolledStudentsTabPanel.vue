<script setup lang="ts">
import { uid } from 'quasar';
import { ClassModel } from 'src/models/class.models';
import { UserModel } from 'src/models/user.models';
import { useClassStore } from 'src/stores/class-store';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps<{
  name: string;
  currentClass: ClassModel;
}>();
const $route = useRoute();
const classStore = useClassStore();
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

function enrollStudent() {
  showNewStudentDialog.value = true;
  studentName.value = '';
  studentEmail.value = '';
}

async function saveStudent() {
  if (activeClass.value) {
    await classStore.enroll({
      class: activeClass.value,
      student: {
        key: uid(),
        ownerKey: '',
        email: studentEmail.value,
        fullName: studentName.value,
      },
    });
  }

  showNewStudentDialog.value = false;
}

async function removeStudent(student: UserModel) {
  if (activeClass.value && student.key) {
    await classStore.unEnroll({
      classKey: activeClass.value.key,
      studentKey: student.key,
    });
  }
}
</script>
<template>
  <q-tab-panel :name="name">
    <div class="q-mb-md flex justify-between items-center">
      <div class="text-h6">Enrolled Students ({{ enrolledStudents.length }})</div>
      <q-btn
        color="primary"
        disabled
        icon="person_add"
        label="Add Student"
        @click="enrollStudent"
      />
    </div>

    <q-list bordered separator>
      <q-item v-for="student in enrolledStudents" :key="String(student.key)" class="q-my-sm">
        <q-item-section avatar>
          <q-avatar color="primary" text-color="white">
            {{ student.fullName ? student.fullName[0] : 'S' }}
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label>{{ student.fullName }}</q-item-label>
          <q-item-label caption>{{ student.email }}</q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-btn color="red" icon="delete" dense round @click="removeStudent(student)">
            <q-tooltip>Remove Student</q-tooltip>
          </q-btn>
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
  </q-tab-panel>
</template>
