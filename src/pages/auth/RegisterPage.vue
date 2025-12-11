<script setup lang="ts">
import { useAuthStore } from 'src/stores/auth-store';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Notify } from 'quasar';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const fullName = ref('');
const askRole = ref(false);
const registerWithGoogle = ref(false);
const isPwd = ref(true);
const isConfirmPwd = ref(true);
const loading = ref(false);
const termsAccepted = ref(false);

function onSubmit() {
  if (!fullName.value || !username.value || !password.value) {
    Notify.create({
      message: 'Please fill in all required fields',
      color: 'negative',
      icon: 'warning',
      position: 'top',
    });
    return;
  }

  if (password.value !== confirmPassword.value) {
    Notify.create({
      message: 'Passwords do not match',
      color: 'negative',
      icon: 'warning',
      position: 'top',
    });
    return;
  }

  if (!termsAccepted.value) {
    Notify.create({
      message: 'Please accept the terms and conditions',
      color: 'negative',
      icon: 'warning',
      position: 'top',
    });
    return;
  }

  askRole.value = true;
}

async function register(role: string) {
  loading.value = true;
  try {
    if (!registerWithGoogle.value) {
      await authStore.register(username.value, password.value, fullName.value, role);
      console.log('role', role);
      await router.replace({ name: `${role}` });
    } else {
      const user = await authStore.authorizeUser('', role);
      console.log('role', user?.role);
      await router.replace({ name: `${user?.role}` });
    }
  } catch {
    Notify.create({
      message: 'Registration failed. Please try again.',
      color: 'negative',
      icon: 'error',
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
}

async function continueWithGoogle() {
  loading.value = true;
  try {
    const user = await authStore.loginWithGoogle();

    if (user) {
      askRole.value = true;
      registerWithGoogle.value = true;
    } else {
      const user = await authStore.authorizeUser();
      await router.replace({ name: `${user?.role}` });
    }
  } catch {
    Notify.create({
      message: 'Google login failed. Please try again.',
      color: 'negative',
      icon: 'error',
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
}

function goToLogin() {
  void router.push('/auth/login');
}
</script>

<template>
  <div class="register-page">
    <div class="register-container">
      <!-- Left side with image -->
      <div class="register-image-container">
        <div class="overlay">
          <div class="logo-container">
            <img src="~assets/msulogo2.png" alt="MSU Logo" class="msu-logo" />
            <h1 class="app-title">Q-Attendance</h1>
          </div>
          <div class="tagline">
            <h2>Join Us Today!</h2>
            <p>Create an account to get started</p>
          </div>
        </div>
      </div>

      <!-- Right side with registration form -->
      <div class="register-form-container">
        <div v-if="!askRole" class="register-form">
          <h2 class="form-title">Create Account</h2>
          <p class="form-subtitle">Please fill in the details to register</p>

          <q-form @submit.prevent="onSubmit" class="q-gutter-y-md">
            <div class="input-field">
              <label for="fullName">Full Name</label>
              <q-input
                v-model="fullName"
                id="fullName"
                outlined
                placeholder="Enter your full name"
                dense
                class="q-mt-sm"
              >
                <template v-slot:prepend>
                  <q-icon name="person" color="grey-7" />
                </template>
              </q-input>
            </div>

            <div class="input-field">
              <label for="email">Email</label>
              <q-input
                v-model="username"
                id="email"
                outlined
                type="email"
                placeholder="Enter your email"
                dense
                class="q-mt-sm"
              >
                <template v-slot:prepend>
                  <q-icon name="email" color="grey-7" />
                </template>
              </q-input>
            </div>

            <div class="input-field">
              <label for="password">Password</label>
              <q-input
                v-model="password"
                id="password"
                outlined
                :type="isPwd ? 'password' : 'text'"
                placeholder="Create a password"
                dense
                class="q-mt-sm"
              >
                <template v-slot:prepend>
                  <q-icon name="lock" color="grey-7" />
                </template>
                <template v-slot:append>
                  <q-icon
                    :name="isPwd ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="isPwd = !isPwd"
                  />
                </template>
              </q-input>
            </div>

            <div class="input-field">
              <label for="confirmPassword">Confirm Password</label>
              <q-input
                v-model="confirmPassword"
                id="confirmPassword"
                outlined
                :type="isConfirmPwd ? 'password' : 'text'"
                placeholder="Confirm your password"
                dense
                class="q-mt-sm"
              >
                <template v-slot:prepend>
                  <q-icon name="lock" color="grey-7" />
                </template>
                <template v-slot:append>
                  <q-icon
                    :name="isConfirmPwd ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="isConfirmPwd = !isConfirmPwd"
                  />
                </template>
              </q-input>
            </div>

            <div class="terms-checkbox">
              <q-checkbox
                v-model="termsAccepted"
                label="I agree to the Terms and Conditions"
                dense
                color="primary"
              />
            </div>

            <q-btn type="submit" class="submit-btn" :loading="loading" unelevated no-caps>
              Create Account
            </q-btn>

            <div class="divider">
              <span>or continue with</span>
            </div>

            <q-btn
              class="google-btn"
              @click="continueWithGoogle"
              :loading="loading"
              outline
              no-caps
            >
              <q-icon size="18px" class="q-mr-sm">
                <q-img src="~assets/google-icon.svg" />
              </q-icon>
              Google
            </q-btn>

            <div class="login-prompt">
              Already have an account? <a @click="goToLogin" class="login-link">Sign in</a>
            </div>
          </q-form>
        </div>

        <div v-else class="role-selection">
          <h2 class="form-title">Select Your Role</h2>
          <p class="form-subtitle">Please select your role to continue</p>

          <div class="role-buttons q-gutter-y-md">
            <q-btn
              @click="register('student')"
              class="role-btn"
              :loading="loading"
              unelevated
              no-caps
            >
              <q-icon name="school" class="q-mr-sm" />
              Student
            </q-btn>

            <q-btn
              @click="register('teacher')"
              class="role-btn"
              :loading="loading"
              unelevated
              no-caps
            >
              <q-icon name="assignment_ind" class="q-mr-sm" />
              Teacher
            </q-btn>

            <q-btn
              @click="register('supervisor')"
              class="role-btn"
              :loading="loading"
              unelevated
              no-caps
            >
              <q-icon name="supervisor_account" class="q-mr-sm" />
              Supervisor
            </q-btn>

            <q-btn
              @click="register('admin')"
              class="role-btn"
              :loading="loading"
              unelevated
              no-caps
            >
              <q-icon name="admin_panel_settings" class="q-mr-sm" />
              Administrator
            </q-btn>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  padding: 20px;
}

.register-container {
  display: flex;
  width: 100%;
  max-width: 1000px;
  min-height: 600px;
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.register-image-container {
  flex: 1;
  background-image: url('/src/assets/msulogo2.png');
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  background-color: #790622; /* Theme color */
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(121, 6, 34, 0.85); /* Semi-transparent theme color */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 60px 40px;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.msu-logo {
  width: 100px;
  height: 100px;
  margin-bottom: 20px;
}

.app-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
}

.tagline {
  text-align: center;
}

.tagline h2 {
  font-size: 2rem;
  margin-bottom: 10px;
}

.tagline p {
  font-size: 1.1rem;
  opacity: 0.9;
}

.register-form-container {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow-y: auto;
}

.register-form,
.role-selection {
  max-width: 400px;
  width: 100%;
  margin: 0 auto;
}

.form-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.form-subtitle {
  color: #666;
  margin-bottom: 30px;
}

.input-field label {
  display: block;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.terms-checkbox {
  margin: 10px 0;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  font-size: 1rem;
  font-weight: 600;
  background-color: #790622; /* Theme color */
  color: white;
  margin-bottom: 20px;
}

.divider {
  position: relative;
  text-align: center;
  margin: 20px 0;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background-color: #ddd;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.divider span {
  background-color: white;
  padding: 0 10px;
  color: #666;
  font-size: 0.9rem;
  position: relative;
  z-index: 1;
}

.google-btn {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  color: #333;
  font-weight: 500;
}

.login-prompt {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 0.9rem;
}

.login-link {
  color: #790622; /* Theme color */
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.role-btn {
  width: 100%;
  padding: 15px;
  margin-bottom: 10px;
  background-color: #790622; /* Theme color */
  color: white;
  font-weight: 500;
  font-size: 1rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .register-container {
    flex-direction: column;
  }

  .register-image-container {
    min-height: 200px;
  }

  .overlay {
    padding: 30px 20px;
  }

  .msu-logo {
    width: 70px;
    height: 70px;
  }

  .app-title {
    font-size: 2rem;
  }

  .tagline h2 {
    font-size: 1.5rem;
  }

  .register-form-container {
    padding: 30px 20px;
  }
}
</style>
