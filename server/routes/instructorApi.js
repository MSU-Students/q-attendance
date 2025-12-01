import { Router } from 'express';
import multer from 'multer';
import { db } from '../index.js'; // This import now works because 'db' is exported in index.js
import { parseAndValidateStudents } from '../utils/excelParser.js';
import fs from 'fs';

const router = Router();

// --- Multer Configuration for temporary file storage ---
// 'dest' specifies where to store the files temporarily
const upload = multer({ dest: 'temp/' });

/**
 * POST /api/instructor/preview-upload
 * Uploads a student roster file, parses it, validates it, and returns the data for preview.
 * The file is deleted immediately after processing.
 */
router.post('/preview-upload', upload.single('studentFile'), async (req, res) => {
  // 1. Check for file upload success
  if (!req.file) {
    return res.status(400).json({ errors: ['No file uploaded.'] });
  }

  const filePath = req.file.path;

  try {
    // 2. Parse and validate the Excel file
    const { data, errors } = parseAndValidateStudents(filePath);

    // 3. Respond with results
    // If there were critical errors (which stop data processing), return 400
    if (data.length === 0 && errors.length > 0) {
      return res.status(400).json({ data, errors });
    }

    // Success: Return data and any non-critical warnings
    return res.status(200).json({
      data,
      errors: errors.filter((e) => e.includes('warning') || e.includes('appears invalid')),
    });
  } catch (e) {
    console.error('File Preview Error:', e);
    return res
      .status(500)
      .json({ data: [], errors: ['Server failed to process the file structure.'] });
  } finally {
    // 4. Clean up the temporary file regardless of success or failure
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up temporary file: ${filePath}`);
    }
  }
});

/**
 * POST /api/instructor/save-upload
 * Uploads a student roster file, validates it, and saves the data to Firestore.
 */
router.post('/save-upload', upload.single('studentFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ errors: ['No file uploaded for saving.'] });
  }

  const filePath = req.file.path;
  let studentsToSave = [];

  try {
    // 1. Parse and validate the file
    const { data, errors } = parseAndValidateStudents(filePath);

    if (data.length === 0 && errors.length > 0) {
      // Return immediate error if critical errors found during validation
      return res.status(400).json({ message: 'Validation failed.', errors });
    }

    studentsToSave = data;

    // --- FIREBASE BATCH SAVE OPERATION ---
    const batch = db.batch();
    const studentsCollection = db.collection('students');
    let writeCount = 0;

    // Note: Firestore batch size limit is 500 operations. Our 3 students are safe.
    studentsToSave.forEach((student) => {
      // Use the StudentID as the document ID for easy lookup and uniqueness
      const docRef = studentsCollection.doc(student.StudentID);
      batch.set(docRef, {
        Name: student.Name,
        Course: student.Course,
        Section: student.Section,
        Email: student.Email,
        // Initialize default attendance status or other fields
        status: 'active',
        lastAttendance: null,
        createdAt: new Date(),
      });
      writeCount++;
    });

    // 2. Commit the batch write operation
    await batch.commit();

    // 3. Success response
    return res.status(200).json({
      message: `Successfully imported ${writeCount} students.`,
      errors: [],
    });
  } catch (e) {
    // 4. Handle database or parsing errors
    console.error('Database save error:', e);
    return res.status(500).json({
      message: 'Failed to save data to the database.',
      errors: [
        `Database transaction failed. Error detail: ${e.message}. (Check serviceAccountKey.json and Firestore access).`,
      ],
    });
  } finally {
    // 5. Clean up the temporary file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up temporary file: ${filePath}`);
    }
  }
});

export default router;
