import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as express from 'express';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Request, Response } from 'express';

admin.initializeApp();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));

interface ParsedUser {
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  status?: string;
  [key: string]: string | undefined;
}

interface UploadResponse {
  success: number;
  failed: number;
  duplicates: number;
  errors: Array<{
    row: number;
    data: ParsedUser;
    error: string;
  }>;
  duplicateEmails: string[];
}

/**
 * Parse Excel file buffer and extract user data
 */
function parseExcelFile(buffer: Buffer): ParsedUser[] {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('No sheets found in Excel file');
    }
    const sheet = workbook.Sheets[sheetName];
    const rows: ParsedUser[] = XLSX.utils.sheet_to_json(sheet);
    return rows;
  } catch (error) {
    console.error('Excel parsing error:', error);
    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse CSV text and extract user data
 */
function parseCSVFile(text: string): ParsedUser[] {
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as ParsedUser[];
        resolve(rows);
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
    });
  });
}

/**
 * Validate user data
 */
function validateUser(user: ParsedUser, row: number): { valid: boolean; error?: string } {
  if (!user.email || typeof user.email !== 'string') {
    return { valid: false, error: `Row ${row}: Email is required` };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    return { valid: false, error: `Row ${row}: Invalid email format` };
  }
  return { valid: true };
}

/**
 * Cloud Function: Upload users from Excel/CSV file
 */
app.post('/uploadUsers', async (req: Request, res: Response) => {
  try {
    const { fileData, fileName, columnMapping } = req.body;

    if (!fileData || !fileName) {
      return res.status(400).json({ error: 'Missing fileData or fileName' });
    }

    // Decode base64 file data
    const buffer = Buffer.from(fileData, 'base64');

    // Parse file based on extension
    let rows: ParsedUser[] = [];
    const isExcel = /\.(xlsx?|xls)$/i.test(fileName);

    if (isExcel) {
      rows = parseExcelFile(buffer);
    } else {
      const text = buffer.toString('utf-8');
      rows = await parseCSVFile(text);
    }

    if (rows.length === 0) {
      return res.status(400).json({ error: 'No data found in file' });
    }

    // Apply column mapping if provided
    if (columnMapping) {
      rows = rows.map((row) => {
        const mapped: ParsedUser = {};
        for (const [csvColumn, dbField] of Object.entries(columnMapping)) {
          if (row[csvColumn]) {
            mapped[dbField as string] = row[csvColumn];
          }
        }
        return mapped;
      });
    }

    // Validate and check for duplicates
    const db = admin.firestore();
    const response: UploadResponse = {
      success: 0,
      failed: 0,
      duplicates: 0,
      errors: [],
      duplicateEmails: [],
    };

    // Get existing emails for duplicate detection
    const existingUsersSnapshot = await db.collection('users').get();
    const existingEmails = new Set(
      existingUsersSnapshot.docs.map((doc) => (doc.data() as ParsedUser).email?.toLowerCase())
    );

    const newEmails = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because of 0-index and header row

      // Validate
      const validation = validateUser(row, rowNumber);
      if (!validation.valid) {
        response.failed++;
        response.errors.push({
          row: rowNumber,
          data: row,
          error: validation.error || 'Validation failed',
        });
        continue;
      }

      const emailLower = row.email!.toLowerCase();

      // Check for duplicates in existing DB or current batch
      if (existingEmails.has(emailLower)) {
        response.duplicates++;
        response.duplicateEmails.push(row.email!);
        continue;
      }

      if (newEmails.has(emailLower)) {
        response.duplicates++;
        response.duplicateEmails.push(row.email!);
        continue;
      }

      newEmails.add(emailLower);

      // Insert into Firestore
      try {
        const userData = {
          ...row,
          key: '', // Will be set by Firestore
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await db.collection('users').add(userData);
        // Update with document ID as key
        await docRef.update({ key: docRef.id });

        response.success++;
      } catch (error) {
        response.failed++;
        response.errors.push({
          row: rowNumber,
          data: row,
          error: error instanceof Error ? error.message : 'Failed to create user',
        });
      }
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});

// Export the Cloud Function
export const api = functions.https.onRequest(app);
