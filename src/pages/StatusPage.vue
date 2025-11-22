<script setup lang="ts">
import { useAuthStore } from 'src/stores/auth-store';
import { useLogout } from 'src/utils/redirect';
import { computed } from 'vue';

const { logout } = useLogout();
const authStore = useAuthStore();
const accounts = computed(() => authStore.currentAccounts);
const statusConfig = computed(() => {
  return accounts.value.map((account) => {
    if (account?.status === 'inactive') {
      return {
        color: 'negative',
        icon: 'block',
        title: 'Access Denied',
        message: 'Your account has been denied access. Please contact the administrator.',
        ...account,
      };
    }
    if (account?.status === 'pending') {
      return {
        color: 'warning',
        icon: 'schedule',
        title: 'Pending Approval',
        message: 'Your account is awaiting administrator approval.',
        ...account,
      };
    }
    return {
      color: 'positive',
      icon: 'check_circle',
      title: 'Access Granted',
      message: 'You have full access to the system.',
      ...account,
    };
  });
});
</script>

<template>
  <q-page class="q-pa-md status-page">
    <div class="status-container">
      <q-banner v-if="accounts.length == 0">No Accounts Yet</q-banner>
      <template v-else>
        <q-card class="status-card" v-for="account in statusConfig" :key="account.key">
          <q-card-section>
            <div :color="account.color" :icon="account.icon" class="status-alert">
              <h3 class="q-my-none">{{ account.title }}</h3>
              <p class="q-mt-sm q-mb-none">{{ account.message }}</p>
            </div>

            <div v-if="account?.status === 'inactive'" class="q-mt-md">
              <q-btn color="primary" @click="logout" class="full-width" label="Return to Login" />
            </div>

            <template v-else-if="account?.status === 'active'">
              <div class="q-mt-lg account-info">
                <h5 class="q-my-md">Account Details</h5>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Email:</span>
                    <span class="info-value">{{ account?.email }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Role:</span>
                    <span class="info-value">{{ account.role }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Status:</span>
                    <span class="info-value text-positive">{{ account.status }}</span>
                  </div>
                </div>
              </div>
            </template>

            <div v-else class="q-mt-md pending-info">
              <q-icon name="info" size="md" class="q-mr-sm" />
              <p class="text-caption q-my-none">
                Your account is under review. This process typically takes 1-2 business days.
              </p>
            </div>
          </q-card-section>

          <q-card-actions v-if="account?.status == 'pending'" class="q-px-md">
            <q-btn color="primary" @click="logout" class="full-width" label="Logout" />
          </q-card-actions>
        </q-card>
      </template>
    </div>
  </q-page>
</template>

<style scoped>
.status-page {
  background-color: #f8f9fa;
  display: flex;
  justify-content: center;
  align-items: center;
}

.status-container {
  max-width: 500px;
  width: 100%;
}

.status-card {
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.status-alert {
  border-radius: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  padding: 8px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
}

.info-label {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.info-value {
  font-weight: 500;
  color: #2c3e50;
}

.pending-info {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #fff3cd;
  border-radius: 6px;
  border: 1px solid #ffeeba;
}
</style>
