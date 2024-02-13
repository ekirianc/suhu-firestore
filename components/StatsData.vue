<script setup lang="ts">
interface Props{
  isDataPoint: boolean
  data: number
  unit?: string
  isPercentage?: boolean
}

const props = defineProps<Props>();

let isDark = $ref(useDark())
watch(useDark(), (_isDark) => {
  isDark = _isDark
})

</script>

<template>
  <div :class="{
    'text-sm': isPercentage,
    'text-pink-900': isPercentage && !isDark,
    'text-sky-100': isPercentage && isDark,
  }">
    <span v-if="isDataPoint">{{ data }}</span>
    <span v-else-if="!isDataPoint && data % 1 === 0">{{ data }}</span>
    <span v-else>{{ data.toFixed(2) }} </span>

    <span class="ml-1">{{ unit }}</span>
  </div>
</template>

<style scoped>

</style>