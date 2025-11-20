/* src/services/attendanceService.ts
   Firestore v9 modular SDK service for attendance reporting.
   Edit collection names if your schema is different.
*/

import { getFirestore, collection, getDocs, query, where, DocumentData } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";

const db = getFirestore();

export type AttendanceRecord = {
  id?: string;
  studentId?: string;
  sessionId?: string;
  timestamp?: Timestamp | string;
  status?: "present" | "absent" | "late" | string;
  [k: string]: any;
};

export type Student = {
  id: string;
  name?: string;
  section?: string;
  [k: string]: any;
};

/** Explicitly allow undefined in optional props to satisfy strict TS */
export async function fetchStudents(section?: string | undefined): Promise<Student[]> {
  const col = collection(db, "students");
  let q: any = col;
  if (section !== undefined && section !== "") {
    q = query(col, where("section", "==", section));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as DocumentData) }));
}

/**
 * Fetch attendance records
 * opts.section?: string | undefined
 * opts.dateFrom?: Date | undefined
 * opts.dateTo?: Date | undefined
 */
export async function fetchAttendanceRecords(opts?: {
  section?: string | undefined;
  dateFrom?: Date | undefined;
  dateTo?: Date | undefined;
}): Promise<AttendanceRecord[]> {
  const { section, dateFrom, dateTo } = opts ?? {};
  // NOTE: This fetches top-level 'attendance' collection. Adjust if your schema uses subcollections.
  const col = collection(db, "attendance");
  const snap = await getDocs(col);
  const raw = snap.docs.map(d => ({ id: d.id, ...(d.data() as AttendanceRecord) }));

  // Filter by date range if timestamp present
  const filtered = raw.filter(r => {
    if (!r.timestamp) return true; // keep if no timestamp
    const tsDate = (r.timestamp as any)?.toDate ? (r.timestamp as any).toDate() : new Date(String(r.timestamp));
    if (dateFrom && tsDate < dateFrom) return false;
    if (dateTo && tsDate > dateTo) return false;
    return true;
  });

  // If section filter is required but attendance docs don't have section,
  // consumer should fetch sessions and join; this service leaves flexibility.
  return filtered;
}

/** Summary type for UI */
export type StudentSummary = {
  studentId: string;
  name?: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  presencePercent: number; // 0-100
};

/** Compute per-student summaries */
export function computeSummaries(students: Student[], records: AttendanceRecord[]): StudentSummary[] {
  const map = new Map<string, { present: number; absent: number; late: number; sessions: Set<string> }>();

  for (const s of students) {
    map.set(s.id, { present: 0, absent: 0, late: 0, sessions: new Set<string>() });
  }

  for (const r of records) {
    const sid = r.studentId ?? "";
    if (!sid) continue;
    const stored = map.get(sid) ?? { present: 0, absent: 0, late: 0, sessions: new Set<string>() };
    const sess = r.sessionId ?? (r.id ?? "__unknown_session__");
    stored.sessions.add(sess);
    if (r.status === "present") stored.present++;
    else if (r.status === "absent") stored.absent++;
    else if (r.status === "late") stored.late++;
    else {
      // fallback: check boolean present field
      const anyPresent = (r as any).present;
      if (typeof anyPresent === "boolean") {
        if (anyPresent) stored.present++;
        else stored.absent++;
      }
    }
    map.set(sid, stored);
  }

  const out: StudentSummary[] = [];
  for (const s of students) {
    const stats = map.get(s.id) ?? { present: 0, absent: 0, late: 0, sessions: new Set<string>() };
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
