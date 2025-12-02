<script setup lang="ts">
import { useClassStore } from 'src/stores/class-store';
import { useAttendanceStore } from 'src/stores/attendance-store';
import { useAuthStore } from 'src/stores/auth-store';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { date, uid, Notify } from 'quasar';
import { ClassMeetingModel } from 'src/models/attendance.models';
import { ClassModel } from 'src/models/class.models';

const route = useRoute();
const router = useRouter();
const classStore = useClassStore();
const attendanceStore = useAttendanceStore();
const authStore = useAuthStore();

const attendanceDate = ref(date.formatDate(new Date(), 'YYYY/MM/DD'));
const attendanceTime = ref(date.formatDate(new Date(), 'HH:mm'));
const attendanceStatus = ref<ClassMeetingModel['status']>('open');
const meetingLocation = ref<{ lat: number; lng: number } | null>(null);
const isSubmitting = ref(false);
const existingMeetingFound = ref(false);

const activeClass = computed(() => {
  if (route.params?.classKey === currentClass.value?.key) {
    return currentClass.value;
  }
  return undefined;
});

const currentClass = ref<ClassModel>();

const currentTeacher = computed(() => {
  return authStore.teacherAccount;
});

const formattedDateTime = computed(() => {
  if (attendanceDate.value && attendanceTime.value) {
    return `${attendanceDate.value} ${attendanceTime.value}`;
  }
  return '';
});

onMounted(async () => {
  if (typeof route.params?.classKey === 'string') {
    currentClass.value = await classStore.loadClass(route.params.classKey);
    await attendanceStore.loadClassMeetings(route.params.classKey);
  }
});

const checkExistingMeeting = () => {
  if (!activeClass.value?.key) return false;

  const dateTimeString = `${attendanceDate.value} ${attendanceTime.value}`;

  const existingMeeting = attendanceStore.meetings.find(
    (meeting) => meeting.classKey === activeClass.value?.key && meeting.date === dateTimeString,
  );

  existingMeetingFound.value = !!existingMeeting;
  return existingMeetingFound.value;
};

const createAttendanceRecord = async () => {
  if (!activeClass.value?.key || !activeClass.value?.teachers) {
    Notify.create({
      message: 'Missing class or teacher information',
      color: 'negative',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    });
    return;
  }

  if (checkExistingMeeting()) {
    Notify.create({
      message: 'An attendance record already exists for this date and time',
      color: 'negative',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    });
    return;
  }

  isSubmitting.value = true;

  try {
    const dateTimeString = `${attendanceDate.value} ${attendanceTime.value}`;

    const newMeeting: ClassMeetingModel = {
      key: uid(),
      classKey: activeClass.value.key,
      date: dateTimeString,
      status: attendanceStatus.value,
      teacher: currentTeacher.value?.key || '',
      checkIns: [],
      location: meetingLocation.value || undefined,
    };

    await attendanceStore.newClassMeeting(newMeeting);

    Notify.create({
      message: 'Attendance record created successfully',
      color: 'green',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
    });

    void router.push({
      name: 'teacherClass',
      params: { classKey: activeClass.value.key },
    });
  } catch (error) {
    console.error('Error creating attendance record:', error);
    Notify.create({
      message: 'Failed to create attendance record',
      color: 'negative',
      icon: 'error',
      position: 'top',
      timeout: 3000,
    });
  } finally {
    isSubmitting.value = false;
  }
};

async function useMyLocation() {
  try {
    if (!navigator.geolocation) {
      Notify.create({ message: 'Geolocation is not supported by your browser', color: 'negative' });
      return;
    }
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 }));
    meetingLocation.value = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    Notify.create({ message: 'Meeting location set', color: 'positive' });
  } catch (err) {
    console.error('Error getting location', err);
    Notify.create({ message: 'Failed to get location', color: 'negative' });
  }
}

const cancelAndGoBack = () => {
  void router.push({
    name: 'teacherClass',
    params: { classKey: activeClass.value?.key || '' },
  });
};
</script>

<template>
  <q-page style="margin: 2rem 1rem 2rem 1.5rem">
    <div>
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6">Create Attendance Record</div>
          <div v-if="activeClass" class="text-subtitle2">
            {{ activeClass.name }} - Section {{ activeClass.section }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-form @submit.prevent="createAttendanceRecord">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  filled
                  v-model="attendanceDate"
                  label="Date"
                  mask="####/##/##"
                  :rules="[(val) => !!val || 'Date is required']"
                >
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="attendanceDate" mask="YYYY/MM/DD">
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="Close" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-6">
                <q-input
                  filled
                  v-model="attendanceTime"
                  label="Time"
                  mask="##:##"
                  :rules="[(val) => !!val || 'Time is required']"
                >
                  <template v-slot:append>
                    <q-icon name="access_time" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-time v-model="attendanceTime" mask="HH:mm" format24h>
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="Close" color="primary" flat />
                          </div>
                        </q-time>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>

              <div class="col-12">
                <div class="row q-col-gutter-md items-center">
                  <div class="col-6">
                    <q-btn label="Use My Location" color="secondary" @click="useMyLocation" />
                  </div>
                  <div class="col-6 text-right">
                    <div v-if="meetingLocation">Location: {{ meetingLocation?.lat.toFixed(5) }}, {{ meetingLocation?.lng.toFixed(5) }}</div>
                  </div>
                </div>
                <q-select
                  filled
                  v-model="attendanceStatus"
                  :options="[
                    { label: 'Open', value: 'open' },
                    { label: 'Concluded', value: 'concluded' },
                  ]"
                  option-value="value"
                  option-label="label"
                  label="Status"
                  emit-value
                  map-options
                  :rules="[(val) => !!val || 'Status is required']"
                />
              </div>
            </div>

            <div class="q-mt-md">
              <q-banner v-if="existingMeetingFound" class="bg-negative text-white q-mb-md">
                An attendance record already exists for this date and time.
              </q-banner>

              <div class="text-subtitle2 q-mb-sm">Attendance Record Details:</div>
              <div class="q-pa-sm bg-grey-2 rounded-borders">
                <div><strong>Class:</strong> {{ activeClass?.name }}</div>
                <div><strong>Date & Time:</strong> {{ formattedDateTime }}</div>
                <div><strong>Status:</strong> {{ attendanceStatus }}</div>
                <div><strong>Teacher:</strong> {{ currentTeacher?.fullName }}</div>
              </div>
            </div>

            <div class="row justify-end q-mt-md">
              <q-btn label="Cancel" color="grey" flat class="q-mr-sm" @click="cancelAndGoBack" />
              <q-btn
                type="submit"
                label="Create Attendance Record"
                color="primary"
                :loading="isSubmitting"
                :disable="existingMeetingFound"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>
