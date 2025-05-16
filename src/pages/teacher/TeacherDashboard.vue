<script setup lang="ts">
import { date, uid, Notify, copyToClipboard } from 'quasar';
import { useClassStore } from 'src/stores/class-store';
import { useAuthStore } from 'src/stores/auth-store';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { ClassModel } from 'src/models/class.models';
import { useRouter } from 'vue-router';

const classStore = useClassStore();
const authStore = useAuthStore();
const router = useRouter();

const showNewClassDialog = ref(false);
const className = ref('');
const classSection = ref('');

const teacherClasses = computed(() => {
  return classStore.teaching;
});

onMounted(async () => {
  await classStore.loadUserClasses(authStore.currentAccount?.key || '');

  window.addEventListener('open-create-class-dialog', addNewClass);
});

onUnmounted(() => {
  window.removeEventListener('open-create-class-dialog', addNewClass);
});

function addNewClass() {
  showNewClassDialog.value = true;
}

async function saveClass() {
  if (authStore.currentAccount) {
    const newClass: ClassModel = {
      key: uid(),
      name: className.value,
      academicYear: date.formatDate(new Date(), 'YYYY'),
      classCode: Math.random().toString(36).substring(2, 6).toUpperCase(),
      section: classSection.value,
    };
    await classStore.saveClass(newClass, authStore.currentAccount);
  }

  className.value = '';
  showNewClassDialog.value = false;
}

async function deleteCourse(cls: ClassModel) {
  await classStore.deleteClass(cls.key || '');
}

function navigateToClass(cls: ClassModel) {
  void router.push({ name: 'teacherClass', params: { classKey: cls.key } });
}

function getRandomColor(key: string): string {
  const colors: string[] = [
    '#790622', // Primary theme color
    '#1a73e8', // Blue
    '#4285f4', // Light blue
    '#34a853', // Green
    '#fbbc04', // Yellow
    '#ea4335', // Red
    '#9c27b0', // Purple
    '#0097a7', // Teal
    '#ff6d00', // Orange
    '#795548', // Brown
  ];

  if (!key) return colors[0] as string;

  const keyChars = key.split('');

  const index = keyChars.reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
  return (colors[index] || colors[0]) as string;
}

function copyInviteLink(cls: ClassModel): void {
  if (!cls || !cls.classCode) return;

  // const baseUrl = window.location.origin;
  // const inviteLink = `${baseUrl}/join?code=${cls.classCode}`;
  const inviteLink = `${cls.classCode}`;

  copyToClipboard(inviteLink)
    .then(() => {
      Notify.create({
        message: 'Invitation link copied to clipboard!',
        color: 'green',
        icon: 'content_copy',
        position: 'top',
        timeout: 2000,
      });
    })
    .catch(() => {
      Notify.create({
        message: 'Failed to copy invitation link',
        color: 'negative',
        icon: 'error',
        position: 'top',
        timeout: 2000,
      });
    });
}
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md" style="margin-top: 0.5rem">
      <div class="col-12">
        <div class="row q-col-gutter-md">
          <div
            v-for="theClass in teacherClasses"
            :key="String(theClass.key)"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <q-card class="class-card" @click="navigateToClass(theClass)">
              <q-card-section
                class="class-card-header"
                :style="{
                  backgroundColor: getRandomColor(theClass.key || ''),
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }"
              >
                <div class="row items-center no-wrap full-width justify-between">
                  <div class="text-h6 ellipsis">{{ theClass.name }}</div>
                  <q-btn round flat color="white" icon="more_vert" size="sm" @click.stop>
                    <q-menu>
                      <q-list style="min-width: 150px">
                        <q-item clickable v-close-popup @click="copyInviteLink(theClass)">
                          <q-item-section avatar>
                            <q-icon name="content_copy" color="primary" />
                          </q-item-section>
                          <q-item-section>Copy invite link</q-item-section>
                        </q-item>
                        <q-separator />
                        <q-item clickable v-close-popup @click="deleteCourse(theClass)">
                          <q-item-section avatar>
                            <q-icon name="delete" color="red" />
                          </q-item-section>
                          <q-item-section>Delete</q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                </div>
                <div class="text-subtitle2">{{ theClass.section }}</div>
              </q-card-section>

              <q-card-section>
                <div class="row items-center" style="padding-bottom: 40px">
                  <div class="q-ml-sm">
                    <div class="text-caption">Class Code: {{ theClass.classCode }}</div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div v-if="teacherClasses.length === 0" class="col-12">
            <q-card class="text-center q-pa-md">
              <q-card-section>
                <q-icon name="school" size="4rem" color="grey-5" />
                <div class="text-h6 q-mt-md text-grey">No classes yet</div>
                <div class="text-caption q-mt-sm">
                  Click the + button to create your first class
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>

    <q-dialog v-model="showNewClassDialog" persistent>
      <q-card style="min-width: 450px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Create class</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <p class="text-caption q-mb-md">
            You're creating a class. After you enter the class name and section, you can add
            students.
          </p>
          <q-input
            v-model="className"
            label="Class name"
            outlined
            class="q-mb-md"
            :rules="[
              (v) => !!v || 'Class name is required',
              (v) => v.length >= 3 || 'Name must be at least 3 characters',
            ]"
          />
          <q-input
            v-model="classSection"
            label="Section"
            outlined
            class="q-mb-md"
            :rules="[(v) => !!v || 'Class section is required']"
          />
          <div class="text-caption q-mb-md">
            The class code will be automatically generated:
            <span class="text-weight-bold">{{
              Math.random().toString(36).substring(2, 6).toUpperCase()
            }}</span>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup />
          <q-btn
            unelevated
            label="Create"
            color="primary"
            @click="saveClass"
            :disable="!className || !classSection"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
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
  background-color: #790622;
  color: white;
  padding-bottom: 12px;
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80%;
}

.add-class-btn {
  box-shadow: 0 2px 10px 0 rgba(60, 64, 67, 0.3);
  border: 1px solid #dadce0;
}

.add-class-btn:hover {
  box-shadow: 0 4px 12px 0 rgba(60, 64, 67, 0.4);
}
</style>
