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
        <div
          v-if="isUsingCachedData && formattedLastSessionDate"
          class="text-caption"
        >
          Last trading session: {{ formattedLastSessionDate }}
        </div>
        <div
          v-if="nextTradingSession && !marketStatus.isOpen"
          class="text-caption"
        >
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

        <!-- Expiry Information Banner -->
        <div v-if="currentIndexData" class="expiry-banner q-mb-md">
          <div class="expiry-header">
            <q-icon name="event" size="sm" class="q-mr-sm" />
            <span class="text-weight-bold">Options Expiry Information</span>
          </div>
          <div class="expiry-content">
            <div class="expiry-item">
              <div class="expiry-label">Current Expiry</div>
              <div class="expiry-value">
                {{ currentIndexData.currentExpiry }}
              </div>
            </div>
            <div class="expiry-divider"></div>
            <div class="expiry-item">
              <div class="expiry-label">Next Expiry</div>
              <div class="expiry-value">{{ currentIndexData.nextExpiry }}</div>
            </div>
          </div>
        </div>

        <!-- Error Banner with Dismiss -->
        <q-banner v-if="error" class="bg-orange-9 text-white q-mb-md" rounded>
          <template v-slot:avatar>
            <q-icon name="warning" />
          </template>
          <div>
            <div class="text-weight-bold">API Fetch Failed</div>
            <div class="text-caption">{{ error }}</div>
            <div class="text-caption q-mt-xs">
              The app will continue to show existing data and retry on the next
              scheduled interval.
            </div>
          </div>
          <template v-slot:action>
            <q-btn flat color="white" label="Dismiss" @click="clearError" />
          </template>
        </q-banner>

        <div v-if="currentIndexData" class="q-mb-md">
          <q-card flat bordered>
            <q-card-section>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-3">
                  <q-card flat class="dashboard-card" bordered>
                    <q-card-section class="text-center">
                      <div class="text-h6 text-grey-9">
                        {{ currentIndexData.name }}
                      </div>
                      <div
                        v-if="currentIndexData.spotPrice"
                        class="text-h4 text-primary q-mt-sm"
                      >
                        {{ formatNumber(currentIndexData.spotPrice) }}
                      </div>
                      <div class="text-caption text-grey-6">
                        {{
                          currentIndexData.spotPrice
                            ? "Spot Price"
                            : "Selected Index"
                        }}
                      </div>
                    </q-card-section>
                  </q-card>
                </div>

                <div v-if="currentIndexData.latestPCR" class="col-12 col-md-3">
                  <q-card flat class="dashboard-card" bordered>
                    <q-card-section class="text-center">
                      <div class="text-h4 text-grey-9">
                        {{ currentIndexData.latestPCR.pcr?.toFixed(2) }}
                      </div>
                      <div class="text-caption text-grey-6 q-mb-xs">
                        Current PCR
                      </div>
                      <TrendIndicator
                        v-if="currentIndexData.latestPCR.trend !== 'neutral'"
                        :trend="currentIndexData.latestPCR.trend"
                        :change-percent="
                          currentIndexData.latestPCR.pcrChangePercent
                        "
                        :change="currentIndexData.latestPCR.pcrChange"
                        size="sm"
                        :show-value="true"
                      />
                      <div v-else class="text-caption text-grey-6">
                        No change
                      </div>
                    </q-card-section>
                  </q-card>
                </div>

                <div v-if="currentIndexData.latestPCR" class="col-12 col-md-3">
                  <q-card flat class="dashboard-card" bordered>
                    <q-card-section class="text-center">
                      <div class="text-h6 text-grey-9">
                        <q-icon
                          :name="
                            currentIndexData.latestPCR.oiDiff >= 0
                              ? 'trending_up'
                              : 'trending_down'
                          "
                          :color="
                            currentIndexData.latestPCR.oiDiff >= 0
                              ? 'positive'
                              : 'negative'
                          "
                        />
                        {{
                          formatNumber(
                            Math.abs(currentIndexData.latestPCR.oiDiff)
                          )
                        }}
                      </div>
                      <div class="text-caption text-grey-6">OI Change</div>
                    </q-card-section>
                  </q-card>
                </div>

                <div v-if="currentIndexData.latestPCR" class="col-12 col-md-3">
                  <q-card flat class="dashboard-card" bordered>
                    <q-card-section class="text-center">
                      <div class="text-h6 text-grey-9">
                        {{
                          currentIndexData.latestPCR.marketIndicator.toUpperCase()
                        }}
                      </div>
                      <div class="text-caption text-grey-6">Market Signal</div>
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
          <div class="text-grey-7 q-mt-md">
            No PCR data available yet. Data will be updated every 3 minutes.
          </div>
        </div>

        <div
          v-if="
            isLoading &&
            (!currentIndexData || currentIndexData.pcrHistory.length === 0)
          "
          class="text-center q-pa-lg"
        >
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
                  <q-chip color="green" text-color="white" size="sm"
                    >Bullish</q-chip
                  >
                </div>
                <div class="text-caption">
                  PCR &gt; 1.2 indicates more Put options, suggesting bullish
                  sentiment as traders hedge against upside.
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-md-4">
            <q-card flat bordered class="full-height">
              <q-card-section>
                <div class="text-weight-bold q-mb-sm">
                  <q-chip color="red" text-color="white" size="sm"
                    >Bearish</q-chip
                  >
                </div>
                <div class="text-caption">
                  PCR &lt; 0.8 indicates more Call options, suggesting bearish
                  sentiment as traders expect downside.
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-md-4">
            <q-card flat bordered class="full-height">
              <q-card-section>
                <div class="text-weight-bold q-mb-sm">
                  <q-chip color="grey" text-color="white" size="sm"
                    >Neutral</q-chip
                  >
                </div>
                <div class="text-caption">
                  PCR between 0.8 and 1.2 indicates balanced sentiment with no
                  strong directional bias.
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
import { computed } from "vue";
import { usePCRAnalysis } from "../composables/usePCRAnalysis";
import PCRAnalysisTable from "./PCRAnalysisTable.vue";
import IndexSelector from "./IndexSelector.vue";
import TrendIndicator from "./TrendIndicator.vue";
import type { MarketStatus } from "../types/marketSchedule";

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
  clearError,
  availableIndices,
} = usePCRAnalysis();

