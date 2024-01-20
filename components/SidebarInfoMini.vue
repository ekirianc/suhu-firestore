<script setup lang="ts">
import {useDataStore} from "~/store";

const dataStore = useDataStore()
</script>

<template>
  <div class="px-4 py-8 flex space-x-4 justify-center text-gray-800 font-inter dark:text-white">
    <div class="grid">
      <span>Last Temp.</span>
      <span class="text-4xl font-medium">{{dataStore.last_temperature}}</span>
      <span class="text-sm">{{ dataStore.relative_time }}</span>
    </div>
    <div class="grid">
      <span>Humid: {{dataStore.last_humidity}}%</span>
      <span>Peak: {{dataStore.today_high_temp_data}}°C <span class="text-gray-400">({{dataStore.today_high_temp_time}})</span></span>
      <span>Low: {{dataStore.today_low_temp_data}}°C <span class="text-gray-400">({{dataStore.today_low_temp_time}})</span></span>
    </div>
  </div>
</template>

<style scoped>

</style>