import { firebaseService } from './firebase-service';

export type ImportFormat = 'csv' | 'json';

export interface ImportOptions {
	collection: string;
	format?: ImportFormat;
	timeoutMs?: number; // per-record timeout
	concurrency?: number; // how many parallel writes
	validateRecord?: (record: any) => Promise<boolean> | boolean;
	user?: { uid?: string; email?: string } | null;
}

export interface ImportFailure {
	index: number;
	record: any;
	error: string;
}

export interface ImportSummary {
	total: number;
	succeeded: number;
	failed: number;
	failures: ImportFailure[];
}

function parseCSV(text: string): any[] {
	const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
	if (!lines.length) return [];
	const headers = lines[0].split(',').map((h) => h.trim());
	const rows = lines.slice(1);
	return rows.map((r) => {
		const cols = r.split(',').map((c) => c.trim());
		const obj: any = {};
		for (let i = 0; i < headers.length; i++) {
			obj[headers[i]] = cols[i] ?? '';
		}
		return obj;
	});
}

function parseJSON(text: string): any[] {
	try {
		const parsed = JSON.parse(text);
		if (Array.isArray(parsed)) return parsed;
		if (typeof parsed === 'object' && parsed !== null) return [parsed];
	} catch (err) {
		throw new Error('Invalid JSON');
	}
	return [];
}

function withTimeout<T>(p: Promise<T>, ms: number, message?: string): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | null = null;
	const timeout = new Promise<T>((_res, rej) => {
		timer = setTimeout(() => rej(new Error(message || `timeout after ${ms}ms`)), ms);
	});
	return Promise.race([p, timeout]).then((res) => {
		if (timer) clearTimeout(timer);
		return res as T;
	});
}

function saveFailuresLocally(key: string, failures: ImportFailure[]) {
	try {
		const existing = JSON.parse(localStorage.getItem(key) || '[]');
		const merged = existing.concat(failures);
		localStorage.setItem(key, JSON.stringify(merged));
	} catch (e) {
		// ignore localStorage errors
		// eslint-disable-next-line no-console
		console.error('Failed to persist import failures locally', e);
	}
}

export class ImportService {
	private localLogKey = 'import-failures';

	async importFromText(input: string, options: ImportOptions): Promise<{ summary: ImportSummary; message: string }> {
		const format = options.format || 'csv';
		let records: any[] = [];
		try {
			if (format === 'csv') records = parseCSV(input);
			else records = parseJSON(input);
		} catch (err: any) {
			throw new Error(`Failed to parse input: ${err?.message || err}`);
		}

		return this.importRecords(records, options);
	}

	async importFromFile(file: File, options: ImportOptions): Promise<{ summary: ImportSummary; message: string }> {
		if (!file) throw new Error('No file provided');
		const text = await file.text();
		return this.importFromText(text, options);
	}

	private async importRecords(records: any[], options: ImportOptions): Promise<{ summary: ImportSummary; message: string }> {
		const total = records.length;
		const timeoutMs = options.timeoutMs ?? 10_000;
		const concurrency = Math.max(1, options.concurrency ?? 3);
		const failures: ImportFailure[] = [];
		let succeeded = 0;

		const validate = options.validateRecord ?? (() => true);

		// process in parallel batches
		const queue = [...records.entries()]; // [index, record]

		const workers: Promise<void>[] = [];

		const workerFn = async () => {
			while (queue.length) {
				const [idx, record] = queue.shift() as [number, any];
				try {
					const ok = await Promise.resolve(validate(record));
					if (!ok) {
						failures.push({ index: idx, record, error: 'validation failed' });
						continue;
					}

					// call firebase create with timeout
					try {
						// Firestore write
						await withTimeout((firebaseService as any).createRecord(options.collection, record), timeoutMs, 'write timeout');
						succeeded++;
					} catch (writeErr: any) {
						failures.push({ index: idx, record, error: String(writeErr?.message || writeErr) });
						// log to console for debugging
						// eslint-disable-next-line no-console
						console.error('Import write failed', { index: idx, record, error: writeErr });
					}
				} catch (err: any) {
					failures.push({ index: idx, record, error: String(err?.message || err) });
				}
			}
		};

		for (let i = 0; i < concurrency; i++) workers.push(workerFn());
		await Promise.all(workers);

		// Persist failures locally and attempt to log to Firestore
		if (failures.length) {
			saveFailuresLocally(this.localLogKey, failures);
			// best-effort attempt to write a log document to Firestore
			try {
				// @ts-ignore - dynamic collection used for logging
				await (firebaseService as any).createRecord('import-logs', {
					timestamp: new Date().toISOString(),
					user: options.user ?? null,
					collection: options.collection,
					total,
					failed: failures.length,
					failures: failures.slice(0, 50), // cap to avoid huge docs
				});
			} catch (e) {
				// eslint-disable-next-line no-console
				console.warn('Failed to write import log to Firestore', e);
			}
		}

		const summary: ImportSummary = {
			total,
			succeeded,
			failed: failures.length,
			failures,
		};

		const message = this.buildConfirmationMessage(summary);
		return { summary, message };
	}

	private buildConfirmationMessage(summary: ImportSummary): string {
		if (summary.total === 0) return 'No records to import.';
		if (summary.failed === 0) return `Successfully imported ${summary.succeeded}/${summary.total} records.`;
		return `Imported ${summary.succeeded}/${summary.total} records. ${summary.failed} failed. Check import logs for details.`;
	}
}

export const importService = new ImportService();

