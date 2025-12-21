<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(v) => emit('update:modelValue', v)"
    persistent
    @show="initOrganization"
  >
    <q-card style="min-width: 420px">
      <q-form @submit="submitOrg" v-if="targetOrg">
        <q-card-section>
          <div class="text-h6">Create Organization</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="targetOrg.name"
            label="Name"
            :rules="[(val: string) => val.length >= 3 || 'Enter Organization Name']"
          />
          <q-input
            v-model="targetOrg.orgCode"
            label="Code"
            :rules="[(val: string) => val.length >= 3 || 'Enter Organization Code']"
          />
          <q-select
            v-model="targetOrg.parentOrgCode"
            label="Parent"
            :options="orgStore.organizations"
            :option-label="
              (o: OrgModel | string) => (typeof o == 'object' ? `${o.name} (${o.orgCode})` : o)
            "
            option-value="orgCode"
            emit-value
          />
          <q-input v-model="targetOrg.description" label="Description" autogrow />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="negative" @click="cancel" :disable="isSaving" />
          <q-btn
            color="primary"
            label="Submit"
            :loading="isSaving"
            type="submit"
            :disable="isSaving"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { uid } from 'quasar';
import { OrgModel } from 'src/models';
import { useOrgStore } from 'src/stores/org-store';
import { onMounted, ref } from 'vue';

const props = defineProps<{ modelValue: boolean; existing?: OrgModel | undefined }>();
const orgStore = useOrgStore();
const emit = defineEmits(['update:modelValue']);
const isSaving = ref(false);
const targetOrg = ref<OrgModel>();
onMounted(() => {
  initOrganization();
});
function initOrganization() {
  targetOrg.value = props.existing || {
    key: uid(),
    name: '',
    orgCode: '',
    description: '',
    logoUrl: '',
    members: [],
    officers: [],
  };
}
async function submitOrg() {
  isSaving.value = true;
  if (props.existing) {
    await orgStore.saveUpdateOrg({
      ...targetOrg.value!,
    });
  } else {
    await orgStore.saveNewOrg(targetOrg.value!);
  }
  isSaving.value = false;
  emit('update:modelValue', false);
  orgStore.loadAllOrganizations();
}

function cancel() {
  emit('update:modelValue', false);
}
</script>

<style scoped></style>
