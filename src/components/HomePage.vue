<template>
  <q-page class="q-pa-md">
    <q-card class="q-mb-md">
      <q-card-section class="bg-primary text-white">
        <div class="row items-center">
          <div class="col">
            <div class="text-h5">Welcome to EB PCR Analysis</div>
            <div class="text-subtitle2">Indian Stock Market Options Analysis</div>
          </div>
          <div class="col-auto">
            <q-btn
              flat
              color="white"
              label="Sign Out"
              icon="logout"
              @click="handleSignOut"
              :loading="loading"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-section v-if="currentUser">
        <div class="flex items-center">
          <q-avatar size="48px" class="q-mr-md">
            <img v-if="currentUser.photoURL" :src="currentUser.photoURL" />
            <q-icon v-else name="person" size="24px" />
          </q-avatar>
          <div>
            <div class="text-subtitle1">{{ currentUser.displayName }}</div>
            <div class="text-caption text-grey-7">{{ currentUser.email }}</div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <PCRDashboard />
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { currentUser, signOut } from '../services/auth'
import { Notify } from 'quasar'
import PCRDashboard from './PCRDashboard.vue'

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
