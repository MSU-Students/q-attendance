<template>
  <q-page class="q-pa-md" style="margin-top: 1rem">
    <q-table title="Organizations" :rows="records" :columns="columns">
      <template #top-right>
        <q-btn icon="add" @click="newOrganization">Create</q-btn>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn rounded dense flat icon="edit" @click="editOrganization(props.row)" />
        </q-td>
      </template>
    </q-table>
    <UpsertOrgDialog v-model="showUpsertDialog" :existing="editOrg" />
  </q-page>
</template>
<script setup lang="ts">
import { QTableColumn } from 'quasar';
import UpsertOrgDialog from 'src/components/UpsertOrgDialog.vue';
import { OrgModel } from 'src/models';
import { useOrgStore } from 'src/stores/org-store';
import { computed, onMounted, ref } from 'vue';
const showUpsertDialog = ref(false);
const records = computed(() => orgStore.organizations);
const editOrg = ref<OrgModel>();
const orgStore = useOrgStore();
const columns: QTableColumn[] = [
  {
    name: 'name',
    field: 'name',
    label: 'Name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'code',
    field: 'orgCode',
    label: 'Code',
    align: 'left',
    sortable: true,
  },
  {
    name: 'description',
    field: 'description',
    label: 'Description',
    align: 'left',
  },
  {
    name: 'parent',
    field: 'parentOrgCode',
    label: 'Parent',
    align: 'left',
  },
  {
    name: 'actions',
    label: 'Actions',
    align: 'right',
    field: '',
  },
];
onMounted(async () => {
  await orgStore.loadAllOrganizations();
});

function newOrganization() {
  editOrg.value = undefined;
  showUpsertDialog.value = true;
}
function editOrganization(org: OrgModel) {
  editOrg.value = { ...org };
  showUpsertDialog.value = true;
}
</script>
