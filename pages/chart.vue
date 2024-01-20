<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDataStore } from '~/store';

const dataStore = useDataStore();
const isLoaded = ref(false)

onMounted(async () => {
  if (!dataStore.last_temperature) {
    await dataStore.fetchDataFromFirestore();
  }
  isLoaded.value = true
});
</script>


<template>
  <div class="grid lg:grid-cols-8 xl:grid-cols-6 mb-12">
    <sidebar-info class="overflow-hidden hidden lg:block lg:col-span-2 xl:col-span-1"/>

    <div class="lg:col-span-6 xl:col-span-5">
      <sidebar-info-mini class="lg:hidden"/>
      <chart-main v-if="isLoaded"/>

      <div v-if="isLoaded" class="xl:flex mt-4 space-y-4 xl:space-y-0 xl:space-x-4">
        <div class="xl:basis-1/2">
          <chart-high-low class="mb-4"/>
          <chart-deviation/>
        </div>
        <div class="xl:basis-1/2">
          <chart-temp-diff class="mb-4"/>
          <chart-correlation />
        </div>
      </div>

      <div class="md:text-right  dark:text-gray-400 text-gray-600 w-full">
        <span class="ml-2 md: mr-2">*click the chart to enable zoom</span>
      </div>
    </div>

  </div>

  <div class="p-4 flex justify-center md:justify-end relative -top-5">
    <a href="https://github.com/ekirianc/temperature-monitor-2 " target="_blank"
       class="dark:text-gray-400 dark:hover:text-gray-100 text-gray-600 hover:text-gray-900 block">
      <Icon name ="mdi:github"/>
      <span class="relative top-0.5 ml-1 -z-50">Github</span>
    </a>
  </div>
</template>