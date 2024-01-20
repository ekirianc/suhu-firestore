<script setup lang="ts">
import {useDataStore} from "~/store";

const dataStore = useDataStore()
</script>

<template>
    <div class="py-4 text-xl space-y-5 dark:text-gray-100">
      <div class="grid md:text-left">
        <span class="label dark:text-gray-400">Current</span>
        <div>
          <div class="text-6xl font-medium font-inter text-gray-800 dark:text-white">
            <span>{{ dataStore.last_temperature }}</span>
            <span class="ml-2 text-2xl relative -top-6">°C</span>
          </div>
          <div class="text-gray-500 dark:text-gray-400">
            <span class="mr-2">{{ dataStore.relative_time }}</span> <br/>
            <Icon name="mingcute:time-line" class="mr-1"/>
            <span class="text-sm">{{ dataStore.last_entry_time }}</span>
          </div>
        </div>
      </div>

      <div class="grid">
        <span class="label">humidity</span>
        <span>{{ dataStore.last_humidity }}%</span>
      </div>
      <div class="grid">
        <span class="label">heat index</span>
        <span>{{ dataStore.last_heat_index }} °C</span>
      </div>
      <div class="grid">
        <span class="label">today high</span>
        <div>
          <span>{{ dataStore.today_high_temp_data }} °C </span>
          <span class="text-gray-400 text-sm">({{dataStore.today_high_temp_time}})</span>
        </div>
      </div>
      <div class="grid">
        <span class="label">today low</span>
        <div>
          <span>{{ dataStore.today_low_temp_data }} °C </span>
          <span class="text-gray-400 text-sm">({{dataStore.today_low_temp_time}})</span>
        </div>
      </div>
      <div class="grid">
        <span class="label">data count</span>
        <span>
          {{ dataStore.today_data_point_count }}
          <span class="text-gray-400 text-sm"> | {{( (dataStore.today_data_point_count/288)*100).toFixed(2) }}%</span>
        </span>
      </div>
    </div>
</template>

<style scoped>

</style>