<script setup lang="ts">
import { usePreferences } from "~/store";
import { watch } from "vue";

interface TimeRange {
  value: string;
  name: string;
}

const props = defineProps({
  chartLoaded: Boolean,
  initialTimerange: { type: String, required: true },
  timeRanges: { type: Array, required: true },
});
const userPreference = usePreferences();
const emits = defineEmits();
const selectedTimeRange = ref("");
const refreshTrigger = ref(0);

onMounted(() => {
  refreshTrigger.value += 1;
});

watch([() => props.chartLoaded, refreshTrigger], ([isLoaded]) => {
  if (isLoaded) {
    for (let i = 0; i < props.timeRanges.length; i++) {
      const timeRangeItem: TimeRange = props.timeRanges[i] as TimeRange;
      if (timeRangeItem?.value == userPreference.timeRange) {
        selectedTimeRange.value = timeRangeItem.value;
      }
    }
  }
});

const selectTimeRange = (timeRange: string) => {
  emits("update:selectedTimeRange", timeRange);
  refreshTrigger.value += 1;

  if (timeRange === "1") {
    localStorage.setItem("timerangeIsOne", "true");
  } else {
    localStorage.removeItem("timerangeIsOne");
  }
};
</script>

<template>
  <div class="flex space-x-2">
    <div
        v-for="timeRange in timeRanges"
        :key="timeRange.value"
        @click="selectTimeRange(timeRange.value)"
        :class="[
        'px-2 sm:px-4 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-zinc-600 rounded-lg',
        { 'bg-gray-200 rounded-lg dark:bg-zinc-600 dark:text-white': timeRange.value === selectedTimeRange },
      ]"
    >
      {{ timeRange.name }}
    </div>
  </div>
</template>