<template>
  <div class="pcr-table-container">
    <q-table
      :rows="rows"
      :columns="columns"
      row-key="timestamp"
      flat
      bordered
      :pagination="{ rowsPerPage: 10 }"
      :loading="loading"
      class="pcr-table"
    >
      <template v-slot:top>
        <div class="full-width row items-center q-gutter-md">
          <div class="text-h6">Historical PCR Data</div>
          <q-space />
          <q-btn
            color="grey-9"
            icon="refresh"
            label="Refresh Data"
            @click="$emit('refresh')"
            :loading="loading"
            unelevated
          />
        </div>
      </template>

      <template v-slot:body-cell-pcr="props">
        <q-td :props="props">
          <div class="row items-center justify-center q-gutter-xs">
            <q-chip
              :color="getPCRColor(props.row.pcr)"
              text-color="white"
              size="sm"
            >
              {{ props.row.pcr }}
            </q-chip>
            <TrendIndicator
              v-if="props.row.trend !== 'neutral'"
              :trend="props.row.trend"
              :change-percent="props.row.pcrChangePercent"
              :change="props.row.pcrChange"
              size="xs"
              :show-value="true"
            />
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-callOI="props">
        <q-td :props="props">
          <div>{{ formatNumber(props.row.callOI) }}</div>
        </q-td>
      </template>

      <template v-slot:body-cell-putOI="props">
        <q-td :props="props">
          <div>{{ formatNumber(props.row.putOI) }}</div>
        </q-td>
      </template>

      <template v-slot:body-cell-callVolume="props">
        <q-td :props="props">
          <div>{{ formatNumber(props.row.callVolume) }}</div>
        </q-td>
      </template>

      <template v-slot:body-cell-putVolume="props">
        <q-td :props="props">
          <div>{{ formatNumber(props.row.putVolume) }}</div>
        </q-td>
      </template>

      <template v-slot:body-cell-oiDiff="props">
        <q-td :props="props">
          <div :class="getDiffClass(props.row.oiDiff)">
            <q-icon
              :name="props.row.oiDiff >= 0 ? 'trending_up' : 'trending_down'"
              size="sm"
            />
            {{ formatNumber(Math.abs(props.row.oiDiff)) }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-volumeDiff="props">
        <q-td :props="props">
          <div :class="getDiffClass(props.row.volumeDiff)">
            <q-icon
              :name="props.row.volumeDiff >= 0 ? 'trending_up' : 'trending_down'"
              size="sm"
            />
            {{ formatNumber(Math.abs(props.row.volumeDiff)) }}
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-marketIndicator="props">
        <q-td :props="props">
          <q-chip
            :color="getIndicatorColor(props.row.marketIndicator)"
            text-color="white"
            size="sm"
          >
            {{ props.row.marketIndicator.toUpperCase() }}
          </q-chip>
        </q-td>
      </template>

      <template v-slot:body-cell-timestamp="props">
        <q-td :props="props">
          <div class="text-caption">{{ formatTime(props.row.timestamp) }}</div>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PCRData } from '../types/market'
import TrendIndicator from './TrendIndicator.vue'

interface Props {
  data: PCRData[]
  indexName: string
  currentExpiry: string
  nextExpiry: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

defineEmits<{
  refresh: []
}>()

const columns = [
  {
    name: 'timestamp',
    label: 'Time',
    field: 'timestamp',
    align: 'left' as const,
    sortable: true
  },
  {
    name: 'callOI',
    label: 'Call OI',
    field: 'callOI',
    align: 'right' as const,
    sortable: true
  },
  {
    name: 'putOI',
    label: 'Put OI',
    field: 'putOI',
    align: 'right' as const,
    sortable: true
  },
  {
    name: 'callVolume',
    label: 'Call Volume',
    field: 'callVolume',
    align: 'right' as const,
    sortable: true
  },
  {
    name: 'putVolume',
    label: 'Put Volume',
    field: 'putVolume',
    align: 'right' as const,
    sortable: true
  },
  {
    name: 'pcr',
    label: 'PCR',
    field: 'pcr',
    align: 'center' as const,
    sortable: true
  },
  {
    name: 'oiDiff',
    label: 'OI Change',
    field: 'oiDiff',
    align: 'right' as const,
    sortable: true
  },
  {
    name: 'volumeDiff',
    label: 'Volume Change',
    field: 'volumeDiff',
    align: 'right' as const,
    sortable: true
  },
  {
    name: 'marketIndicator',
    label: 'Signal',
    field: 'marketIndicator',
    align: 'center' as const,
    sortable: true
  }
]

const rows = computed(() => {
  return [...props.data].reverse() // Show latest first
})

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num)
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function getPCRColor(pcr: number): string {
  if (pcr >= 1.2) return 'green'
  if (pcr <= 0.8) return 'red'
  return 'orange'
}

function getIndicatorColor(indicator: string): string {
  if (indicator === 'bullish') return 'green'
  if (indicator === 'bearish') return 'red'
  return 'grey'
}

function getDiffClass(diff: number): string {
  if (diff > 0) return 'text-green text-weight-bold'
  if (diff < 0) return 'text-red text-weight-bold'
  return 'text-grey'
}
</script>

<style scoped>
.pcr-table-container {
  width: 100%;
}

.pcr-table {
  font-size: 0.9rem;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
}

:deep(.q-table__top) {
  padding: 16px;
  background-color: #fafafa;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.q-table thead tr) {
  background-color: #f9fafb;
}

:deep(.q-table thead th) {
  font-weight: 600;
  color: #0a0a0a;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.q-table tbody td) {
  font-size: 0.85rem;
  border-bottom: 1px solid #f3f4f6;
}

:deep(.q-table tbody tr:hover) {
  background-color: #fafafa;
}
</style>
