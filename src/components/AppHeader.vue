<template>
  <q-header elevated class="bg-primary text-white">
    <q-toolbar>
      <q-toolbar-title class="row items-center">
        <q-icon name="show_chart" size="sm" class="q-mr-sm" />
        <span class="text-weight-bold">EB PCR Analysis</span>
        <q-badge v-if="isMarketOpen" color="green" class="q-ml-sm" floating>
          LIVE
        </q-badge>
      </q-toolbar-title>

      <q-space />

      <!-- User Profile Section -->
      <div v-if="currentUser" class="row items-center q-gutter-sm">
        <q-btn
          flat
          dense
          round
          icon="person"
        >
          <q-menu>
            <q-list style="min-width: 250px">
              <!-- User Info -->
              <q-item>
                <q-item-section avatar>
                  <q-avatar size="48px">
                    <img v-if="currentUser.photoURL" :src="currentUser.photoURL" />
                    <q-icon v-else name="person" size="32px" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold">
                    {{ currentUser.displayName }}
                  </q-item-label>
                  <q-item-label caption class="text-caption">
                    {{ currentUser.email }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-separator />

              <!-- User ID -->
              <q-item>
                <q-item-section>
                  <q-item-label caption>User ID</q-item-label>
                  <q-item-label class="text-caption">
                    {{ currentUser.uid.substring(0, 20) }}...
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-separator />

              <!-- Logout Button -->
              <q-item
                clickable
                v-close-popup
                @click="handleSignOut"
                class="text-negative"
              >
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Sign Out</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>

          <q-tooltip>User Profile</q-tooltip>
        </q-btn>

        <!-- User Display (Desktop) -->
        <div class="gt-sm">
          <div class="text-caption">{{ currentUser.displayName }}</div>
        </div>
      </div>
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { currentUser, signOut } from '../services/auth'
import { Notify } from 'quasar'

interface Props {
  isMarketOpen?: boolean
}

withDefaults(defineProps<Props>(), {
  isMarketOpen: false
})

const loading = ref(false)

const handleSignOut = async () => {
  loading.value = true
  const result = await signOut()
  loading.value = false

  if (result.success) {
    Notify.create({
      type: 'positive',
      message: 'Successfully signed out!',
      position: 'top'
    })
  } else {
    Notify.create({
      type: 'negative',
      message: result.error || 'Failed to sign out',
      position: 'top'
    })
  }
}
</script>

<style scoped>
.q-toolbar {
  min-height: 64px;
}
</style>
