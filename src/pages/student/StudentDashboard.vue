<script setup lang="ts">
import { useClassStore } from 'src/stores/class-store';
import { useAuthStore } from 'src/stores/auth-store';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Notify, Dialog, copyToClipboard } from 'quasar';
import { ClassModel } from 'src/models/class.models';

const classStore = useClassStore();
const authStore = useAuthStore();
const router = useRouter();

const showEnrollDialog = ref(false);
const classCode = ref('');
const isLoading = ref(false);
const codeError = ref('');

const studentClasses = computed(() => {
  return classStore.enrolled;
});

const handleEnrollDialog = () => {
  openEnrollDialog();
};

onMounted(async () => {
  await loadStudentClasses();

  window.addEventListener('open-enroll-dialog', handleEnrollDialog);
});

onUnmounted(() => {
  window.removeEventListener('open-enroll-dialog', handleEnrollDialog);
});

async function loadStudentClasses() {
  if (authStore.currentAccount?.key) {
    await classStore.loadUserClasses(authStore.currentAccount.key);
  }
}

function openEnrollDialog() {
  showEnrollDialog.value = true;
  classCode.value = '';
  codeError.value = '';
}

async function enrollInClass() {
  if (!classCode.value) {
    codeError.value = 'Please enter a class code';
    return;
  }

  isLoading.value = true;
  codeError.value = '';

  try {
    const foundClass = await classStore.findClassByCode(classCode.value);

    if (!foundClass) {
      codeError.value = 'Invalid class code. Please check and try again.';
      isLoading.value = false;
      return;
    }

    if (
      authStore.currentAccount?.key &&
      foundClass.enrolled?.find((e) => e.key == authStore.currentAccount?.key)
    ) {
      codeError.value = 'You are already enrolled in this class.';
      isLoading.value = false;
      return;
    }

    if (authStore.currentAccount) {
      await classStore.enroll({
        class: foundClass,
        student: authStore.currentAccount,
      });

      Notify.create({
        message: `Successfully enrolled in ${foundClass.name}`,
        color: 'green',
        icon: 'check_circle',
        position: 'top',
        timeout: 3000,
      });

      await loadStudentClasses();

      showEnrollDialog.value = false;
    }
  } catch (error) {
    console.error('Error enrolling in class:', error);
    codeError.value = 'An error occurred. Please try again.';
  } finally {
    isLoading.value = false;
  }
}

