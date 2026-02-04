import { defineStore, acceptHMRUpdate } from 'pinia';
import { date } from 'quasar';
import type { ClassMeetingModel, MeetingCheckInModel } from 'src/models/attendance.models';
import { usePersistentStore } from './persistent-store';
import { firebaseService } from 'src/services/firebase-service';

function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // meters
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    meetings: [] as ClassMeetingModel[]
  }),

  getters: {

  },
  actions: {
    _validationSchedulerId: undefined as number | undefined,

    startValidationScheduler(intervalMs: number = 10 * 60 * 1000) {
      if (this._validationSchedulerId) return;
      this._validationSchedulerId = setInterval(async () => {
        try {
          // Run validation for recently concluded meetings (last 7 days)
          const persistentStore = usePersistentStore();
          const meetings = await persistentStore.findRecords('meetings');
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 7);
          const recent = meetings.filter(m => m.status === 'concluded' && new Date(m.date) >= cutoff);
          for (const m of recent) await this.validateMeeting(m.key);
        } catch (err) {
          console.error('Validation scheduler error', err);
        }
      }, intervalMs) as unknown as number;
    },

    stopValidationScheduler() {
      if (this._validationSchedulerId) {
        clearInterval(this._validationSchedulerId);
        this._validationSchedulerId = undefined;
      }
    },
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
        const endOfWeek = new Date();
        endOfWeek.setDate(endOfWeek.getDate() + 7 - endOfWeek.getDay());
        endOfWeek.setHours(23, 59, 59);
        const records = await persistentStore.findRecords('meetings', undefined, {
          classKey: { '==': classKey },
          date: { '<=': date.formatDate(endOfWeek, 'YYYY/MM/DD') }
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
    async loadMeetings(classKeys: string[], targetDate: string | Date, targetEndDate?: Date) {
      const persistentStore = usePersistentStore();
      const startDate = new Date(targetDate);
      startDate.setHours(0, 0, 0);
      const endDate = new Date(targetEndDate || targetDate);
      endDate.setHours(23, 59, 59);
      const records = await persistentStore.findRecords('meetings', undefined, {
        classKey: { 'in': classKeys },
        date: {
          '>=': date.formatDate(startDate, 'YYYY/MM/DD HH:mm'),
          '<=': date.formatDate(endDate, 'YYYY/MM/DD HH:mm')
        }
      });
      return records;
    },
    streamClassMeetings(classKey: string, options: {
      student?: string | undefined
      loadAllCheckIns?: boolean
      onSnapshot: (meetings: ClassMeetingModel[]) => void | Promise<void>
    }) {
      const persistentStore = usePersistentStore();
      const endOfWeek = new Date();
      endOfWeek.setDate(endOfWeek.getDate() + 7 - endOfWeek.getDay());
      endOfWeek.setHours(23, 59, 59);
      return firebaseService.streamRecords('meetings', {
        condition: { classKey: { '==': classKey }, 'date': { '<=': date.formatDate(endOfWeek, 'YYYY/MM/DD') } },
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
      status: MeetingCheckInModel['status'],
      location?: { lat: number; lng: number } | undefined
    }) {
      try {
        const persistentStore = usePersistentStore();
        const checkInTime = date.formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
        const checkInRecord: MeetingCheckInModel = {
          key: payload.student,
          checkInTime: checkInTime,
          status: payload.status || 'check-in',
          validation: { status: 'unverified' },
          location: payload.location,
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

        // Auto-validate the new check-in
        try {
          await this.validateCheckIn(payload.meeting.key, checkInRecord.key);
        } catch (err) {
          console.error('Error auto-validating new check-in:', err);
        }

        return checkInRecord;
      } catch (error) {
        console.error('Error checking in:', error);
        throw error;
      }
    },

    async validateCheckIn(meetingKey: string, checkInKey?: string) {
      try {
        const persistentStore = usePersistentStore();
        const meeting = await persistentStore.getRecord('meetings', meetingKey);
        if (!meeting) throw new Error('Meeting not found');
        if (meeting.status == 'cancelled') {
          return;
        }
        const checkIns = await persistentStore.findRecords('check-ins', `/meetings/${meetingKey}`);
        const meetingDate = new Date(meeting.date);
        const cuValidWindowStart = new Date(meetingDate.getTime() - 60 * 60 * 1000); // 60 mins before
        const cuValidWindowEnd = new Date(meetingDate.getTime() + 30 * 60 * 1000); // 30 mins after

        const targets = checkIns.filter((c: any) => (checkInKey ? c.key === checkInKey : true));
        for (const rec of targets) {
          const checkInTime = new Date(rec.checkInTime || '');
          // Haversine distance check
          let status: MeetingCheckInModel['validation'] = { status: 'valid' as const };
          if (meeting.location && rec.location) {
            const distanceMeters = haversineDistanceMeters(meeting.location.lat, meeting.location.lng, rec.location.lat, rec.location.lng);
            // Define threshold (meters)
            const threshold = 200;
            if (distanceMeters > threshold) {
              status = { status: 'invalid', reason: `Check-in too far from meeting location (${Math.round(distanceMeters)}m)` };
            }
          }
          if (!rec.checkInTime) {
            status = { status: 'invalid', reason: 'No check-in time recorded' };
          } else if (rec.status === 'absent') {
            status = { status: 'invalid', reason: 'Marked absent' };
          } else if (isNaN(checkInTime.getTime())) {
            status = { status: 'invalid', reason: 'Invalid check-in time' };
          } else if (checkInTime < cuValidWindowStart || checkInTime > cuValidWindowEnd) {
            status = { status: 'invalid', reason: 'Check-in outside allowed time window' };
          } else {
            status = { status: 'valid' };
          }

          // Update validation and append to history
          const now = date.formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
          const historyEntry = { status: status.status, reason: status.reason!, by: 'system', date: now };
          const existingHistory = rec.validationHistory || [];
          existingHistory.push({
            ...historyEntry,
            date: now,
            status: 'unverified',

          });
          await persistentStore.updateRecord('check-ins', rec.key, { validation: status, validationHistory: existingHistory }, `/meetings/${meetingKey}`);
        }
        return true;
      } catch (error) {
        console.error('Error validating check-in:', error);
        throw error;
      }
    },

    async validateMeeting(meetingKey: string) {
      try {
        const persistentStore = usePersistentStore();
        const checkIns = await persistentStore.findRecords('check-ins', `/meetings/${meetingKey}`);
        for (const c of checkIns) {
          await this.validateCheckIn(meetingKey, c.key);
        }
        return true;
      } catch (error) {
        console.error('Error validating meeting check-ins:', error);
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
        if (existingRecord) {
          await persistentStore.updateRecord('check-ins', payload.student, {
            status: payload.status,
            checkInTime: existingRecord?.checkInTime || now,
            markedInTime: marked ? now : ''
          }, path);
        } else {
          await persistentStore.createRecord('check-ins', {
            status: payload.status,
            checkInTime: now,
            markedInTime: marked ? now : '',
            key: payload.student
          }, path);
        }
        return true;
      } catch (error) {
        console.error('Error updating check-in status:', error);
      }
    },

    async updateCheckInValidation(payload: { meetingKey: string; checkInKey: string; status: 'valid' | 'invalid' | 'unverified'; reason?: string; by?: string }) {
      try {
        const persistentStore = usePersistentStore();
        const path = `/meetings/${payload.meetingKey}`;
        const existing = await persistentStore.getRecord('check-ins', payload.checkInKey, path) as any;
        if (!existing) throw new Error('Check-in not found');
        const now = date.formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
        const history = existing.validationHistory || [];
        history.push({ status: payload.status, reason: payload.reason, by: payload.by || 'teacher', date: now });
        await persistentStore.updateRecord('check-ins', payload.checkInKey, {
          validation: {
            status: payload.status, reason: payload.reason!
          },
          validationHistory: history
        }, path);
        return true;
      } catch (err) {
        console.error('Error updating check-in validation override:', err);
        throw err;
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

        // Trigger automated validation when meeting is concluded
        try {
          await this.validateMeeting(meetingKey);
        } catch (err) {
          // Validation failure shouldn't block the conclusion; log the error
          console.error('Automated validation failed for meeting after conclusion:', err);
        }

        return true;
      } catch (error) {
        console.error('Error concluding meeting:', error);
        throw error;
      }
    },
    async cancelMeeting(meetingKey: string) {
      try {
        const persistentStore = usePersistentStore();
        const existingMeeting = await persistentStore.getRecord('meetings', meetingKey);
        if (!existingMeeting) {
          throw new Error('Meeting not found');
        }
        const now = date.formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
        await persistentStore.updateRecord('meetings', meetingKey, {
          status: 'cancelled',
          latestCall: now
        });

        // Trigger automated validation when meeting is concluded
        try {
          await this.validateMeeting(meetingKey);
        } catch (err) {
          // Validation failure shouldn't block the conclusion; log the error
          console.error('Automated validation failed for meeting after conclusion:', err);
        }

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
