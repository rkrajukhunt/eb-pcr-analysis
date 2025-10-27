<template>
  <div class="trend-indicator" :class="getTrendClass()">
    <q-icon
      :name="getTrendIcon()"
      :size="size"
      :class="getTrendIconClass()"
    />
    <span v-if="showValue" class="trend-value">
      {{ formatChange() }}
    </span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  trend: 'up' | 'down' | 'neutral'
  changePercent: number
  change?: number
  size?: string
  showValue?: boolean
  showPercent?: boolean
  inline?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  showValue: true,
  showPercent: true,
  inline: false
})

function getTrendIcon(): string {
  switch (props.trend) {
    case 'up':
      return 'trending_up'
    case 'down':
      return 'trending_down'
    case 'neutral':
      return 'trending_flat'
    default:
      return 'trending_flat'
  }
}

function getTrendClass(): string {
  const baseClass = props.inline ? 'inline' : ''
  return `${baseClass} trend-${props.trend}`
}

function getTrendIconClass(): string {
  switch (props.trend) {
    case 'up':
      return 'text-green'
    case 'down':
      return 'text-red'
    case 'neutral':
      return 'text-grey'
    default:
      return 'text-grey'
  }
}

function formatChange(): string {
  const parts: string[] = []

  if (props.change !== undefined && props.change !== 0) {
    const sign = props.change > 0 ? '+' : ''
    parts.push(`${sign}${props.change.toFixed(2)}`)
  }

  if (props.showPercent && props.changePercent !== 0) {
    const sign = props.changePercent > 0 ? '+' : ''
    parts.push(`(${sign}${props.changePercent.toFixed(2)}%)`)
  }

  return parts.join(' ')
}
</script>

<style scoped>
.trend-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.trend-indicator.inline {
  display: inline-flex;
}

.trend-up .trend-value {
  color: #21ba45;
}

.trend-down .trend-value {
  color: #c10015;
}

.trend-neutral .trend-value {
  color: #666;
}

.trend-value {
  font-size: 0.875rem;
  white-space: nowrap;
}
</style>
