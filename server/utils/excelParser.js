import XLSXLibrary from 'xlsx'; // Correct default import for 'xlsx'
import fs from 'fs';

// This line assigns the imported object to the variable name used throughout the function.
const XLSX = XLSXLibrary;

/**
 * Parses an Excel or CSV file and validates student data.
 * @param {string} filePath - The temporary path where the file was uploaded by multer.
 * @returns {{ data: Array<Object>, errors: Array<string> }} An object containing the parsed student data and any validation errors.
 */
export const parseAndValidateStudents = (filePath) => {
  const data = [];
  const errors = [];

  // Define the required headers
  const requiredHeaders = ['StudentID', 'Name', 'Course', 'Section', 'Email'];
  let workbook;

  try {
    // 1. READ FILE CONTENT AS BINARY BUFFER
    if (!fs.existsSync(filePath)) {
      errors.push('Critical error: Uploaded file not found on the server.');
      return { data: [], errors };
    }

    const fileBuffer = fs.readFileSync(filePath);

    // 2. USE THE BUFFER TO READ THE WORKBOOK
    // XLSX.read is the correct function to use with a buffer.
    workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  } catch (e) {
    // This catch block will now catch errors related to file corruption, not import errors.
    console.error('XLSX Read Error (using buffer):', e);
    // Include the error message from the exception for better debugging
    errors.push(
      `Error reading file structure. Please ensure the file is valid XLSX/CSV format. Detail: ${e.message}`,
    );
    return { data: [], errors };
  }

  // Ensure workbook has sheets
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    errors.push('Critical error: The spreadsheet contains no sheets.');
    return { data: [], errors };
  }

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    errors.push('Critical error: Cannot access the primary sheet.');
    return { data: [], errors };
  }

  // 2. CONVERT TO JSON (with header and null checks)
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (rawData.length === 0) {
    errors.push('Critical error: The sheet is empty.');
    return { data: [], errors };
  }

  // The first row is the header row
  const headers = rawData[0].map((h) => String(h).trim());
  const studentRows = rawData.slice(1);

  // 3. HEADER VALIDATION
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    errors.push(`Critical error: Missing required column(s): ${missingHeaders.join(', ')}`);
    // If critical headers are missing, stop processing data
    return { data: [], errors };
  }

  // 4. DATA VALIDATION AND CLEANUP
  studentRows.forEach((row, index) => {
    const student = {};
    let isValid = true;
    const rowIndex = index + 2; // +1 for 0-based index, +1 for header row

    // Map data using validated headers
    headers.forEach((header, colIndex) => {
      student[header] =
        row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]).trim() : '';
    });

    // Basic Data Presence Check
    requiredHeaders.forEach((header) => {
      if (!student[header]) {
        errors.push(`Row ${rowIndex}: '${header}' cannot be empty.`);
        isValid = false;
      }
    });

    // Basic StudentID validation (must be a number)
    if (student.StudentID && isNaN(Number(student.StudentID))) {
      errors.push(`Row ${rowIndex}: StudentID must be a number.`);
      isValid = false;
    }

    // Basic Email validation (not exhaustive, but checks for @)
    if (student.Email && !student.Email.includes('@')) {
      errors.push(`Row ${rowIndex}: Email format appears invalid.`);
      // This is a warning, so we still mark as valid
    }

    // Final structure preparation
    if (isValid) {
      data.push({
        StudentID: String(student.StudentID), // Ensure ID is a string for Firestore doc reference
        Name: student.Name,
        Course: student.Course,
        Section: student.Section,
        Email: student.Email,
        // Add default status or other initial properties here
      });
    }
  });

  return { data, errors };
};
