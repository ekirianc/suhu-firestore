<script setup lang="ts">
import {useDataStore} from "~/store";

const dataStore = useDataStore()
</script>

<template>
  <div class="px-4 py-8 flex space-x-4 justify-center text-gray-800 font-inter dark:text-white">
    <div class="grid">
      <span>Last Temp.</span>
      <span class="text-4xl font-medium">{{dataStore.lastTemperature}}</span>
      <span class="text-sm">{{ dataStore.relativeTime }}</span>
    </div>
    <div class="grid">
      <span>Humid: {{dataStore.lastHumidity}}%</span>
      <span>Peak: {{dataStore.todayHighTempData}}°C <span class="text-gray-400">({{dataStore.todayHighTempTime}})</span></span>
      <span>Low: {{dataStore.todayLowTempData}}°C <span class="text-gray-400">({{dataStore.todayLowTempTime}})</span></span>
    </div>
  </div>
</template>

<style scoped>

</style>