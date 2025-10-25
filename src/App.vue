<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import LoginPage from "./components/LoginPage.vue";
import HomePage from "./components/HomePage.vue";
import AppHeader from "./components/AppHeader.vue";
import { isAuthenticated } from "./services/auth";
import { getMarketStatus } from "./services/marketSchedule";

const showLoginPage = computed(() => !isAuthenticated.value);
const isMarketOpen = ref(false);

// Update market status
const updateMarketStatus = () => {
  const status = getMarketStatus();
  isMarketOpen.value = status.isOpen;
};

onMounted(() => {
  updateMarketStatus();
  // Update every minute
  setInterval(updateMarketStatus, 60000);
});
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <!-- Show header only when authenticated -->
    <AppHeader v-if="!showLoginPage" :is-market-open="isMarketOpen" />

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
