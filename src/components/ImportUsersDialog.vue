<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(v) => emit('update:modelValue', v)"
    persistent
  >
    <q-card style="min-width: 420px">
      <q-card-section>
        <div class="text-h6">Import Users</div>
      </q-card-section>

      <q-card-section>
        <div class="q-mb-sm">
          Select a CSV or Excel file with headers: <code>fullName,email,role,status</code>
        </div>
        <input type="file" accept=".csv,.xlsx,.xls" @change="handleFileChange" />

        <div v-if="showColumnMapping && rawRows.length" class="q-mt-md">
          <div class="text-h6 q-mb-md">Map CSV/Excel Columns</div>
          <div class="q-mb-md">
            <div v-for="(val, key, idx) in columnMapping" :key="idx" class="q-mb-md">
              <div class="text-subtitle2">{{ key }} →</div>
              <q-select
                :model-value="val"
                :options="['fullName', 'email', 'role', 'status', 'name']"
                @update:model-value="(v) => (columnMapping[key] = v)"
                dense
                emit-value
              />
            </div>
          </div>
          <q-btn
            color="primary"
            label="Continue to Preview"
            @click="
              () => {
                parsedUsers = mapRawRowsToUsers();
                detectDuplicates();
                showColumnMapping = false;
              }
            "
          />
        </div>

        <div v-if="duplicates.length" class="q-mt-md">
          <div class="text-warning text-h6">⚠ Duplicate Emails Detected</div>
          <q-list bordered class="q-mt-xs">
            <q-item v-for="(dup, idx) in duplicates" :key="idx">
              <q-item-section>
                <q-item-label>{{ dup.email }}</q-item-label>
                <q-item-label caption>Appears {{ dup.count }} times in this import</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
          <div class="q-mt-sm text-caption text-grey">
            Note: Importing duplicates may overwrite existing records
          </div>
        </div>

        <div v-if="parsedUsers.length && !showColumnMapping" class="q-mt-md">
          <div class="row items-center justify-between q-mb-sm">
            <div>Preview ({{ parsedUsers.length }} users)</div>
            <div class="text-caption">Showing up to 100 rows</div>
          </div>
          <q-table
            dense
            flat
            :rows="parsedUsersPreview"
            :columns="previewColumns"
            :row-key="rowKey"
            :pagination="previewPagination"
          />
        </div>
        <div v-if="isImporting" class="q-mt-md">
          <div>Importing: {{ importProgress }} / {{ importTotal }}</div>
          <q-linear-progress
            :value="importTotal ? importProgress / importTotal : 0"
            color="primary"
          />
        </div>

        <div v-if="importErrors.length" class="q-mt-md">
          <div class="text-negative">Errors ({{ importErrors.length }})</div>
          <q-list bordered class="q-mt-xs">
            <q-item v-for="(err, idx) in importErrors" :key="idx">
              <q-item-section>
                <q-item-label>{{ err.user.fullName || err.user.email }}</q-item-label>
                <q-item-label caption>{{ err.error }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="negative" @click="cancel" :disable="isImporting" />
        <q-btn
          color="primary"
          label="Confirm Import"
          :loading="isImporting"
          @click="confirmImport"
          :disable="parsedUsers.length === 0 || isImporting"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Notify } from 'quasar';
import type { UserModel } from 'src/models/user.models';
import Papa from 'papaparse';

defineProps<{ modelValue: boolean }>();

const emit = defineEmits(['update:modelValue']);

const parsedUsers = ref<UserModel[]>([]);
const parsedUsersPreview = computed(() => parsedUsers.value.slice(0, 100));
const previewColumns = ref<Array<{ name: string; label: string; field: string }>>([]);
const rowKey = ref('email');
const previewPagination = ref({ page: 1, rowsPerPage: 10 });
const isImporting = ref(false);
const importProgress = ref(0);
const importTotal = ref(0);
const importErrors = ref<Array<{ user: UserModel; error: string }>>([]);
const showColumnMapping = ref(false);
const columnMapping = ref<Record<string, string>>({});
const rawRows = ref<Array<Record<string, unknown>>>([]);
const duplicates = ref<Array<{ email: string; count: number }>>([]);

