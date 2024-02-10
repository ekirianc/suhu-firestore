<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useDataStore } from '~/store';
import {windowSize} from "~/composables/windowSize";

useHead({
  title: 'Chart View',
})

const dataStore = useDataStore();

const isLoading = ref(true)
onMounted( () => {
  dataStore.activeRouter = 'chart'
  isLoading.value = false
})

const { width, isSmallScreen } = windowSize()

</script>


<template>
  <div class="grid lg:grid-cols-8 xl:grid-cols-6 mb-8 md:mx-20">
    <sidebar-info class="overflow-hidden hidden lg:block lg:col-span-2 xl:col-span-1"/>

    <div v-if="isLoading" class="relative lg:col-span-6 xl:col-span-5">
      <loading class="h-3/4"/>
    </div>
    <div v-else class="lg:col-span-6 xl:col-span-5 overflow-hidden">
      <sidebar-info-mini class="lg:hidden"/>
      <chart-main/>

      <div class="mt-4 overflow-x-auto ">
        <div class="lg:flex lg:space-x-4 lg:space-y-0 space-y-4 mb-4">
          <div> <chart-temp-diff :class="[dataStore.isFullscreen? '' :'lg:w-[500px]']"/> </div>
          <div> <chart-high-low :class="[dataStore.isFullscreen? '' :'lg:w-[500px]']"/> </div>
          <div> <chart-correlation :class="[dataStore.isFullscreen? '' :'lg:w-[500px]']"/> </div>
        </div>
      </div>

      <div v-if="!isSmallScreen" class="md:text-right  dark:text-gray-400 text-gray-600 w-full">
        <span class="ml-2 md:mr-2">*click the chart to enable zoom</span>
      </div>
    </div>
  </div>

  <div class="p-4 flex justify-center relative -top-5">
    <GithubLink class="lg:hidden"/>
  </div>
</template>