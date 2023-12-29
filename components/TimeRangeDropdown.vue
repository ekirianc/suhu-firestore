<script setup lang="ts">
import {usePreferences} from "~/store";
import {watch} from "vue";

interface TimeRange {
  value: string;
  name: string;
}

const props = defineProps({
  chartLoaded: Boolean,
  initialTimerange: {type: String, required: true},
  timeRanges: {type: Array, required: true},
})
const userPreference = usePreferences()
const emits = defineEmits();
const isDropdownOpen = ref(false)
const selectedTimeRangeLabel = ref("")
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
}
const selectTimeRange = (timeRange: string) => {
  emits('update:selectedTimeRange', timeRange);
  isDropdownOpen.value = false;
  refreshTrigger.value += 1

  if (timeRange === '1'){
    localStorage.setItem('timerangeIsOne', 'true')
  }else {
    localStorage.removeItem('timerangeIsOne')
  }
}
const refreshTrigger = ref(0);
onMounted(()=>{
  refreshTrigger.value += 1
})

watch([()=>props.chartLoaded, refreshTrigger], ([isLoaded])=>{
  if (isLoaded){
    for (let i = 0; i < props.timeRanges.length; i++) {
      const timeRangeItem: TimeRange = props.timeRanges[i] as TimeRange;
      if (timeRangeItem?.value == userPreference.timeRange) {
        selectedTimeRangeLabel.value = timeRangeItem.name;
      }
    }
  }

})



</script>
<template>
  <div class="relative inline-flex">
    <div @click="toggleDropdown"
         class="w-full bg-white border border-gray-300 px-4 py-2 pr-8 rounded leading-tight cursor-pointer hover:border-gray-400
                dark:bg-zinc-700 dark:border-gray-500 dark:hover:border-gray-300">
      <span v-if ="!chartLoaded">loading...</span>
      {{ selectedTimeRangeLabel }}
      <div class="pointer-events-none absolute -translate-y-[1.1rem] right-0 flex items-center px-2 text-gray-700 dark:text-white">
        <Icon name="iconamoon:arrow-down-2" />
      </div>
    </div>
    <div v-show="isDropdownOpen"
         class="absolute top-full w-full bg-white border border-gray-300 mt-1 rounded shadow-md z-10 dark:bg-zinc-700 dark:border-zinc-500">
      <div v-for="timeRange in timeRanges" :key="timeRange.value" @click="selectTimeRange(timeRange.value)"
           class="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-600 ">
        {{ timeRange.name }}
      </div>
    </div>
  </div>
</template>