const currentIndexData = computed(() => getCurrentIndexData());

function handleRefresh() {
  refresh();
}

function formatLastUpdate(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatTradingSession(date: Date): string {
  return date.toLocaleString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMarketStatusBannerClass(
  status: MarketStatus["currentStatus"]
): string {
  switch (status) {
    case "trading":
      return "bg-green-2 text-green-9";
    case "pre-market":
      return "bg-blue-2 text-blue-9";
    case "post-market":
      return "bg-orange-2 text-orange-9";
    case "weekend":
      return "bg-grey-3 text-grey-8";
    case "holiday":
    case "bank-holiday":
      return "bg-purple-2 text-purple-9";
    default:
      return "bg-grey-3 text-grey-8";
  }
}

function getMarketStatusIcon(status: MarketStatus["currentStatus"]): string {
  switch (status) {
    case "trading":
      return "show_chart";
    case "pre-market":
      return "schedule";
    case "post-market":
      return "nights_stay";
    case "weekend":
      return "weekend";
    case "holiday":
    case "bank-holiday":
      return "celebration";
    default:
      return "info";
  }
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}
</script>

<style scoped>
.pcr-dashboard {
  width: 100%;
}

.dashboard-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.dashboard-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.expiry-banner {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.expiry-header {
  display: flex;
  align-items: center;
  color: #0a0a0a;
  font-size: 0.95rem;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.expiry-content {
  display: flex;
  align-items: center;
  gap: 24px;
}

.expiry-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.expiry-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
}

.expiry-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #0a0a0a;
}

.expiry-divider {
  width: 1px;
  height: 40px;
  background: #e5e7eb;
}

@media (max-width: 599px) {
  .expiry-content {
    flex-direction: column;
    gap: 16px;
  }

  .expiry-divider {
    width: 100%;
    height: 1px;
  }
}
</style>
