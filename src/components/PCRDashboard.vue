<template>
  <div class="pcr-dashboard">
    <!-- Market Status Banner -->
    <q-banner
      v-if="marketStatus"
      :class="getMarketStatusBannerClass(marketStatus.currentStatus)"
      class="q-mb-md"
      rounded
    >
      <template v-slot:avatar>
        <q-icon :name="getMarketStatusIcon(marketStatus.currentStatus)" />
      </template>
      <div>
        <div class="text-weight-bold">{{ marketStatusMessage }}</div>
        <div v-if="isUsingCachedData && formattedLastSessionDate" class="text-caption">
          Last trading session: {{ formattedLastSessionDate }}
        </div>
        <div v-if="nextTradingSession && !marketStatus.isOpen" class="text-caption">
          Next trading session: {{ formatTradingSession(nextTradingSession) }}
        </div>
        <div v-if="marketStatus.holidayInfo" class="text-caption q-mt-xs">
          <q-icon name="celebration" size="xs" />
          {{ marketStatus.holidayInfo.name }}
        </div>
      </div>
    </q-banner>

    <q-card>
      <q-card-section>
        <div class="row items-center q-gutter-md q-mb-md">
          <div class="text-h5">PCR Analysis Dashboard</div>
          <q-space />
          <div v-if="lastUpdateTime" class="text-caption text-grey-7">
            Last updated: {{ formatLastUpdate(lastUpdateTime) }}
          </div>
        </div>

        <div class="q-mb-md">
          <IndexSelector
            v-model="selectedIndex"
            :available-indices="availableIndices"
          />
        </div>

        <q-banner v-if="error" class="bg-negative text-white q-mb-md" rounded>
          <template v-slot:avatar>
            <q-icon name="error" />
          </template>
          {{ error }}
        </q-banner>

        <div v-if="currentIndexData" class="q-mb-md">
          <q-card flat bordered>
            <q-card-section>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-3">
                  <q-card flat class="bg-blue-1">
                    <q-card-section class="text-center">
                      <div class="text-h6">{{ currentIndexData.name }}</div>
                      <div class="text-caption text-grey-7">Selected Index</div>
                    </q-card-section>
                  </q-card>
                </div>

                <div v-if="currentIndexData.latestPCR" class="col-12 col-md-3">
                  <q-card flat class="bg-green-1">
                    <q-card-section class="text-center">
                      <div class="text-h4">{{ currentIndexData.latestPCR.pcr }}</div>
                      <div class="text-caption text-grey-7">Current PCR</div>
                    </q-card-section>
                  </q-card>
                </div>

                <div v-if="currentIndexData.latestPCR" class="col-12 col-md-3">
                  <q-card flat :class="getOIDiffCardClass(currentIndexData.latestPCR.oiDiff)">
                    <q-card-section class="text-center">
                      <div class="text-h6">
                        <q-icon
                          :name="currentIndexData.latestPCR.oiDiff >= 0 ? 'trending_up' : 'trending_down'"
                        />
                        {{ formatNumber(Math.abs(currentIndexData.latestPCR.oiDiff)) }}
                      </div>
                      <div class="text-caption text-grey-7">OI Change</div>
                    </q-card-section>
                  </q-card>
                </div>

                <div v-if="currentIndexData.latestPCR" class="col-12 col-md-3">
                  <q-card flat :class="getIndicatorCardClass(currentIndexData.latestPCR.marketIndicator)">
                    <q-card-section class="text-center">
                      <div class="text-h6">{{ currentIndexData.latestPCR.marketIndicator.toUpperCase() }}</div>
                      <div class="text-caption text-grey-7">Market Signal</div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div v-if="currentIndexData && currentIndexData.pcrHistory.length > 0">
          <PCRAnalysisTable
            :data="currentIndexData.pcrHistory"
            :index-name="currentIndexData.name"
            :current-expiry="currentIndexData.currentExpiry"
            :next-expiry="currentIndexData.nextExpiry"
            :loading="isLoading"
            @refresh="handleRefresh"
          />
        </div>

        <div v-else-if="!isLoading" class="text-center q-pa-lg">
          <q-icon name="info" size="48px" color="grey-5" />
          <div class="text-grey-7 q-mt-md">No PCR data available yet. Data will be updated every 3 minutes.</div>
        </div>

        <div v-if="isLoading && (!currentIndexData || currentIndexData.pcrHistory.length === 0)" class="text-center q-pa-lg">
          <q-spinner color="primary" size="48px" />
          <div class="text-grey-7 q-mt-md">Loading PCR data...</div>
        </div>
      </q-card-section>
    </q-card>

    <q-card class="q-mt-md">
      <q-card-section>
        <div class="text-subtitle1 q-mb-md">Understanding PCR Analysis</div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-card flat bordered class="full-height">
              <q-card-section>
                <div class="text-weight-bold q-mb-sm">
                  <q-chip color="green" text-color="white" size="sm">Bullish</q-chip>
                </div>
                <div class="text-caption">
                  PCR &gt; 1.2 indicates more Put options, suggesting bullish sentiment as traders hedge against upside.
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-md-4">
            <q-card flat bordered class="full-height">
              <q-card-section>
                <div class="text-weight-bold q-mb-sm">
                  <q-chip color="red" text-color="white" size="sm">Bearish</q-chip>
                </div>
                <div class="text-caption">
                  PCR &lt; 0.8 indicates more Call options, suggesting bearish sentiment as traders expect downside.
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-md-4">
            <q-card flat bordered class="full-height">
              <q-card-section>
                <div class="text-weight-bold q-mb-sm">
                  <q-chip color="grey" text-color="white" size="sm">Neutral</q-chip>
                </div>
                <div class="text-caption">
                  PCR between 0.8 and 1.2 indicates balanced sentiment with no strong directional bias.
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePCRAnalysis } from '../composables/usePCRAnalysis'
import PCRAnalysisTable from './PCRAnalysisTable.vue'
import IndexSelector from './IndexSelector.vue'
import type { MarketStatus } from '../types/marketSchedule'

