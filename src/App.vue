<script setup lang="ts">
import { computed } from 'vue'
import LoginPage from './components/LoginPage.vue'
import HomePage from './components/HomePage.vue'
import { isAuthenticated } from './services/auth'

const showLoginPage = computed(() => !isAuthenticated.value)
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          EB PCR Analysis
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <LoginPage v-if="showLoginPage" />
      <HomePage v-else />
    </q-page-container>
  </q-layout>
</template>

<style>
body {
  margin: 0;
  padding: 0;
}
</style>
