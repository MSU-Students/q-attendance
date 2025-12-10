import { boot } from 'quasar/wrappers';
import { useAttendanceStore } from 'src/stores/attendance-store';

export default boot(() => {
  const attendanceStore = useAttendanceStore();
  // start validation scheduler every 10 minutes
  attendanceStore.startValidationScheduler(10 * 60 * 1000);
});