async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (ext === 'xlsx' || ext === 'xls') {
    // try to parse Excel via SheetJS (xlsx). If not installed, notify user to install it.
    try {
      const arrayBuffer = await file.arrayBuffer();
      // dynamic import so project doesn't break if dependency missing
      const mod = await import('xlsx');
      const XLSX = mod as {
        read: (
          data: unknown,
          opts?: unknown,
        ) => { SheetNames: string[]; Sheets: Record<string, unknown> };
        utils: { sheet_to_json: (sheet: unknown, opts?: unknown) => unknown[] };
      };
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = wb.SheetNames && wb.SheetNames[0];
      if (!firstSheetName) {
        parsedUsers.value = [];
        return;
      }
      const sheet = wb.Sheets[firstSheetName];
      const json: unknown[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      // map to UserModel-ish objects
      parsedUsers.value = json.map((r, idx) => {
        const row = r as Record<string, unknown>;
        const fullNameVal = row['fullName'];
        const nameVal = row['name'];
        const emailVal = row['email'];
        const roleVal = row['role'];
        const roleStr =
          typeof roleVal === 'string' &&
          ['teacher', 'admin', 'supervisor', 'student'].includes(roleVal)
            ? (roleVal as 'teacher' | 'admin' | 'supervisor' | 'student')
            : 'student';
        const keyStr = typeof row['key'] === 'string' ? row['key'] : `${Date.now()}_${idx}`;
        return {
          key: keyStr,
          fullName: fullNameVal || nameVal || '',
          email: emailVal || 'no@mail.com',
          role: roleStr,
          status: 'active',
          ownerKey: '',
        } as UserModel;
      });
    } catch (err) {
      console.error('xlsx parse failed', err);
      Notify.create({
        message: 'Failed to parse Excel file. Install `xlsx` (npm i xlsx) to enable Excel import.',
        color: 'negative',
      });
      // fallback: try reading as text CSV
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const text = typeof result === 'string' ? result : '';
        parsedUsers.value = parseCSV(text);
      };
      reader.readAsText(file);
    }
  } else {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const text = typeof result === 'string' ? result : '';
      parsedUsers.value = parseCSV(text);
    };
    reader.readAsText(file);
  }

  // detect columns for preview
  setTimeout(() => {
    if (parsedUsers.value.length) {
      const keys = Object.keys(parsedUsers.value[0] as Record<string, unknown>);
      previewColumns.value = keys.map((k) => ({
        name: k,
        label: k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
        field: k,
      }));
      rowKey.value = keys.includes('email') ? 'email' : keys[0] || 'key';
    } else {
      previewColumns.value = [];
    }
  }, 50);
}

function parseCSV(text: string): UserModel[] {
  // Use PapaParse for robust CSV parsing (handles quoted fields, embedded commas, etc.)
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });
  const rows = result.data as Array<Record<string, unknown>>;

  rawRows.value = rows;
  columnMapping.value = {};

  // Auto-detect standard column names
  const firstRow = rows[0] || {};
  const keys = Object.keys(firstRow);
  for (const key of keys) {
    const lower = key.toLowerCase();
    if (lower.includes('fullname') || lower.includes('name')) columnMapping.value[key] = 'fullName';
    else if (lower.includes('email')) columnMapping.value[key] = 'email';
    else if (lower.includes('role')) columnMapping.value[key] = 'role';
    else if (lower.includes('status')) columnMapping.value[key] = 'status';
  }

  showColumnMapping.value = true;
  return [];
}

function mapRawRowsToUsers(): UserModel[] {
  const users: UserModel[] = [];
  for (let idx = 0; idx < rawRows.value.length; idx++) {
    const row = rawRows.value[idx];
    if (!row) continue;
    const obj: Record<string, unknown> = {};

    // Apply column mapping
    for (const [csvCol, modelField] of Object.entries(columnMapping.value)) {
      obj[modelField] = row[csvCol];
    }

    const fullNameVal = obj['fullName'] as string;
    const nameVal = obj['name'] as string;
    const emailVal = obj['email'] as string;
    const roleVal = obj['role'];

    const roleStr =
      typeof roleVal === 'string' && ['teacher', 'admin', 'supervisor', 'student'].includes(roleVal)
        ? (roleVal as 'teacher' | 'admin' | 'supervisor' | 'student')
        : 'student';
    const keyStr = `${Date.now()}_${idx}`;

    users.push({
      key: keyStr,
      fullName: fullNameVal || nameVal || '',
      email: typeof emailVal === 'string' ? emailVal : '',
      role: roleStr,
      status: 'active',
      ownerKey: '',
    });
  }
  return users;
}

function detectDuplicates(): void {
  const emailMap = new Map<string, number>();
  for (const user of parsedUsers.value) {
    if (user.email) {
      emailMap.set(user.email, (emailMap.get(user.email) || 0) + 1);
    }
  }
  duplicates.value = Array.from(emailMap.entries())
    .filter(([, count]) => count > 1)
    .map(([email, count]) => ({ email, count }));
}

async function confirmImport() {
  if (showColumnMapping.value) {
    // Apply column mapping and show duplicate detection
    parsedUsers.value = mapRawRowsToUsers();
    detectDuplicates();
    showColumnMapping.value = false;
    return;
  }

  if (!rawRows.value.length) return;
  isImporting.value = true;
  importErrors.value = [];
  importProgress.value = 0;
  importTotal.value = 1;
  try {
    // Get the current file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) {
      Notify.create({ message: 'No file selected', color: 'negative' });
      return;
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Send to Cloud Function
  } catch (e) {
    console.error(e);
  }
}

function cancel() {
  parsedUsers.value = [];
  emit('update:modelValue', false);
}
</script>

<style scoped>
code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
