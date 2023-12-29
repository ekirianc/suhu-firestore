<script lang="ts" setup>
import {useDataStore} from "~/store";
import {formatDistanceToNow} from "date-fns";

const dataStore = useDataStore()

const isDark = useDark()
const toggleDark = useToggle(isDark)

definePageMeta({
  layout: false,
});

onMounted(async () => {
  if (!dataStore.lastTemperature) {
    await dataStore.fetchDataFromFirestore()
  }
});

function updateRelativeDatetime(){
  dataStore.relativeTime = formatDistanceToNow(dataStore.lastDatetime, { addSuffix: true, includeSeconds: true })
}

const intervalId = setInterval(updateRelativeDatetime, 60000)

onBeforeUnmount(()=>{
  // Clear the interval to avoid memory leaks
  clearInterval(intervalId)
})
</script>

<template>

  <div class="min-h-screen grid place-content-center font-inter absolute overflow-hidden z-10 w-full">
    <div class="flex justify-center font-medium shadow-text text-bg-clip">
      <span class="md:text-[12rem] text-8xl px-4 leading-none">{{ dataStore.lastTemperature }}</span>
      <div class="grid place-content-center md:text-right p-2">
        <span class="md:text-8xl text-3xl mb-4">°C</span>
        <span class="md:text-5xl text-3xl">{{ dataStore.lastHumidity }}%</span>
      </div>
    </div>
    <div class="md:flex justify-between">
      <div class="flex font-medium md:text-xl text-gray-500 justify-center dark:text-gray-200">
        <div class="mr-4"><Icon name="mdi:temperature" class="text-red-500 text-2xl"/>
          {{ dataStore.todayHighTempData }} °C
        </div>
        <div><Icon name="mdi:temperature" class="text-sky-500 text-2xl "/>
          {{ dataStore.todayLowTempData }} °C
        </div>
      </div>
      <div class="justify-center flex text-gray-600 dark:text-gray-200">
        <span class="font-bold mr-2 "><Icon name="mingcute:time-line"/></span>
        <span class="font-bold mr-2 ">{{ dataStore.relativeTime }}</span>
        <span class="text-gray-400">({{ dataStore.lastEntryTime }})</span>
      </div>
    </div>
    <div class="flex space-x-4 text-center justify-center mt-8">
      <nuxt-link to="/chart" class="px-6 py-2 bg-white rounded-xl text-pink-600 border-b-4 border-pink-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-transparent dark:hover:border-b-pink-400 dark:text-white">
        <icon name="lucide:line-chart" class="mr-4 text-xl"/>
        <span>chart</span>
      </nuxt-link>
      <nuxt-link to="/list" class="px-6 py-2 bg-white rounded-xl text-pink-600 border-b-4 border-pink-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-transparent dark:hover:border-b-pink-400 dark:text-white">
        <icon name="fluent:apps-list-detail-20-regular" class="mr-4 text-2xl"/>
        <span>List</span>
      </nuxt-link>
    </div>
    <div class="relative top-5 flex justify-center ">
      <button @click="toggleDark()" class="dark:text-gray-400 dark:hover:text-gray-100 text-gray-600 hover:text-gray-900">
        <span class="rounded-full border border-transparent hover:border-gray-400 transition-all px-3 py-1">
          <span v-if="isDark"> <icon name="tabler:moon" class="text-xl relative bottom-0.5"/> </span>
          <span v-else> <icon name="tabler:sun" class="text-xl relative bottom-0.5"/> </span>
          <span class="ml-2 ">{{ isDark ? 'Dark' : 'Light' }}</span>
        </span>
      </button>
    </div>
  </div>

  <div class="absolute bottom-2 w-full justify-center flex space-x-4 z-20">
    <a href="https://github.com/ekirianc/temperature-monitor-2 " target="_blank"
       class="dark:text-gray-400 dark:hover:text-gray-100 text-gray-600 hover:text-gray-900 block">
      <Icon name ="mdi:github" class="relative bottom-0.5" /> Github
    </a>
  </div>


  <div class="absolute w-full overflow-hidden h-screen top-0 left-0 hidden sm:block">
    <img src="https://ik.imagekit.io/kariki/F01Xc3JaQAIArIC.jpeg?updatedAt=1703177272003" alt="cunny01"
          class="mix-blend-darken dark:mix-blend-soft-light h-screen absolute top-0 -right-24"/>
    <img src="https://ik.imagekit.io/kariki/F5JDop-X0AAczcH.jpeg?updatedAt=1703178037029" alt="cunny02"
          class="mix-blend-multiply dark:mix-blend-soft-light h-screen absolute top-0 -left-20">
  </div>

</template>