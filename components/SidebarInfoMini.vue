<script setup lang="ts">
import {useDataStore} from "~/store";

const dataStore = useDataStore()
</script>

<template>
  <div class="grid place-content-center font-inter w-full mb-4 mt-2">
    <div class="flex justify-center ">
      <div class="grid grid-rows-2 grid-flow-col gap-2 text-gray-600 dark:text-gray-200
                  [&>div]:p-4 [&>div]:card-2 [&>div]:bg-white/60">
        <div class="row-span-2 text-center content-center">
          <span class="md:text-5xl text-3xl shadow-text text-bg-clip font-bold">{{ dataStore.last_temperature.toFixed(1) }} °C</span>
          <!-- detail -->
          <div class="grid text-sm mb-2 md:mb-0">
            <div>
              <span class="font-bold mr-2"><Icon name="mingcute:time-line"/></span>
              <span class="md:font-bold">{{ dataStore.relative_time }}</span>
            </div>
            <div class="text-gray-400">({{ dataStore.last_entry_time }})</div>
          </div>
        </div>
        <div class="grid">
          <span>Hum: {{ dataStore.last_humidity }}%</span>
          <span>HI: {{ dataStore.last_heat_index }} °C</span>
        </div>
        <div class="relative">
          <div class="absolute left-2">
            <div>
              <Icon name="mdi:temperature" class="text-red-500 text-2xl"/>
              {{ dataStore.today_high_temp_data }} °C
            </div>
            <div>
              <Icon name="mdi:temperature" class="text-sky-500 text-2xl "/>
              {{ dataStore.today_low_temp_data }} °C
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>

</style>