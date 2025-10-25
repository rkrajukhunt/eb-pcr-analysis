<template>
  <div class="index-selector">
    <q-btn-toggle
      v-model="selectedIndex"
      :options="indexOptions"
      toggle-color="primary"
      color="white"
      text-color="primary"
      @update:model-value="handleIndexChange"
      unelevated
      spread
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { IndexSymbol } from '../types/market'

interface Props {
  modelValue: IndexSymbol
  availableIndices: IndexSymbol[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: IndexSymbol]
}>()

const selectedIndex = ref<IndexSymbol>(props.modelValue)

const indexOptions = props.availableIndices.map(symbol => ({
  label: getIndexLabel(symbol),
  value: symbol
}))

function getIndexLabel(symbol: IndexSymbol): string {
  const labels: Record<IndexSymbol, string> = {
    NIFTY: 'Nifty 50',
    BANKNIFTY: 'Bank Nifty',
    FINNIFTY: 'Fin Nifty',
    MIDCPNIFTY: 'Midcap Nifty'
  }
  return labels[symbol]
}

function handleIndexChange(value: IndexSymbol) {
  emit('update:modelValue', value)
}

watch(() => props.modelValue, (newValue) => {
  selectedIndex.value = newValue
})
</script>

<style scoped>
.index-selector {
  width: 100%;
  max-width: 600px;
}

:deep(.q-btn-toggle) {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}
</style>
