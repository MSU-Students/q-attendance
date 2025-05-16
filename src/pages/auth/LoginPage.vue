<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from 'src/stores/auth-store';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const username = ref('');
const password = ref('');
const askRole = ref(false);

async function onSubmit() {
  const auth = await authStore.login(username.value, password.value);
  if (auth) {
    await router.replace({ name: `${authStore.currentAccount?.role}` });
  }
}
async function continueWithGoogle() {
  const user = await authStore.loginWithGoogle();

  if (user) {
    askRole.value = true;
  } else {
    const user = await authStore.authorizeUser();
    await router.replace({ name: `${user?.role}` });
  }
}
async function registerWithGoogle(role: string) {
  await authStore.authorizeUser('', role);
  await router.replace({ name: `${authStore.currentAccount?.role}` });
}
</script>

<template>
  <div class="top-border">QUASAR ATTENDANCE SYSTEM</div>
  <q-page class="page-center">
    <q-card
      class="my-card text-white q-ma-xl"
      style="background: radial-gradient(circle, #efeeea 0%, #f8f4e1 100%)"
    >
      <q-card-section v-if="!askRole">
        <img class="msupic" src="/src/assets/msulogo2.png" height="80px" width="80px" />
        <h4 class="signin-text">Please sign-in your account if mayron</h4>
        <q-form @submit="onSubmit">
          <div class="row">
            <div class="username-box">
              <q-input
                class="col-6"
                v-model="username"
                placeholder="Username"
                style="font-weight: bold"
              />
            </div>
            <div class="username-box">
              <q-input class="col-6" v-model="password" type="password" placeholder="Password" />
            </div>
          </div>
          <q-btn class="login-button" type="submit">Login</q-btn>
        </q-form>
        <q-card-actions>
          <span class="gbutton" @click="continueWithGoogle()">Continue with Google</span>
        </q-card-actions>
      </q-card-section>

      <div v-else>
        <div class="roletxt">Select Role</div>
        <div class="rolebutt">
        <q-btn class="custom-btn" @click="registerWithGoogle('student')">student</q-btn>
        <q-btn class="custom-btn" @click="registerWithGoogle('teacher')">teacher</q-btn>
        <q-btn class="custom-btn" @click="registerWithGoogle('supervisor')">supervisor</q-btn>
        <q-btn class="custom-btn" @click="registerWithGoogle('admin')">admin</q-btn>
      </div>
        </div>

    </q-card>


    <div>
      <router-view />
    </div>
  </q-page>
</template>
<style scoped>
.top-border {
  border-top: 5px solid #800000;
  width: 100%;
  font-weight: bolder;
  text-align: center;
  padding: 12px 0;
  font-size: 30px;
  font-weight: bold;
  color: white;
  background-color: #800000;
  border-bottom: 3px solid #800000;
}
.my-card {
  max-width: 400px;
  margin: 0;
  width: 100%;
  height: 450px;
}
.page-center {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 90vh;
  background-color: #f8f4e1;
  flex-direction: column;
}
.msupic {
  display: block;
  margin: 0 auto;
}
.signin-text {
  color: grey;
  font-size: 15px;
  display: block;
  text-align: center;
}
.row {
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 16px;
}
.username-box {
  flex: 1;
  font-weight: bold;
  width: 100%;
}
.passsword-box {
  flex: 1;
  font-weight: bold;
}

.table-auto {
  margin-top: 20px;
  width: 100%;
}

.flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0px;
  width: 100%;
}
.login-button {
  background-color: #800000;
  color: white;
  align-items: center;
  display: block;
  margin: 0 auto;
  margin-top: 20px;
  font-size: 16px;
  padding: 15px;
  padding-left: 20px;
  padding-right: 20px;
  width: 140px;

  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
}
.tableacc {
  width: 100%;
}

.gbutton{
    color: blue;
    align-items: center;
    display: block;
    text-decoration: underline;
    margin-top: 5px;

  }
  .gbutton:hover{
    color: lightblue;
    cursor: pointer;
  }

  .custom-btn{
  background-color: #800000;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    border: none;
    cursor: pointer;
}

.rolebutt{
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 5rem;
}

.roletxt{
  text-align: center;
  padding: 10px;
  background-color: #800000;
  border-radius: 5px;
  color:white;
  font-size: 15px;
}

</style>
