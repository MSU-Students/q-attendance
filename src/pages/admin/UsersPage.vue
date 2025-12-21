<script setup lang="ts">
import type { QTableColumn } from 'quasar'; // Changed to import type
import { UserModel } from 'src/models/user.models';
import { useAuthStore } from 'src/stores/auth-store';
import { useUsersStore } from 'src/stores/user-store';
import { computed, onMounted, ref } from 'vue';
import ImportUsersDialog from 'src/components/ImportUsersDialog.vue';

const userStore = useUsersStore();
const authStore = useAuthStore();

const rowsPerPage = ref([10]);
const columns: QTableColumn[] = [
  {
    name: 'fullName',
    required: true,
    label: 'Name',
    align: 'left',
    field: (row: UserModel) => row.fullName,
    format: (val: string) => `${val}`,
    sortable: true
  },
  { name: 'email', align: 'left', label: 'Email', field: 'email', sortable: true },
  { name: 'role', align: 'center', label: 'Role', field: 'role', sortable: true },
  { name: 'status', label: 'Status', field: 'status', sortable: true }
];

const rows = computed(() => userStore.users);

onMounted(async () => {
  await userStore.loadUsers();
});

const showImportDialog = ref(false);

async function updateStatus(status: 'active' | 'inactive' | 'pending', key: string) {
  await authStore.updateStatus(status, key);
  await userStore.loadUsers();
}

</script>

<template>
  <q-page class="q-pa-md" style="margin-top: 1rem;">
    <q-table
        title="Users"
      :rows="rows"
      :columns="columns"
      :rows-per-page-options="rowsPerPage"
      row-key="key"
    >
        <template v-slot:top-right>
          <q-btn color="primary" icon="file_upload" label="Import Users" @click="showImportDialog = true" />
        </template>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="fullName" :props="props">
            {{ props.row.fullName }}
          </q-td>
          <q-td key="email" :props="props">
            {{ props.row.email }}
          </q-td>
          <q-td key="role" :props="props">
            <div :class="{
              'role-badge': true,
              'role-admin': props.row.role === 'admin',
              'role-teacher': props.row.role === 'teacher',
              'role-student': props.row.role === 'student',
              'role-supervisor': props.row.role === 'supervisor'
            }">
              {{ props.row.role }}
            </div>
          </q-td>
          <q-td key="status" :props="props">
            <div class="text-pre-wrap">
              <q-badge
                :color="props.row.status === 'active' ? 'green' :
                      props.row.status === 'inactive' ? 'negative' : 'warning'"
              >
                {{ props.row.status }}
              </q-badge>
            </div>
            <q-popup-edit v-model="props.row.status" title="Update status" buttons v-slot="scope" @save="(val) => updateStatus(val, props.row.key)">
              <q-option-group
                v-model="scope.value"
                :options="[
                  { label: 'Active', value: 'active' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'Inactive', value: 'inactive' }
                ]"
                type="radio"
                dense
              />
            </q-popup-edit>
          </q-td>
        </q-tr>
      </template>
    </q-table>
    <ImportUsersDialog v-model="showImportDialog" />
  </q-page>
</template>

<style scoped>
.role-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
  text-transform: capitalize;
}

.role-admin {
  background-color: #790622;
  color: white;
}

.role-teacher {
  background-color: #31ccec;
  color: white;
}

.role-supervisor {
  background-color: #f2c037;
  color: white;
}

.role-student {
  background-color: #21ba45;
  color: white;
}
</style>