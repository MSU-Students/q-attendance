/**
 * Firestore Dynamic Attendance Seeder
 * Fetches all students in a section and generates random attendance
 * Usage: npx ts-node scripts/seed-attendance-dynamic.ts
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  DocumentData
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

// 1️⃣ Firebase config (replace with your own)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2️⃣ Seeder configuration
const section = "Ee";          // Section you want to seed
const classKey = "a86f8ae6-6f4b-48ed-8120-66ee61a1ef51"; // Class key
const numberOfMeetings = 5;    // Number of sessions to generate
const statuses: ("present" | "absent" | "late")[] = ["present", "absent", "late"];

async function fetchStudents(section: string) {
  const col = collection(db, "students");
  const q = query(col, where("section", "==", section));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as DocumentData) }));
}

async function main() {
  const students = await fetchStudents(section);

  if (!students.length) {
    console.log(`❌ No students found in section "${section}"`);
    return;
  }

  console.log(`Found ${students.length} students in section "${section}"`);

  for (let meeting = 1; meeting <= numberOfMeetings; meeting++) {
    const sessionId = uuidv4();
    const date = new Date();
    date.setDate(date.getDate() - (numberOfMeetings - meeting));

    for (const student of students) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      await addDoc(collection(db, "attendance"), {
        id: uuidv4(),
        studentId: student.id,
        sessionId,
        timestamp: date,
        status,
        classKey,
        section,
      });

      console.log(`Added attendance for ${student.id}, meeting ${meeting}: ${status}`);
    }
  }

  console.log("✅ Dynamic attendance seeding completed!");
}

main().catch(console.error);
