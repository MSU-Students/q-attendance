<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth-store';
import { ref, onMounted } from 'vue';

const authStore = useAuthStore();

onMounted(async () => {
  await authStore.authorizeUser();
});

const router = useRouter();

const signinbutton = () => {
  void router.push('/auth/login');
};

const signupbutton = () => {
  void router.push('/auth/register');
};

const gotoDashboard = () => {
  void router.push(`${authStore.currentAccount?.role}`);
};

const text = "A digital platform designed to streamline and automate student attendance tracking. Quasar ensures accurate and efficient attendance management for educators and institutions.";
const typedText = ref("");
const index = ref(0);

const typeText = () => {
  if (index.value < text.length) {
    typedText.value += text[index.value];
    index.value++;
    setTimeout(typeText, 30);
  }
  else {
    setTimeout(() => {
      typedText.value = "";
      index.value = 0;
      typeText();
    }, 2000);
  }
};

onMounted(() => {
  typeText();
});
</script>

<template>
  <q-page class="mainpage">
    <div class="paragwap">
    <p>{{ typedText }}</p>

    </div>
    <div class="background-container">
    <img class="background-pic" src="/src/assets/newbg3.png">
      <div class="buttonsss">
        <div v-if="authStore.currentAccount">
          <q-btn label="Dashboard" color="primary" @click="gotoDashboard" />
        </div>
        <div v-else>
          <q-btn class="sign-in" label="Sign In" color="primary" @click="signinbutton" />
          <q-btn class="sign-up" label="Sign Up" color="brown" @click="signupbutton" />
        </div>
      </div>
      </div>
  </q-page>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.paragwap{
  font-size: 26px;
  font-weight: bolder;
  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
  color: black;
  height: 100px;
  margin-top: 40px;
  margin-left: 40px;
  width: 600px;
  position: absolute;
  padding: 0;
  z-index: 2;
  pointer-events: none;

}

.mainpage {
  background-color: #f8f4e1;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.background-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
}

.background-pic {
  margin-left: 20rem;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.buttonsss {
  position: absolute;
  top: 58%;
  left: 40px;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.sign-in,
.sign-up {
  top: 20px;
  margin-left: 140px;
  font-family: 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, Verdana, sans-serif;
  font-weight: bolder;
  font-size: 30px;
  width: 240px;
  height: 90px;
  margin-bottom: 15px;
  display: block;
  box-shadow: -4px 4px 2px rgba(0, 0, 0, 0.2);
  transition: box-shadow 0.3s ease;
  border-radius: 12px;
}

.sign-in:hover,
.sign-up:hover {
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}
</style>
