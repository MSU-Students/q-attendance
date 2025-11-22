/* src/services/attendanceService.ts
   Firestore v9 modular SDK service for attendance reporting.
*/

import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  DocumentData
} from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";

const db = getFirestore();

export type AttendanceRecord = {
  id?: string;
  studentId?: string;
  sessionId?: string;
  timestamp?: Timestamp | string;
  status?: "present" | "absent" | "late"; // strict, no redundant string
  [k: string]: any;
};

export type Student = {
  id: string;
  name?: string;
  section?: string;
  [k: string]: any;
};

export async function fetchStudents(section?: string): Promise<Student[]> {
  const col = collection(db, "students");
  let q: any = col;

  if (section && section !== "") {
    q = query(col, where("section", "==", section));
  }

  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...(d.data() as DocumentData)
  }));
}

export async function fetchAttendanceRecords(opts?: {
  section?: string | undefined;
  dateFrom?: Date | undefined;
  dateTo?: Date | undefined;
}): Promise<AttendanceRecord[]> {
  const { dateFrom, dateTo } = opts ?? {};

  const col = collection(db, "attendance");
  const snap = await getDocs(col);

  const raw = snap.docs.map(d => ({
    id: d.id,
    ...(d.data() as AttendanceRecord)
  }));

  const filtered = raw.filter(r => {
    if (!r.timestamp) return true;
    const tsDate = (r.timestamp as any).toDate
      ? (r.timestamp as any).toDate()
      : new Date(String(r.timestamp));

    if (dateFrom && tsDate < dateFrom) return false;
    if (dateTo && tsDate > dateTo) return false;

    return true;
  });

  return filtered;
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

    const stored =
      map.get(sid) ??
      {
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
    const stats =
      map.get(s.id) ??
      {
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
