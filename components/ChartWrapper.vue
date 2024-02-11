<script setup lang="ts">
import {useDataStore} from "~/store";

const emits = defineEmits();
const props = defineProps({
  chartName: String,
  defaultCollapse: Boolean,
})

const dataStore = useDataStore()

const [isFullscreen, fullscreenToggle] = useToggle()
const isCollapse = ref(props.defaultCollapse)
// const collapseChart = useToggle(isCollapse)

watch(isFullscreen, (isFullscr)=>{
  dataStore.isFullscreen = isFullscr
})

const collapseChart = () => {
  if (isFullscreen.value){ return }
  isCollapse.value = !isCollapse.value
  emits('toggle-collapse')
}

const triggerShowAllButton = () => emits("show-all-clicked")

const triggerResetButton = () => emits("reset-clicked")
const triggerFullscreen = () => {
  fullscreenToggle()
  emits("fullscreen-clicked", isFullscreen.value)
}

onKeyStroke('Escape', () => {
  if (isFullscreen.value){
    triggerFullscreen()
  }
})

</script>

<template>
  <div class="card group p-0"
       :class="{'fixed top-0 left-0 w-full h-screen border-2 border-pink-400 z-50': isFullscreen,
                'card-effect': !isFullscreen,
                'h-14 p-0': !isCollapse}">
    <div class="-top-1 flex items-center justify-between p-4 relative dark:text-gray-300 cursor-pointer" :class="{'h-full px-4 top-0': !isCollapse}">
      <div @click="collapseChart()"  class="flex items-center group/collapse" :class="{'w-full': !isCollapse}">
        <div class="mr-4 text-sm relative rounded-lg group-hover/collapse:bg-gray-200 dark:group-hover/collapse:bg-gray-700/40">
          <Icon name="iconamoon:arrow-down-2" class="text-lg transition-all p-2 box-content " :class="{'rotate-180': isCollapse}"/>
        </div>
        <span class="font-medium lg:text-lg text-sm dark:text-gray-200 text-gray-700">{{ props.chartName }}</span>
      </div>
      <div v-if="isCollapse" class="flex space-x-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
        <button @click="triggerShowAllButton" class="rounded-lg px-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-700/40">Show All</button>
        <button @click="triggerResetButton" class="rounded-lg px-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-700/40">
          <Icon name="pepicons-pop:arrow-spin" class="text-lg"/>
        </button>
        <button @click="triggerFullscreen" class="rounded-lg px-2 py-1 h-full hover:bg-gray-200 dark:hover:bg-gray-700/40">
          <Icon name="humbleicons:expand" class="text-lg"/>
        </button>
      </div>
    </div>
    <div v-if="isCollapse" class="px-4 pb-4 relative -top-2" :class="[isFullscreen?'h-[calc(100vh-120px)]':'md:aspect-[7/2.5]']">
      <slot/>
    </div>
  </div>
</template>

<style scoped>

</style>