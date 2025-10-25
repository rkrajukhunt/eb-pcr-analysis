<template>
  <q-page class="flex flex-center">
    <q-card class="login-card">
      <q-card-section class="text-center">
        <div class="text-h4 text-weight-bold q-mb-md">Welcome</div>
        <div class="text-subtitle1 text-grey-7">Sign in to continue</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-btn
          :loading="loading"
          :disable="loading"
          color="primary"
          class="full-width q-py-sm"
          size="lg"
          @click="handleGoogleSignIn"
        >
          <q-icon name="login" class="q-mr-sm" />
          Sign in with Google
        </q-btn>
      </q-card-section>

      <q-card-section v-if="error" class="q-pt-none">
        <q-banner class="bg-negative text-white" rounded>
          {{ error }}
        </q-banner>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { signInWithGoogle } from '../services/auth'
import { Notify } from 'quasar'

const loading = ref(false)
const error = ref('')

const handleGoogleSignIn = async () => {
  loading.value = true
  error.value = ''

  const result = await signInWithGoogle()

  loading.value = false

  if (result.success) {
    Notify.create({
      type: 'positive',
      message: 'Successfully signed in!',
      position: 'top'
    })
  } else {
    error.value = result.error || 'Failed to sign in'
    Notify.create({
      type: 'negative',
      message: result.error || 'Failed to sign in',
      position: 'top'
    })
  }
}
</script>

<style scoped>
.login-card {
  width: 100%;
  max-width: 400px;
  min-width: 300px;
}
</style>
