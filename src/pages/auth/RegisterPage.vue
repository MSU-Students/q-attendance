<script setup lang="ts">
import { useAuthStore } from 'src/stores/auth-store';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const fullName = ref('');
const askRole = ref(false);
const registerWithGoogle = ref(false);

function onSubmit() {
  if (username.value && password.value && fullName.value) {
    askRole.value = true;
  }
}

async function register(role: string) {
  if (!registerWithGoogle.value) {
    await authStore.register(username.value, password.value, fullName.value, role);
    await router.replace({ name: `${role}` });
  } else {
    const user = await authStore.authorizeUser('', role);
    await router.replace({ name: `${user?.role}` });
  }
}

async function continueWithGoogle() {
  const user = await authStore.loginWithGoogle();

  if (user) {
    askRole.value = true;
    registerWithGoogle.value = true;
  } else {
    const user = await authStore.authorizeUser();
    await router.replace({ name: `${user?.role}` });
  }
}

</script>

<template>

    <q-page class="page">

      <div class="header">
        QUASAR ATTENDANCE SYSTEM
      </div>
      <img class="bgregister" src="/src/assets/newbg3.png">

      <q-card class="my-card absolute-center">
        <q-card-section v-if="!askRole">
          <img class="msupic" src="/src/assets/msulogo2.png" height="80px" width="80px" />
          <q-form @submit="onSubmit">
            <div class="row">
              <q-input class="" v-model="fullName" placeholder="Full Name" />
              <q-input class="" v-model="username" placeholder="Email Address" />
              <q-input class="" v-model="password" type="password" placeholder="Password" />
            </div>
            <q-btn type="submit" class="registerbtn">Register</q-btn>
          </q-form>
          <span @click="continueWithGoogle" class="googlebtn">Continue with Google.</span>
        </q-card-section>

      <div v-else>
        <div class="roletxt">Select your role</div>
        <div class="rolesss">
        <q-btn class="custom-btn" @click="register('student')">student</q-btn>
        <q-btn class="custom-btn" @click="register('teacher')">teacher</q-btn>
        <q-btn class="custom-btn" @click="register('supervisor')">supervisor</q-btn>
        <q-btn class="custom-btn" @click="register('admin')">admin</q-btn>
      </div>
      </div>
    </q-card>

      <div>
        <router-view />
      </div>
    </q-page>
  </template>

  <style>
  .bgregister{
    position: relative;
    max-height: 90vh;
    width: 100%;

  }
  .header{
  border-top: 5px solid #800000;
  width: 100%;
  font-weight: bolder;
  text-align: center;
  padding: 12px;
  font-size: 30px;
  font-weight: bold;
  color: white;
  background-color: #800000;
  border-bottom: 3px solid #800000;
  }

  .my-card{
    background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(15px);
    flex: center;
    margin: auto;
    width: 400px;
    margin-top: 10px;
    height: 420px;
    position: absolute;

}

  .msupic{
    display: block;
  margin: 0 auto;
  }
  .row{
    justify-content: center;
  flex-direction: column;
  }
  .page{
    background-color: #f8f4e1;
  }
  .registerbtn{
    background-color: #800000;
  color: white;
  align-items: center;
  display: block;
  margin: 0 auto;
  margin-top: 50px;
  font-size: 16px;
  padding: 15px;
  padding-left: 20px;
  padding-right: 20px;
  }
  .googlebtn{
    color: blue;
    align-items: center;
    display: block;
    text-decoration: underline;
    margin-left: 115px;
    margin-top: 5px;

  }
  .googlebtn:hover{
    color: lightblue;
    cursor: pointer;
  }

.custom-btn{
  background-color: #800000;
    color: white;
    padding: 10px 10px;
    border-radius: 5px;
    border: none;
    cursor: pointer;
}

.rolesss{
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 5rem;
}
.roletxt{
  text-align: center;
  padding: 10px;
  background-color: #800000;
  border-radius: 5px;
  color: white;
  font-size: 15px;
}

</style>
