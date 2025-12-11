<script setup lang="ts">
import { ClassMeetingModel, MeetingCheckInModel } from 'src/models/attendance.models';
import { ClassModel } from 'src/models/class.models';
import { UserModel } from 'src/models/user.models';

defineProps<{
  targetClass: ClassModel;
  targetMeeting: ClassMeetingModel;
  currentStudent: UserModel;
  currentCheckIn?: MeetingCheckInModel | undefined;
}>();
const show = defineModel<boolean>({ required: true });
defineEmits<{
  (event: 'callStatus', status: MeetingCheckInModel['status'] | 'later'): void;
}>();
</script>
<template>
  <q-dialog :model-value="show" :maximized="$q.screen.lt.sm">
    <q-card>
      <q-toolbar>
        <q-btn icon="close" v-close-popup round size="sm" class="q-mr-lg"></q-btn>
        <q-badge>{{ targetClass.academicYear }}</q-badge>
        <q-toolbar-title>{{ targetClass.name }} : {{ targetClass.section }}</q-toolbar-title>
        <q-badge color="secondary">{{ currentCheckIn?.checkInTime }}</q-badge>
        <q-chip icon="event">{{ targetMeeting.date }}</q-chip>
      </q-toolbar>
      <q-card-section class="text-center">
        <q-avatar size="100px">
          <img
            :src="currentStudent.avatar || 'https://cdn.quasar.dev/img/avatar.png'"
            :alt="currentStudent.fullName.charAt(0).toUpperCase()"
          />
        </q-avatar>
        <div>{{ currentStudent.fullName }}</div>
      </q-card-section>
      <q-card-actions class="q-gutter-lg" align="evenly">
        <q-btn color="info" @click="$emit('callStatus', 'later')">Call Later</q-btn>
        <q-btn
          color="negative"
          :outline="currentCheckIn?.status == 'absent'"
          @click="$emit('callStatus', 'absent')"
          >Absent</q-btn
        >
        <q-btn
          color="warning"
          :outline="currentCheckIn?.status == 'late'"
          @click="$emit('callStatus', 'late')"
          >Late</q-btn
        >
      </q-card-actions>
      <q-card-section>
        <q-btn
          color="positive"
          class="full-width"
          :outline="currentCheckIn?.status == 'present'"
          @click="$emit('callStatus', 'present')"
          >Present</q-btn
        >
      </q-card-section>
      <q-card-section v-if="currentCheckIn?.comments">
        <q-scroll-area style="height: 100px">
          <q-chat-message
            v-for="comment in currentCheckIn.comments"
            :key="comment.key"
            :text="[comment.msg]"
            :sent="comment.from != 'student'"
          ></q-chat-message>
        </q-scroll-area>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
