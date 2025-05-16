<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated >
      <q-toolbar class="headerstyle">

        <q-toolbar-title class="textstyle" > Quasar Attendance System </q-toolbar-title>

      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">

</script>

<style>
 .headerstyle{
  background-color: #800000;
  color: white;
  padding-bottom: 1rem;
 }
 .textstyle{
  font-size: 26px;
  font-weight: bolder;
  margin-left: 12px;

 }
</style>
