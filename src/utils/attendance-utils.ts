import type { ClassMeetingModel } from 'src/models/attendance.models';

export interface StudentAttendanceStats {
  presentCount: number;
  absentCount: number;
  lateCount: number;
  consecutiveAbsent: number;
  maxConsecutiveAbsences: number;
  totalMeetings: number;
  attendanceRate: number;
}

export interface AttendanceStatus {
  status: 'warning' | 'drop' | 'critical' | 'perfect' | 'good' | 'no-data';
  color: string;
  icon: string;
  conclusion: string;
  absentCount: number;
  lateCount: number;
  consecutiveAbsent: number;
  maxConsecutiveAbsences: number;
}

export function calculateStudentAttendance(
  meetings: ClassMeetingModel[],
  studentKey: string,
): StudentAttendanceStats {
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let consecutiveAbsent = 0;
  let maxConsecutiveAbsences = 0;

  meetings
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((meeting, index) => {
      const checkIn = meeting.checkIns?.find((ci) => ci.key === studentKey);

      if (checkIn) {
        if (checkIn.status === 'present' || checkIn.status === 'check-in') {
          presentCount++;
          if (consecutiveAbsent > 0) {
            maxConsecutiveAbsences = Math.max(maxConsecutiveAbsences, consecutiveAbsent);
            consecutiveAbsent = 0;
          }
        } else if (checkIn.status === 'absent') {
          absentCount++;
          consecutiveAbsent++;
        } else if (checkIn.status === 'late') {
          lateCount++;
          presentCount++;
          if (consecutiveAbsent > 0) {
            maxConsecutiveAbsences = Math.max(maxConsecutiveAbsences, consecutiveAbsent);
            consecutiveAbsent = 0;
          }
        }
      } else {
        absentCount++;
        consecutiveAbsent++;
      }

      // Handle end of meetings
      if (index === meetings.length - 1 && consecutiveAbsent > 0) {
        maxConsecutiveAbsences = Math.max(maxConsecutiveAbsences, consecutiveAbsent);
      }
    });

  const totalMeetings = meetings.length;
  const attendanceRate =
    totalMeetings > 0 ? Math.round(((presentCount + lateCount) / totalMeetings) * 100) : 0;

  return {
    presentCount,
    absentCount,
    lateCount,
    consecutiveAbsent,
    maxConsecutiveAbsences: maxConsecutiveAbsences > 1 ? maxConsecutiveAbsences : 0,
    totalMeetings,
    attendanceRate,
  };
}

export function getAttendanceStatus(
  stats: StudentAttendanceStats,
  studentName: string,
  meetings: ClassMeetingModel[],
  studentKey: string,
): AttendanceStatus {
  const { totalMeetings, absentCount, lateCount, consecutiveAbsent, maxConsecutiveAbsences } =
    stats;

  // No data for first meeting
  if (totalMeetings <= 1) {
    return {
      status: 'no-data',
      color: 'grey',
      icon: 'help_outline',
      conclusion: 'No available data for attendance analysis',
      absentCount: 0,
      consecutiveAbsent: 0,
      lateCount: 0,
      maxConsecutiveAbsences: 0
    };
  }

  // Drop (Highest Priority)
  if (maxConsecutiveAbsences >= 3 || absentCount >= 5) {
    let conclusion = 'Drop: ';
    const firstName = studentName.split(' ')[0];

    if (maxConsecutiveAbsences >= 3 && absentCount >= 5) {
      conclusion += `${firstName} reached 3 consecutive and 5 nonconsecutive absences`;
    } else if (maxConsecutiveAbsences >= 3) {
      const thirdAbsenceDate = getConsecutiveAbsenceDate(meetings, studentKey, 3);
      conclusion += `${firstName} reached 3 consecutive absences on ${thirdAbsenceDate}`;
    } else {
      conclusion += `${firstName} reached 5 nonconsecutive absences`;
    }

    return {
      status: 'drop',
      color: 'red',
      icon: 'error',
      conclusion,
      absentCount,
      lateCount,
      consecutiveAbsent,
      maxConsecutiveAbsences
    };
  }

  // Drop Risk
  if (consecutiveAbsent === 2 || absentCount === 4) {
    let conclusion = 'Drop Risk: ';
    const firstName = studentName.split(' ')[0];

    if (consecutiveAbsent === 2 && absentCount === 4) {
      conclusion += `${firstName} reached 2 consecutive and 4 nonconsecutive absences`;
    } else if (consecutiveAbsent === 2) {
      const secondAbsenceDate = getConsecutiveAbsenceDate(meetings, studentKey, 2);
      conclusion += `${firstName} reached 2 consecutive absences on ${secondAbsenceDate}`;
    } else {
      conclusion += `${firstName} reached 4 nonconsecutive absences`;
    }

    return {
      status: 'critical',
      color: 'orange',
      icon: 'warning',
      conclusion,
      consecutiveAbsent,
      absentCount,
      lateCount,
      maxConsecutiveAbsences
    };
  }

  // Perfect Attendance
  if (absentCount === 0 && lateCount === 0) {
    return {
      status: 'perfect',
      color: 'blue',
      icon: 'star',
      conclusion: `${studentName.split(' ')[0]} has perfect attendance`,
      consecutiveAbsent,
      absentCount,
      lateCount,
      maxConsecutiveAbsences
    };
  }

  // Good (Default)
  return {
    status: 'good',
    color: 'green',
    icon: 'check_circle',
    conclusion: `${studentName.split(' ')[0]} has a good attendance status`,
    consecutiveAbsent,
    absentCount,
    lateCount,
    maxConsecutiveAbsences
  };
}

function getConsecutiveAbsenceDate(
  meetings: ClassMeetingModel[],
  studentKey: string,
  targetCount: number,
): string {
  const sortedMeetings = meetings.sort((a, b) => a.date.localeCompare(b.date));
  let consecutiveCount = 0;

  for (const meeting of sortedMeetings) {
    const checkIn = meeting.checkIns?.find((ci) => ci.key === studentKey);

    if (checkIn?.status === 'absent' || !checkIn) {
      consecutiveCount++;
      if (consecutiveCount === targetCount) {
        return meeting.date;
      }
    } else {
      consecutiveCount = 0;
    }
  }

  return 'Unknown';
}

// Separate display formatting function - keeps calculation logic pure
export function formatConsecutiveAbsentDisplay(
  consecutiveAbsent: number,
  maxConsecutiveAbsences: number,
): string | number {
  return maxConsecutiveAbsences >= 3 || consecutiveAbsent >= 3 ? 'DROP' : consecutiveAbsent;
}
