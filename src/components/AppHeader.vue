<template>
  <q-header elevated class="app-header">
    <q-toolbar class="toolbar-container">
      <!-- Logo & Title -->
      <q-toolbar-title class="row items-center no-wrap">
        <div class="brand-section">
          <q-icon name="show_chart" size="sm" class="brand-icon" />
          <span class="brand-text">PCR Analysis</span>
        </div>
        <q-badge
          v-if="isMarketOpen"
          color="green"
          class="live-badge pulse-animation"
        >
          <q-icon name="circle" size="8px" class="q-mr-xs" />
          LIVE
        </q-badge>
      </q-toolbar-title>

      <q-space />

      <!-- User Profile Section -->
      <div v-if="currentUser" class="user-section">
        <!-- Desktop User Display -->
        <div class="user-info gt-sm">
          <div class="user-name">{{ currentUser.displayName }}</div>
          <div class="user-email">{{ truncateEmail(currentUser.email) }}</div>
        </div>

        <!-- User Avatar with Menu -->
        <q-btn flat round class="user-avatar-btn">
          <q-avatar size="40px" class="user-avatar">
            <img v-if="currentUser.photoURL" :src="currentUser.photoURL" />
            <q-icon v-else name="person" size="20px" />
          </q-avatar>

          <q-menu
            class="user-menu"
            transition-show="scale"
            transition-hide="scale"
          >
            <q-list class="user-menu-list">
              <!-- User Info -->
              <q-item class="user-menu-header">
                <q-item-section avatar>
                  <q-avatar size="56px">
                    <img
                      v-if="currentUser.photoURL"
                      :src="currentUser.photoURL"
                    />
                    <q-icon v-else name="person" size="32px" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold text-body1">
                    {{ currentUser.displayName }}
                  </q-item-label>
                  <q-item-label caption class="text-caption">
                    {{ currentUser.email }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-separator />

              <!-- User ID -->
              <q-item dense>
                <q-item-section>
                  <q-item-label caption class="text-grey-6"
                    >User ID</q-item-label
                  >
                  <q-item-label class="text-caption text-grey-8">
                    {{ currentUser.uid.substring(0, 20) }}...
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    icon="content_copy"
                    @click="copyUserId"
                  >
                    <q-tooltip>Copy User ID</q-tooltip>
                  </q-btn>
                </q-item-section>
              </q-item>

              <q-separator />

              <!-- Clear Data Button -->
              <q-item
                clickable
                v-close-popup
                @click="handleClearData"
                class="clear-data-item"
              >
                <q-item-section avatar>
                  <q-icon name="delete_sweep" color="orange" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-orange">Clear Local Data</q-item-label>
                  <q-item-label caption class="text-grey-6">
                    Clear cache and localStorage
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-separator />

              <!-- Logout Button -->
              <q-item
                clickable
                v-close-popup
                @click="handleSignOut"
                class="logout-item"
              >
                <q-item-section avatar>
                  <q-icon name="logout" color="negative" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-negative">Sign Out</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>

          <q-tooltip class="text-body2">Profile & Settings</q-tooltip>
        </q-btn>
      </div>
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { currentUser, signOut } from "../services/auth";
import { clearAllLocalData } from "../services/storageService";
import { Notify, copyToClipboard, Dialog } from "quasar";

interface Props {
  isMarketOpen?: boolean;
}

withDefaults(defineProps<Props>(), {
  isMarketOpen: false,
});

const loading = ref(false);

const truncateEmail = (email: string | null) => {
  if (!email) return "";
  if (email.length <= 25) return email;
  return email.substring(0, 22) + "...";
};

const copyUserId = () => {
  if (currentUser.value?.uid) {
    copyToClipboard(currentUser.value.uid)
      .then(() => {
        Notify.create({
          type: "positive",
          message: "User ID copied to clipboard!",
          position: "top",
          timeout: 1500,
        });
      })
      .catch(() => {
        Notify.create({
          type: "negative",
          message: "Failed to copy",
          position: "top",
        });
      });
  }
};

const handleClearData = () => {
  Dialog.create({
    title: "Clear Local Data",
    message:
      "This will clear all cached data and localStorage. Firebase data will NOT be affected. The page will reload after clearing. Continue?",
    cancel: {
      label: "Cancel",
      color: "grey-7",
      flat: true,
    },
    ok: {
      label: "Clear Data",
      color: "orange",
      unelevated: true,
    },
    persistent: true,
  }).onOk(async () => {
    loading.value = true;

    try {
      const result = await clearAllLocalData();

      if (result.success) {
        Notify.create({
          type: "positive",
          message: "Local data cleared successfully! Reloading...",
          position: "top",
          timeout: 2000,
        });

        // Reload page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        Notify.create({
          type: "warning",
          message: result.message,
          position: "top",
          timeout: 3000,
        });
        loading.value = false;
      }
    } catch (error) {
      Notify.create({
        type: "negative",
        message: "Failed to clear local data",
        position: "top",
        timeout: 3000,
      });
      loading.value = false;
    }
  });
};

const handleSignOut = async () => {
  loading.value = true;
  const result = await signOut();
  loading.value = false;

  if (result.success) {
    Notify.create({
      type: "positive",
      message: "Successfully signed out!",
      position: "top",
      timeout: 2000,
    });
  } else {
    Notify.create({
      type: "negative",
      message: result.error || "Failed to sign out",
      position: "top",
      timeout: 3000,
    });
  }
};
</script>

<style scoped>
.app-header {
  background: #0a0a0a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid #262626;
}

.toolbar-container {
  min-height: 64px;
  padding: 0 16px;
}

/* Brand Section */
.brand-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-icon {
  font-size: 24px;
}

.brand-text {
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: -0.5px;
}

.live-badge {
  margin-left: 12px;
  font-weight: 600;
  font-size: 0.7rem;
  padding: 4px 10px;
  display: flex;
  align-items: center;
}

@keyframes pulse-animation {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.pulse-animation {
  animation: pulse-animation 2s ease-in-out infinite;
}

/* User Section */
.user-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  text-align: right;
  margin-right: 8px;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.2;
}

.user-email {
  font-size: 0.75rem;
  opacity: 0.9;
  line-height: 1.2;
}

.user-avatar-btn {
  transition: all 0.2s ease;
}

.user-avatar-btn:hover {
  transform: scale(1.05);
}

.user-avatar {
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
}

.user-avatar-btn:hover .user-avatar {
  border-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
}

/* User Menu */
.user-menu-list {
  min-width: 280px;
  padding: 8px;
}

.user-menu-header {
  padding: 16px;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 8px;
  margin-bottom: 8px;
}

.clear-data-item {
  border-radius: 6px;
  margin-top: 4px;
  transition: all 0.2s ease;
}

.clear-data-item:hover {
  background: #fff7ed;
}

.logout-item {
  border-radius: 6px;
  margin-top: 4px;
  transition: all 0.2s ease;
}

.logout-item:hover {
  background: #fef2f2;
}

/* Mobile Responsive */
@media (max-width: 599px) {
  .toolbar-container {
    padding: 0 12px;
  }

  .brand-text {
    font-size: 1rem;
  }

  .live-badge {
    font-size: 0.65rem;
    padding: 3px 8px;
    margin-left: 8px;
  }

  .user-avatar {
    width: 36px;
    height: 36px;
  }

  .user-menu-list {
    min-width: 260px;
  }
}

/* Extra small mobile */
@media (max-width: 400px) {
  .brand-text {
    display: none;
  }

  .brand-icon {
    font-size: 28px;
  }

  .live-badge {
    margin-left: 4px;
  }
}
</style>
