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
            <span>{{ dataStore.lastTemperature }}</span>
            <span class="ml-2 text-2xl relative -top-6">°C</span>
          </div>
          <div class="text-gray-500 dark:text-gray-400">
            <span class="mr-2">{{ dataStore.relativeTime }}</span> <br/>
            <Icon name="mingcute:time-line" class="mr-1"/>
            <span class="text-sm">{{ dataStore.lastEntryTime }}</span>
          </div>
        </div>
      </div>

      <div class="grid">
        <span class="label">humidity</span>
        <span>{{ dataStore.lastHumidity }}%</span>
      </div>
      <div class="grid">
        <span class="label">heat index</span>
        <span>{{ dataStore.lastHeatIndex }} °C</span>
      </div>
      <div class="grid">
        <span class="label">today high</span>
        <div>
          <span>{{ dataStore.todayHighTempData }} °C </span>
          <span class="text-gray-400 text-sm">({{dataStore.todayHighTempTime}})</span>
        </div>
      </div>
      <div class="grid">
        <span class="label">today low</span>
        <div>
          <span>{{ dataStore.todayLowTempData }} °C </span>
          <span class="text-gray-400 text-sm">({{dataStore.todayLowTempTime}})</span>
        </div>
      </div>
      <div class="grid">
        <span class="label">status</span>
        <span>{{  }}</span>
      </div>
    </div>
</template>

<style scoped>

</style>