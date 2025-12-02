import { firebaseService } from './firebase-service';

export type AttendanceRecord = {
  id?: string;
  studentId?: string;
  sessionId?: string;
  timestamp?: string | Date;
  status?: 'present' | 'absent' | 'late' | 'check-in' | 'unknown';
  [k: string]: any;
};

export type Student = {
  id: string;
  name?: string;
  section?: string;
  [k: string]: any;
};

/**
 * Fetch students by class `section`.
 * The app stores enrolled students inside `classes` documents, so we
 * collect enrolled lists from classes matching the section.
 */
export async function fetchStudents(section?: string): Promise<Student[]> {
  if (!section) return [];
  // find classes with this section
  const classes = await firebaseService.findRecords('classes', undefined, [{ section: { '==': section } } as any]);
  const students: Student[] = [];
  for (const cls of classes as any[]) {
    // enrolled students are stored as a subcollection 'enrolled' under the class
    try {
      const enrolled = await firebaseService.findRecords('enrolled', `/classes/${cls.key}`);
      if (enrolled && Array.isArray(enrolled)) {
        for (const s of enrolled as any[]) {
          students.push({ id: s.key || s.id || s.ownerKey || '', name: s.fullName || s.name || '', section: cls.section });
        }
      }
    } catch (err) {
      // ignore and continue
      console.error('Error loading enrolled for class', cls.key, err);
    }
  }

  return students;
}

/**
 * Fetch attendance records (as flat list) for classes in the given section
 * and optionally filtered by date range. This function reads `meetings`
 * and the subcollection `check-ins` for each meeting.
 */
export async function fetchAttendanceRecords(opts?: {
  section?: string;
  dateFrom?: Date | undefined;
  dateTo?: Date | undefined;
}): Promise<AttendanceRecord[]> {
  const { section, dateFrom, dateTo } = opts ?? {};

  // find classes for the section
  const classes = section
    ? (await firebaseService.findRecords('classes', undefined, [{ section: { '==': section } } as any]))
    : (await firebaseService.findRecords('classes'));

  const classKeys = (classes as any[]).map((c) => c.key).filter(Boolean);
  const results: AttendanceRecord[] = [];

  // for each class, load meetings and their check-ins
  for (const ck of classKeys) {
    const meetings = await firebaseService.findRecords('meetings', undefined, [{ classKey: { '==': ck } } as any]);
    for (const m of meetings) {
      // parse meeting date
      let meetingDate: Date | undefined;
      if (m.date) {
        try {
          // support formats like YYYY/MM/DD HH:mm and YYYY-MM-DD HH:mm
          const normalized = String(m.date).replace(/\//g, '-');
          meetingDate = new Date(normalized);
          if (isNaN(meetingDate.getTime())) meetingDate = undefined;
        } catch {
          meetingDate = undefined;
        }
      }

      if (dateFrom && meetingDate && meetingDate < dateFrom) continue;
      if (dateTo && meetingDate && meetingDate > dateTo) continue;

      if (!m.key) continue;

      const checkIns = await firebaseService.findRecords('check-ins', `/meetings/${m.key}`);
      for (const ci of checkIns as any[]) {
        results.push({
          id: ci.key || ci.id,
          studentId: ci.key,
          sessionId: m.key,
          timestamp: ci.checkInTime,
          status: ci.status || 'unknown',
          meetingDate: m.date,
          classKey: m.classKey,
        });
      }
    }
  }

  return results;
}

export type StudentSummary = {
  studentId: string;
  name?: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  presencePercent: number;
};

export function computeSummaries(
  students: Student[],
  records: AttendanceRecord[]
): StudentSummary[] {
  const map = new Map<
    string,
    { present: number; absent: number; late: number; sessions: Set<string> }
  >();

  for (const s of students) {
    map.set(s.id, {
      present: 0,
      absent: 0,
      late: 0,
      sessions: new Set<string>()
    });
  }

  for (const r of records) {
    const sid = r.studentId ?? "";
    if (!sid) continue;

    const stored = map.get(sid) ?? {
      present: 0,
      absent: 0,
      late: 0,
      sessions: new Set<string>()
    };

    const sess = r.sessionId ?? r.id ?? "__unknown_session__";
    stored.sessions.add(sess);

    if (r.status === "present") stored.present++;
    else if (r.status === "absent") stored.absent++;
    else if (r.status === "late") stored.late++;

    map.set(sid, stored);
  }

  const out: StudentSummary[] = [];

  for (const s of students) {
    const stats = map.get(s.id) ?? {
      present: 0,
      absent: 0,
      late: 0,
      sessions: new Set<string>()
    };

    const total = stats.sessions.size;
    const percent = total === 0 ? 0 : (stats.present / total) * 100;

    out.push({
      studentId: s.id,
      name: s.name ?? "",
      totalSessions: total,
      presentCount: stats.present,
      absentCount: stats.absent,
      lateCount: stats.late,
      presencePercent: Math.round(percent * 100) / 100
    });
  }

  return out;
}