const {
  isLoading,
  error,
  lastUpdateTime,
  selectedIndex,
  marketStatus,
  marketStatusMessage,
  nextTradingSession,
  formattedLastSessionDate,
  isUsingCachedData,
  getCurrentIndexData,
  refresh,
  availableIndices
} = usePCRAnalysis()

const currentIndexData = computed(() => getCurrentIndexData())

function handleRefresh() {
  refresh()
}

function formatLastUpdate(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatTradingSession(date: Date): string {
  return date.toLocaleString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getMarketStatusBannerClass(status: MarketStatus['currentStatus']): string {
  switch (status) {
    case 'trading':
      return 'bg-green-2 text-green-9'
    case 'pre-market':
      return 'bg-blue-2 text-blue-9'
    case 'post-market':
      return 'bg-orange-2 text-orange-9'
    case 'weekend':
      return 'bg-grey-3 text-grey-8'
    case 'holiday':
    case 'bank-holiday':
      return 'bg-purple-2 text-purple-9'
    default:
      return 'bg-grey-3 text-grey-8'
  }
}

function getMarketStatusIcon(status: MarketStatus['currentStatus']): string {
  switch (status) {
    case 'trading':
      return 'show_chart'
    case 'pre-market':
      return 'schedule'
    case 'post-market':
      return 'nights_stay'
    case 'weekend':
      return 'weekend'
    case 'holiday':
    case 'bank-holiday':
      return 'celebration'
    default:
      return 'info'
  }
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num)
}

function getOIDiffCardClass(oiDiff: number): string {
  return oiDiff >= 0 ? 'bg-green-1' : 'bg-red-1'
}

function getIndicatorCardClass(indicator: string): string {
  if (indicator === 'bullish') return 'bg-green-1'
  if (indicator === 'bearish') return 'bg-red-1'
  return 'bg-grey-3'
}
</script>

<style scoped>
.pcr-dashboard {
  width: 100%;
}
</style>
