<template>
  <q-page class="login-page">
    <div class="login-container">
      <!-- Left side - Branding (Hidden on mobile) -->
      <div class="login-branding gt-sm">
        <div class="branding-content">
          <div class="brand-icon">
            <q-icon name="show_chart" size="80px" color="white" />
          </div>
          <h1 class="brand-title">PCR Analysis</h1>
          <p class="brand-subtitle">
            Real-time Put-Call Ratio analysis for Indian stock market indices
          </p>
          <div class="feature-list">
            <div class="feature-item">
              <q-icon name="check_circle" color="white" size="sm" />
              <span>Live market data updates</span>
            </div>
            <div class="feature-item">
              <q-icon name="check_circle" color="white" size="sm" />
              <span>Smart market hours detection</span>
            </div>
            <div class="feature-item">
              <q-icon name="check_circle" color="white" size="sm" />
              <span>Historical trend analysis</span>
            </div>
            <div class="feature-item">
              <q-icon name="check_circle" color="white" size="sm" />
              <span>Multiple indices support</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right side - Login form -->
      <div class="login-form-container">
        <div class="login-form">
          <!-- Logo for mobile -->
          <div class="mobile-logo lt-md">
            <q-icon name="show_chart" size="60px" color="grey-9" />
          </div>

          <div class="form-header">
            <h2 class="form-title">Welcome back</h2>
            <p class="form-description">
              Sign in to access your PCR analysis dashboard
            </p>
          </div>

          <div class="form-body">
            <!-- Google Sign In Button -->
            <q-btn
              :loading="loading"
              :disable="loading"
              class="google-btn"
              unelevated
              no-caps
              @click="handleGoogleSignIn"
            >
              <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span class="google-btn-text">Continue with Google</span>
            </q-btn>

            <!-- Error Message -->
            <div v-if="error" class="error-message">
              <q-icon name="error_outline" size="sm" />
              <span>{{ error }}</span>
            </div>

            <!-- Divider -->
            <div class="divider">
              <span class="divider-text">Secure authentication</span>
            </div>

            <!-- Info Text -->
            <p class="info-text">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>

          <!-- Footer -->
          <div class="form-footer">
            <p class="footer-text">
              <q-icon name="lock" size="xs" />
              Your data is encrypted and secure
            </p>
          </div>
        </div>
      </div>
    </div>
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
      position: 'top',
      timeout: 2000
    })
  } else {
    error.value = result.error || 'Failed to sign in'
    Notify.create({
      type: 'negative',
      message: result.error || 'Failed to sign in',
      position: 'top',
      timeout: 3000
    })
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.login-container {
  display: flex;
  width: 100%;
  max-width: 1200px;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  min-height: 600px;
}

/* Left Side - Branding */
.login-branding {
  flex: 1;
  background: #0a0a0a;
  padding: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.branding-content {
  max-width: 400px;
}

.brand-icon {
  margin-bottom: 2rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.brand-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 1.1rem;
  opacity: 0.95;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
  opacity: 0.9;
}

/* Right Side - Form */
.login-form-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #ffffff;
}

.login-form {
  width: 100%;
  max-width: 420px;
}

.mobile-logo {
  text-align: center;
  margin-bottom: 2rem;
}

.form-header {
  margin-bottom: 2rem;
}

.form-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.form-description {
  font-size: 0.95rem;
  color: #6b7280;
  line-height: 1.5;
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Google Button */
.google-btn {
  width: 100%;
  height: 56px;
  background: white;
  border: 2px solid #d1d5db;
  border-radius: 12px;
  color: #1a1a1a;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.google-btn:hover {
  background: #fafafa;
  border-color: #0a0a0a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.google-btn:active {
  transform: translateY(0);
}

.google-icon {
  margin-right: 12px;
}

.google-btn-text {
  flex: 1;
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.875rem;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Divider */
.divider {
  position: relative;
  text-align: center;
  margin: 1.5rem 0;
}

.divider::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 100%;
  height: 1px;
  background: #e5e7eb;
}

.divider-text {
  position: relative;
  display: inline-block;
  padding: 0 1rem;
  background: #ffffff;
  color: #9ca3af;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Info Text */
.info-text {
  font-size: 0.8125rem;
  color: #6b7280;
  text-align: center;
  line-height: 1.5;
}

/* Footer */
.form-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.footer-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #9ca3af;
}

/* Mobile Responsive */
@media (max-width: 1023px) {
  .login-page {
    background: white;
    padding: 0;
  }

  .login-container {
    box-shadow: none;
    border-radius: 0;
    min-height: 100vh;
  }

  .login-form-container {
    padding: 2rem 1.5rem;
    background: white;
  }

  .form-title {
    font-size: 1.625rem;
  }
}

@media (max-width: 599px) {
  .login-form-container {
    padding: 1.5rem 1rem;
  }

  .form-title {
    font-size: 1.5rem;
  }

  .brand-title {
    font-size: 2rem;
  }

  .google-btn {
    height: 52px;
  }
}
</style>
