<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { uid, useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { ClassModel } from 'src/models/class.models';
import ClassMeetingListingTabPanel from './tabs/ClassMeetingListingTabPanel.vue';
import EnrolledStudentsTabPanel from './tabs/EnrolledStudentsTabPanel.vue';
import AnalysisTabPanel from './tabs/AnalysisTabPanel.vue';
import QrcodeVue from 'qrcode.vue';
import { useClassStore } from 'src/stores/class-store';

const $q = useQuasar();
const route = useRoute();
const classStore = useClassStore();

const tab = ref('attendance');

const activeClass = computed(() => {
  if (route.params?.classKey === currentClass.value?.key) {
    return currentClass.value;
  }
  return undefined;
});

const currentClass = ref<ClassModel>();

onMounted(async () => {
  if (typeof route.params?.classKey === 'string') {
    currentClass.value = await classStore.loadClass(route.params.classKey);
  }
});
//classCode
const showClassCodeDialog = ref(false);
const maximizeClassCodeDialog = ref(false);
const $router = useRouter();
const classCode = computed(() => {
  const link = $router.resolve({
    name: 'student',
    query: {
      joinCode: activeClass.value?.classCode || '',
    },
  });

  return `${location.origin}${link.fullPath}`;
});
// Google Classroom Integration
const showGoogleClassroomDialog = ref(false);
const googleCourses = ref<any[]>([]);
const loadingGoogle = ref(false);
const googleAccessToken = ref('');

// TODO: Replace with your actual Google Client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

const loadGoogleScript = () => {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.oauth2) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const openGoogleClassroomImport = async () => {
  try {
    await loadGoogleScript();
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope:
        'https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.rosters.readonly https://www.googleapis.com/auth/classroom.profile.emails',
      callback: async (response: any) => {
        if (response.access_token) {
          googleAccessToken.value = response.access_token;
          showGoogleClassroomDialog.value = true;
          await fetchGoogleCourses();
        }
      },
    });
    client.requestAccessToken();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to load Google Sign-In',
      caption: String(error),
    });
  }
};

const fetchGoogleCourses = async () => {
  loadingGoogle.value = true;
  try {
    const response = await fetch(
      'https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE',
      {
        headers: { Authorization: `Bearer ${googleAccessToken.value}` },
      },
    );
    const data = await response.json();
    googleCourses.value = data.courses || [];
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to fetch courses',
      caption: String(error),
    });
  } finally {
    loadingGoogle.value = false;
  }
};

const importStudents = async (courseId: string) => {
  if (!activeClass.value) return;

  $q.loading.show({ message: 'Importing students...' });
  try {
    const response = await fetch(
      `https://classroom.googleapis.com/v1/courses/${courseId}/students`,
      {
        headers: { Authorization: `Bearer ${googleAccessToken.value}` },
      },
    );
    const data = await response.json();
    const students = data.students || [];

    let importedCount = 0;
    for (const student of students) {
      if (student.profile && student.profile.emailAddress) {
        await classStore.enroll({
          class: activeClass.value,
          student: {
            key: uid(),
            ownerKey: '',
            status: 'active',
            email: student.profile.emailAddress,
            fullName: student.profile.name?.fullName || 'Unknown',
            role: 'student',
          },
        });
        importedCount++;
      }
    }

    if (typeof route.params?.classKey === 'string') {
      currentClass.value = await classStore.loadClass(route.params.classKey);
    }

    showGoogleClassroomDialog.value = false;
    $q.notify({ type: 'positive', message: `Successfully imported ${importedCount} students` });
  } catch (error) {
    console.error(error);
    $q.notify({ type: 'negative', message: 'Failed to import students' });
  } finally {
    $q.loading.hide();
  }
};
function copyText(text: string) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        $q.notify({
          message: 'Class Code Copied',
        });
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
      });
  } else {
    // Fallback for older browsers or non-HTTPS
    fallbackCopyTextToClipboard(text);
  }
}

// A simple fallback using the deprecated document.execCommand('copy') method
function fallbackCopyTextToClipboard(text: string) {
  const tempInput = document.createElement('input');
  tempInput.style.position = 'absolute';
  tempInput.style.left = '-1000px';
  tempInput.style.top = '-1000px';
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);
  $q.notify({
    message: 'Class Code Copied',
  });
}
</script>

<template>
  <q-page style="margin: 2rem 1rem 2rem 1.5rem">
    <div class="class-dashboard q-mb-md" v-if="activeClass">
      <q-card>
        <q-card-section>
          <div class="text-h5">{{ activeClass.name }}</div>
          <div class="text-subtitle2">
            Section: {{ activeClass.section }} | Academic Year: {{ activeClass.academicYear }}
          </div>
          <div class="text-caption">
            Class Code:
            <q-btn @click="showClassCodeDialog = true" dense flat>{{
              activeClass.classCode
            }}</q-btn>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <q-tabs
      v-model="tab"
      class="text-primary"
      active-color="primary"
      indicator-color="primary"
      align="justify"
      narrow-indicator
    >
      <q-tab name="attendance" label="Attendance History" icon="history" />
      <q-tab name="students" label="Students" icon="people" />
      <q-tab name="analysis" label="Analysis" icon="analytics" />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model="tab" v-if="activeClass" animated>
      <EnrolledStudentsTabPanel :current-class="activeClass" name="students">
        <q-btn
          flat
          icon="cloud_download"
          label="Import from Google Classroom"
          color="primary"
          @click="openGoogleClassroomImport"
        />
      </EnrolledStudentsTabPanel>
      <ClassMeetingListingTabPanel :cls="activeClass" name="attendance" />
      <AnalysisTabPanel :cls="activeClass" name="analysis" />
    </q-tab-panels>

    <!-- Google Classroom Import Dialog -->
    <q-dialog v-model="showGoogleClassroomDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Select Google Classroom</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div v-if="loadingGoogle" class="text-center q-pa-md">
            <q-spinner color="primary" size="3em" />
            <div class="q-mt-sm">Loading courses...</div>
          </div>
          <q-list v-else bordered separator>
            <q-item v-if="googleCourses.length === 0">
              <q-item-section class="text-center text-grey">No active courses found</q-item-section>
            </q-item>
            <q-item
              v-for="course in googleCourses"
              :key="course.id"
              clickable
              v-ripple
              @click="importStudents(course.id)"
            >
              <q-item-section>
                <q-item-label>{{ course.name }}</q-item-label>
                <q-item-label caption>{{ course.section }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="showClassCodeDialog" :maximized="maximizeClassCodeDialog">
      <q-card style="min-width: 350px">
        <q-card-section class="text-center">
          <span class="text-h1">{{ activeClass?.classCode || '' }}</span>
        </q-card-section>
        <q-card-section class="text-center">
          <qrcode-vue
            :value="classCode"
            :size="
              maximizeClassCodeDialog ? Math.min($q.screen.height, $q.screen.width) - 200 : 200
            "
            level="M"
          ></qrcode-vue>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup icon="close"></q-btn>
          <q-btn
            icon="fullscreen"
            @click="maximizeClassCodeDialog = !maximizeClassCodeDialog"
          ></q-btn>
          <q-btn icon="content_copy" @click="copyText(classCode)">Copy Link</q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.class-dashboard {
  border-radius: 8px;
  overflow: hidden;
}
</style>
