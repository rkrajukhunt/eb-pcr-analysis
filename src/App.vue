<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import AppHeader from "./components/AppHeader.vue";
import HomePage from "./components/HomePage.vue";
import LoginPage from "./components/LoginPage.vue";
import { isAuthenticated } from "./services/auth";
import { getMarketStatus } from "./services/marketSchedule";
import {
  clearAllLocalData,
  loadLastTradingSession,
} from "./services/storageService";

const showLoginPage = computed(() => !isAuthenticated.value);
const isMarketOpen = ref(false);

// Helper function to check if cached data is from today
const isToday = (dateValue: Date | string): boolean => {
  const today = new Date().toISOString().split("T")[0];
  const dateString =
    dateValue instanceof Date
      ? dateValue.toISOString().split("T")[0]
      : dateValue;
  return dateString === today;
};
// Separate method to handle clearing old cache
const checkAndClearOldCache = async (): Promise<void> => {
  const cacheData = loadLastTradingSession();

  // If there's cache data AND its date is not today, clear local data
  if (cacheData?.date && !isToday(cacheData?.date)) {
    console.log("Old cache detected — clearing local data...");
    await clearAllLocalData();
  } else {
    console.log("Cache is up to date — keeping local data.");
  }
};

// Update market status
const updateMarketStatus = () => {
  const status = getMarketStatus();
  isMarketOpen.value = status.isOpen;
};

onMounted(async () => {
  await checkAndClearOldCache();
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
