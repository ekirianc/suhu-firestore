<script setup lang="ts">
interface Props{
  isDataPoint: boolean
  data: number
  unit?: string
}

const props = defineProps<Props>();
</script>

<template>
  <div>
    <span v-if="isDataPoint">{{ data }}</span>
    <span v-else-if="!isDataPoint && data % 1 === 0">{{ data }}</span>
    <span v-else>{{ data.toFixed(2) }}</span>

    <span class="ml-1">{{ unit }}</span>
  </div>
</template>

<style scoped>

</style>