<script setup lang="ts">

import {useDataStore, usePreferences} from "~/store";
import {windowSize} from "~/composables/windowSize";

interface Range {
  min: number;
  max: number;
}

interface DataProps {
  label: string
  icon: string
  data: number
  color?: string
  unit?: string
  range?: Range
  average?: number
  isValid?: boolean
}

const props = defineProps<DataProps>()
const dataStore = useDataStore()
const userPreference = usePreferences()
let isPercentage = $ref(userPreference.percentageToggle)
let unit = $ref(props.unit)
const isDataPoint = props.label === 'Data Point'
let isValid = $ref(false)
const MAX_DATA_POINT = 288
let percentage = $ref(0)
let averagePercentage = $ref(0)

const data = ref(0)

watchEffect(() => {
  data.value = props.data
  isPercentage = userPreference.percentageToggle

  // unit = isPercentage ? '%' : props.unit
  unit = props.unit
  isValid = isDataPoint && props.data >= 230

  if (isDataPoint) percentage = calculatePercentage(props.data, MAX_DATA_POINT)
  if (props.range && props.average) {
    percentage = calculatePercentageInRange(props.data, props.range)
    averagePercentage = calculatePercentageInRange(props.average, props.range)
  }

})

function calculatePercentage(data: number, overallData: number): number {
  if (overallData === 0) {
    throw new Error("Overall data cannot be zero.");
  }
  if (isDataPoint){
    return Number(((data / overallData) * 100).toFixed(2));
  }

  return Number((((data / overallData) * 100) - 100).toFixed(2));
}

function calculatePercentageInRange(data: number, range: Range): number {
  const { min, max } = range;
  const _data = Number(data.toFixed(2))

  const rangeSize = max - min;
  const dataRelativeToMin = _data - min;

  return (dataRelativeToMin / rangeSize) * 100;
}

const { width, isSmallScreen, isLargeScreen, SMALL_SCREEN, XL_SCREEN } = windowSize()

</script>

<template>
  <div class="card-2 overflow-hidden relative group">
    <div class="px-3 py-4 md:p-4 flex items-center space-x-2 md:space-x-4"
         :class="{'group-hover:-translate-y-2 transition-all': !isDataPoint}">
      <div class="text-xl md:text-3xl text-neutral-600 dark:text-neutral-100 leading-none md:block"
           :class="[isDataPoint ? 'block':'hidden']">
        <Icon v-if="isDataPoint && isValid && props.data < 288" name="solar:unread-linear" :class="props.color"/>
        <Icon v-else :name="props.icon!" :class="props.color"/>
      </div>

      <div class="w-full">
        <h3 class="text-neutral-500 leading-none dark:text-neutral-400 mb-1 text-sm "> {{ props.label }} </h3>
        <div class="text-xl text-neutral-700 dark:text-neutral-200">

          <stats-data :isDataPoint :data :unit/>

        </div>
      </div>

    </div>

    <!-- percentage value -->
    <div v-if="!isDataPoint" class="absolute text-sm bottom-5 z-10 w-full">
      <div class="relative w-full border border-neutral-200 bg-neutral-100 opacity-0 group-hover:opacity-100 transition-all
                  dark:text-neutral-100 dark:bg-neutral-700 dark:border-neutral-600">
        <span class="px-2 ">{{ range.min }}</span>
        <span class="absolute" :style="{left: averagePercentage - 5 + '%'}">{{ props.average.toFixed(2) }}</span>
        <span class="absolute right-0 px-2">{{ range.max }}</span>
      </div>
    </div>

    <!-- percentage bar -->
    <div class="relative bg-pink-100 dark:bg-neutral-700 w-full z-0">

      <div class="dark:bg-sky-400/30 bg-pink-300/50" :style="{width: percentage + '%'}">
        <stats-data :isDataPoint :data="percentage" unit="%" :isPercentage="true" class="pl-4"/>
      </div>

      <!-- Average dot indicator -->
      <span v-if="dataStore.isSelectedDataValid && !isDataPoint"
            class="absolute -top-1 h-2 w-2 rounded-full bg-pink-600 dark:bg-sky-200 transition-all
                   group-hover:translate-y-1 group-hover:translate-x-0.5 group-hover:h-full group-hover:w-1 group-hover:dark:bg-white"
            :style="{left: averagePercentage + '%'}"/>
    </div>
  </div>

</template>

<style scoped>

</style>