function navigateToClass(cls: { key?: string }) {
  void router.push({ name: 'studentClass', params: { classKey: cls.key } });
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

function copyClassCode(cls: ClassModel): void {
  if (!cls || !cls.classCode) return;

  copyToClipboard(cls.classCode)
    .then(() => {
      Notify.create({
        message: 'Class code copied to clipboard!',
        color: 'positive',
        icon: 'content_copy',
        position: 'top',
        timeout: 2000,
      });
    })
    .catch(() => {
      Notify.create({
        message: 'Failed to copy class code',
        color: 'negative',
        icon: 'error',
        position: 'top',
        timeout: 2000,
      });
    });
}

async function unenrollCourse(cls: ClassModel) {
  if (!cls.key || !authStore.currentAccount?.key) {
    return;
  }

  try {
    await new Promise<void>((resolve, reject) => {
      Dialog.create({
        title: 'Confirm Unenrollment',
        message: `Are you sure you want to unenroll from ${cls.name}?`,
        persistent: true,
        color: 'primary',
        ok: {
          label: 'Confirm',
          color: 'negative',
          unelevated: true,
        },
        cancel: {
          label: 'Cancel',
          color: 'grey',
          flat: true,
        },
      })
        .onOk(() => {
          resolve();
        })
        .onCancel(() => {
          reject(new Error('Cancelled'));
        })
        .onDismiss(() => {
          reject(new Error('Dismissed'));
        });
    });
  } catch {
    return;
  }

  try {
    const success = await classStore.unenroll({
      classKey: cls.key,
      studentKey: authStore.currentAccount.key,
    });

    if (success) {
      Notify.create({
        message: `Successfully unenrolled from ${cls.name}`,
        color: 'green',
        icon: 'check_circle',
        position: 'top',
        timeout: 3000,
      });

      await loadStudentClasses();
    } else {
      Notify.create({
        message: 'Failed to unenroll from class',
        color: 'negative',
        icon: 'error',
        position: 'top',
        timeout: 3000,
      });
    }
  } catch (error) {
    console.error('Error unenrolling from class:', error);
    Notify.create({
      message: 'An error occurred while unenrolling',
      color: 'negative',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    });
  }
}
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md" style="margin-top: 0.5rem">
      <div
        v-for="theClass in studentClasses"
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
                    <q-item clickable v-close-popup @click="copyClassCode(theClass)">
                      <q-item-section avatar>
                        <q-icon name="content_copy" color="primary" />
                      </q-item-section>
                      <q-item-section>Copy class code</q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item clickable v-close-popup @click="unenrollCourse(theClass)">
                      <q-item-section avatar>
                        <q-icon name="delete" color="red" />
                      </q-item-section>
                      <q-item-section>Unenroll</q-item-section>
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

      <div v-if="studentClasses.length === 0" class="col-12">
        <q-card class="text-center q-pa-md">
          <q-card-section>
            <q-icon name="school" size="4rem" color="grey-5" />
            <div class="text-h6 q-mt-md text-grey">You are not enrolled in any classes yet</div>
            <div class="text-caption q-mt-sm">Click the + button to enroll in a class</div>
            <div class="q-mt-md">
              <q-btn color="primary" label="Enroll in a Class" @click="openEnrollDialog" />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>    <q-dialog v-model="showEnrollDialog" persistent>
      <q-card class="enroll-dialog">
        <q-card-section class="row items-center q-pb-none">
          <div class="dialog-title">Join class</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <p class="dialog-description q-mb-md">
            Ask your teacher for the class code, then enter it here.
          </p>
          <q-input
            v-model="classCode"
            label="Class code"
            outlined
            class="q-mb-md dialog-input"
            :error="!!codeError"
            :error-message="codeError"
            :rules="[
              (v) => !!v || 'Class code is required',
              (v) => v.length >= 4 || 'Code must be at least 4 characters',
            ]"
            @keyup.enter="enrollInClass"
          />
          <div class="info-section q-mt-sm text-grey-8">
            <q-icon name="info" size="xs" class="q-mr-xs" />
            Class codes contain 4-7 letters or numbers with no spaces or symbols
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md dialog-actions">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup class="dialog-btn" />
          <q-btn
            unelevated
            label="Join"
            color="primary"
            @click="enrollInClass"
            :loading="isLoading"
            :disable="!classCode"
            class="dialog-btn"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
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

.enroll-dialog {
  width: 90vw;
  max-width: 500px;
  margin: 20px;

  @media (max-width: 599px) {
    width: 95vw;
    margin: 10px;
  }

  .dialog-title {
    font-size: 1.5rem;
    font-weight: 500;

    @media (max-width: 599px) {
      font-size: 1.25rem;
    }
  }

  .dialog-description {
    font-size: 0.875rem;
    line-height: 1.4;

    @media (max-width: 599px) {
      font-size: 0.8rem;
    }
  }

  .dialog-input {
    .q-field__label {
      font-size: 1rem;

      @media (max-width: 599px) {
        font-size: 0.875rem;
      }
    }
  }

  .info-section {
    font-size: 0.875rem;
    background: rgba(0, 0, 0, 0.03);
    padding: 8px;
    border-radius: 4px;
    display: flex;
    align-items: flex-start;

    @media (max-width: 599px) {
      font-size: 0.8rem;
      padding: 6px;
    }

    .q-icon {
      margin-top: 2px;
    }
  }

  .dialog-actions {
    @media (max-width: 599px) {
      padding: 8px !important;
    }

    .dialog-btn {
      min-width: 80px;

      @media (max-width: 599px) {
        min-width: 70px;
        font-size: 0.875rem;
      }
    }
  }
}
</style>
