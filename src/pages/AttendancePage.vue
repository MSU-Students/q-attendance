<script setup lang="ts">
import { uid } from 'quasar';
import { useClassStore } from 'src/stores/class-store';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { UserModel } from 'src/models/user.models';

const route = useRoute();
const classStore = useClassStore();
const activeClass = computed(() => {
  if (typeof route.params?.classKey == 'string') {
    const classKey = route.params.classKey;
    return (classStore.teaching || []).find((c) => c.key == classKey);
  }
  return undefined;
});
const students = computed(() => {
  return [] as UserModel[];
});
type AttendanceStruct = {
  [studentKey: string]: boolean;
};
const attendance = ref<AttendanceStruct>({});
const showNewStudentDialog = ref(false);
const studentName = ref('');
onMounted(async () => {
  if (typeof route.params?.classKey == 'string') {
    await classStore.loadClass(route.params?.classKey);
  }
});
function enrollStudent() {
  showNewStudentDialog.value = true;
}
async function saveStudent() {
  const payload = {
    key: uid(),
    classKey: activeClass.value?.key || '',
    student: studentName.value,
  };

  if (activeClass.value) {
    await classStore.enroll({
      class: activeClass.value,
      student: {
        key: '',
        ownerKey: '',
        email: 'dummy@mail.com',
        fullName: payload.student,
      },
    });
  }

  studentName.value = payload.student;
  showNewStudentDialog.value = false;
}
</script>
<template>
  <q-page>
    <div class="q-pa-md">
      <q-toolbar>
        <q-toolbar-title>Attendance</q-toolbar-title>
        <q-btn icon="add" @click="enrollStudent()"></q-btn>
      </q-toolbar>
      <q-list bordered>
        <q-item v-for="item in students" :key="String(item.key)" class="q-my-sm" clickable v-ripple>
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white">
              {{ item.fullName }}
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ item.fullName }}</q-item-label>
          </q-item-section>

          <q-item-section side v-if="item.key">
            <q-checkbox v-model="attendance[item.key]" />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
    <q-page-sticky position="bottom" :offset="[0, 0]">
      <q-btn
        fab
        icon="shuffle"
        :to="{ name: 'rollCall', params: { classKey: route.params?.classKey } }"
        color="accent"
      >
        <span v-if="$q.screen.gt.sm">Shuffle</span>
        <q-tooltip v-else>Shuffle</q-tooltip>
      </q-btn>
    </q-page-sticky>
    <q-dialog position="standard" persistent v-model="showNewStudentDialog">
      <q-card>
        <q-form @submit="saveStudent()">
          <q-card-section>
            <q-input
              autofocus
              v-model="studentName"
              :rules="[
                (v) => (v && /^[a-z]/i.test(v)) || 'Should Start with a letter',
                (v) => (v && v.length > 3) || 'Should at least 4 characters',
              ]"
              placeholder="Student Name"
            />
          </q-card-section>
          <q-card-actions>
            <q-btn icon="cancel" color="secondary" v-close-popup>Cancel</q-btn>
            <q-btn icon="save" type="submit">Save</q-btn>
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>
