import { defineStore, acceptHMRUpdate } from 'pinia';
import { date } from 'quasar';
import type { ClassMeetingModel, MeetingCheckInModel } from 'src/models/attendance.models';
import { usePersistentStore } from './persistent-store';
import { firebaseService } from 'src/services/firebase-service';

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    meetings: [] as ClassMeetingModel[]
  }),

  getters: {

  },
  actions: {
    async newClassMeeting(payload: ClassMeetingModel) {
      const persistentStore = usePersistentStore();
      const record = await persistentStore.createRecord('meetings', {
        ...payload,
        checkIns: undefined
      });
      if (record) {
        this.meetings.push(record);
      }
    },
    async loadClassMeetings(classKey: string, condition?: { student?: string | undefined }) {
      try {
        const persistentStore = usePersistentStore();
        const records = await persistentStore.findRecords('meetings', undefined, {
          classKey: { '==': classKey }
        });
        const classMeetings = await Promise.all(records.map(async m => {
          m.checkIns = [];
          m.checkInCount = 0;
          if (condition?.student) {
            m.checkIns = await persistentStore.findRecords('check-ins', `/meetings/${m.key}`, {
              key: { '==': condition.student }
            })
          } else {
            m.checkInCount = await persistentStore.countRecords('check-ins', `/meetings/${m.key}`)
          }
          return m;
        }));
        this.meetings = classMeetings;
        return this.meetings;
      } catch (error) {
        console.error('Error loading class meetings:', error);
        return [];
      }
    },

    streamClassMeetings(classKey: string, options: {
      student?: string | undefined
      loadAllCheckIns?: boolean
      onSnapshot: (meetings: ClassMeetingModel[]) => void | Promise<void>
    }) {
      const persistentStore = usePersistentStore();
      return firebaseService.streamRecords('meetings', {
        condition: { classKey: { '==': classKey } },
        async onSnapshot(records) {
          const meetings = await Promise.all(records.map(async (m) => {
            m.checkIns = [];
            m.checkInCount = 0;
            if (options.student) {
              m.checkIns = await persistentStore.findRecords('check-ins', `/meetings/${m.key}`, {
                key: { '==': options.student }
              });
            } else if (options.loadAllCheckIns) {
              // Load ALL check-ins for analysis
              m.checkIns = await persistentStore.findRecords('check-ins', `/meetings/${m.key}`);
              m.checkInCount = m.checkIns?.length || 0;
            } else {
              m.checkInCount = await persistentStore.countRecords('check-ins', `/meetings/${m.key}`)
            }
            return m;
          }));
          void options.onSnapshot(meetings);
        },
      })
    },
    streamCheckIns(meetingKey: string, onSnapshot: (meetings: MeetingCheckInModel[]) => void | Promise<void>) {
      return firebaseService.streamRecords('check-ins', {
        path: `/meetings/${meetingKey}`,
        onSnapshot(records) {
          void onSnapshot(records);
        }
      });
    },

    async checkExistingMeeting(classKey: string, dateTime: string) {
      await this.loadClassMeetings(classKey);

      return this.meetings.some(meeting =>
        meeting.classKey === classKey &&
        meeting.date === dateTime
      );
    },

    async checkInAttendance(payload: {
      student: string;
      meeting: ClassMeetingModel,
      status: MeetingCheckInModel['status']
    }) {
      try {
        const persistentStore = usePersistentStore();
        const checkInTime = date.formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
        const checkInRecord: MeetingCheckInModel = {
          key: payload.student,
          checkInTime: checkInTime,
          status: payload.status || 'check-in',
        };
        await Promise.all([
          persistentStore.createRecord('check-ins',
            checkInRecord,
            `/meetings/${payload.meeting.key}`
          ),
          persistentStore.updateRecord('meetings', payload.meeting.key, {
            latestCheckIn: checkInTime
          })
        ]);

        return checkInRecord;
      } catch (error) {
        console.error('Error checking in:', error);
        throw error;
      }
    },

    async loadMeeting(meetingKey: string) {
      const persistentStore = usePersistentStore();
      const [record, checkIns] = await Promise.all([
        persistentStore.getRecord('meetings', meetingKey),
        persistentStore.findRecords('check-ins', `/meetings/${meetingKey}`)
      ]);
      if (record) {
        record.checkIns = checkIns || [];
        return record;
      }
    },

    async updateCheckInStatus(payload: {
      meetingKey: string;
      checkInKey: string;
      student: string;
      status: MeetingCheckInModel['status'];
    }) {
      const persistentStore = usePersistentStore();
      try {
        const path = `/meetings/${payload.meetingKey}`
        const existingRecord = await persistentStore.getRecord('check-ins', payload.student, path);
        const marked = existingRecord?.status == 'check-in' || payload.status != 'check-in';
        const now = date.formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
        await persistentStore.updateRecord('check-ins', payload.student, {
          status: payload.status,
          checkInTime: existingRecord?.checkInTime || now,
          markedInTime: marked ? now : ''
        }, path);
        return true;
      } catch (error) {
        console.error('Error updating check-in status:', error);
        throw error;
      }
    },
    async latestCallMeeting(meetingKey: string) {
      try {
        const persistentStore = usePersistentStore();
        const existingMeeting = await persistentStore.getRecord('meetings', meetingKey);
        if (!existingMeeting) {
          throw new Error('Meeting not found');
        }
        const now = date.formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
        await persistentStore.updateRecord('meetings', meetingKey, {
          latestCall: now
        });

        return true;
      } catch (error) {
        console.error('Error updating meeting:', error);
        throw error;
      }
    },
    async concludeMeeting(meetingKey: string) {
      try {
        const persistentStore = usePersistentStore();
        const existingMeeting = await persistentStore.getRecord('meetings', meetingKey);
        if (!existingMeeting) {
          throw new Error('Meeting not found');
        }
        const now = date.formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
        await persistentStore.updateRecord('meetings', meetingKey, {
          status: 'concluded',
          latestCall: now
        });

        return true;
      } catch (error) {
        console.error('Error concluding meeting:', error);
        throw error;
      }
    },

    async reopenMeeting(meetingKey: string) {
      try {
        const persistentStore = usePersistentStore();
        const existingMeeting = await persistentStore.getRecord('meetings', meetingKey);
        if (!existingMeeting) {
          throw new Error('Meeting not found');
        }
        await persistentStore.updateRecord('meetings', meetingKey, {
          status: 'open'
        });

        return true;
      } catch (error) {
        console.error('Error re-opening meeting:', error);
        throw error;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAttendanceStore, import.meta.hot));
}
