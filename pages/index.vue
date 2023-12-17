<script lang="ts" setup>
import {useDataStore} from "~/store";

const dataStore = useDataStore()

definePageMeta({
  layout: false,
});

onMounted(async () => {
  if (!dataStore.lastTemperature) {
    await dataStore.fetchDataFromFirestore()
  }
});
</script>

<template>

  <div class="min-h-screen grid place-content-center font-inter">
    <div class="flex justify-center font-medium shadow-text text-bg-clip">
      <span class="text-[12rem] px-4 leading-none">{{ dataStore.lastTemperature }}</span>
      <div class="grid place-content-center text-right p-2">
        <span class="text-8xl mb-4">°C</span>
        <span class="text-5xl">{{ dataStore.lastHeatIndex }}</span>
      </div>
    </div>
    <div class="flex justify-between">
      <div class="flex font-medium text-xl text-gray-500">
        <div class="mr-4"><Icon name="mdi:temperature" class="text-red-500 text-2xl"/>
          {{ dataStore.todayHighTempData }} °C
        </div>
        <div><Icon name="mdi:temperature" class="text-sky-500 text-2xl"/>
          {{ dataStore.todayLowTempData }} °C
        </div>
      </div>
      <div>
        <span class="font-bold mr-2 text-gray-600"><Icon name="mingcute:time-line"/></span>
        <span class="font-bold mr-2 text-gray-600">{{ dataStore.relativeTime }}</span>
        <span class="text-gray-400">({{ dataStore.lastEntryTime }})</span>
      </div>
    </div>
    <div class="flex space-x-4 text-center justify-center mt-8">
      <nuxt-link to="/chart" class="px-6 py-2 bg-white rounded-lg text-pink-600">
        <icon name="lucide:line-chart" class="mr-4 text-xl"/>
        <span>chart</span>
      </nuxt-link>
      <nuxt-link to="/list" class="px-6 py-2 bg-white rounded-lg text-pink-600">
        <icon name="fluent:apps-list-detail-20-regular" class="mr-4 text-2xl"/>
        <span>List</span>
      </nuxt-link>
    </div>
  </div>

</template>