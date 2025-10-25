<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-card-section class="bg-primary text-white">
        <div class="text-h5">Welcome to EB PCR Analysis</div>
        <div class="text-subtitle2">You are successfully logged in</div>
      </q-card-section>

      <q-card-section v-if="currentUser">
        <div class="q-gutter-md">
          <div class="flex items-center">
            <q-avatar size="64px" class="q-mr-md">
              <img v-if="currentUser.photoURL" :src="currentUser.photoURL" />
              <q-icon v-else name="person" size="32px" />
            </q-avatar>
            <div>
              <div class="text-h6">{{ currentUser.displayName }}</div>
              <div class="text-caption text-grey-7">{{ currentUser.email }}</div>
            </div>
          </div>

          <q-separator />

          <div>
            <div class="text-subtitle2 text-grey-7">User ID</div>
            <div class="text-body2">{{ currentUser.uid }}</div>
          </div>

          <q-btn
            color="negative"
            label="Sign Out"
            icon="logout"
            @click="handleSignOut"
            :loading="loading"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { currentUser, signOut } from '../services/auth'
import { Notify } from 'quasar'

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
