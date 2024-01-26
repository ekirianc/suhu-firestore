<script setup lang="ts">
import * as chroma from "chroma.ts";
import {luminance} from "~/composables/luminance";
import type { Datasets } from "~/composables/types";
import {useDataStore} from "~/store";

type ScaleType = string;

interface TemperatureProps {
  data: {
    dataset?: Datasets;
  };
  type: string;
  max?: number;
  min?: number;
  // using useDark() here cause performance issue. passing state from parrent instead
  isDark?: boolean;
}

const props = defineProps<TemperatureProps>();
const dataStore = useDataStore()

const getTemperatureColor = (type: ScaleType, value: number | undefined): string => {
  const overall = dataStore.overall_min_max;

  const scales: Record<ScaleType, chroma.Scale> = {
    temp_high: chroma.scale(['#f1dee3', '#912d49', '#3f0316']).domain(overall.highTemp.min, overall.highTemp.max),
    temp_low: chroma.scale(['#c6cdd0', '#518d87', '#18353f']).domain(overall.lowTemp.min, overall.lowTemp.max),
    average_temp: chroma.scale(['#f1dee3', '#912d49', '#3f0316']).domain(overall.tempAvg.min, overall.tempAvg.max),
    average_humid: chroma.scale(['#18353f', '#518d87', '#c6cdd0']).domain(overall.humidAvg.min, overall.humidAvg.max),
    temp_diff_sum: chroma.scale(['#f1dee3', '#912d49', '#3f0316']).domain(overall.tempDiffSum.min, overall.tempDiffSum.max),
  };

  const scale = scales[type];

  return value !== undefined ? scale(value).hex() : '';
};

const getBackgroundColor = (
    { is_valid, today_total_data, temp_high, temp_low, average_temp, average_humid, temp_diff_sum }: Datasets,
    type: ScaleType
) => {

  if (!is_valid) return ''
  // if (isDark)

  switch (type) {
    case 'temp_high':
    case 'temp_low':
    case 'average_temp':
    case 'average_humid':
    case 'temp_diff_sum':
      return getTemperatureColor(type, (eval(type)));
    case 'today_total_data':
      // return today_total_data === 288 ? '#4d4949' : '#333333';
      return today_total_data === 288 ? (props.isDark ? '#494949' : '#e5e5e5') : '';
    default:
      return ''
  }
};

const calData = ref()
const dataset = props.data.dataset

if (dataset && (dataset as any)[props.type]) {
  calData.value = (dataset as any)[props.type];
}

const isType = {
  temp_low: props.type === 'temp_low',
  today_total_data: props.type === 'today_total_data',
}

const backgroundColorStyle = () => props.data?.dataset ? getBackgroundColor(props.data.dataset, props.type) : ''

const borderStyle = () => {
  const { data, max, min } = props

  if (!isType.temp_low){
    return data.dataset && max === calData.value ? '2px solid white' : 'none'
  } else {
    return data.dataset && min === calData.value ? '2px solid white' : 'none'
  }
}

const getContrastColor = (backgroundColor: string): string => {
  const luminanceVal = luminance(backgroundColor);
  // Choose a threshold value to determine when to switch to light or dark text
  const threshold = 0.4;
  return luminanceVal > threshold ? '#000000' : '#ffffff';
};

const dataStyle = () => {
  let color = ''

  if (props.isDark){
    if (isType.today_total_data) color = calData.value < 230 ?  '#838383' : '#ffffff'
  } else {
    if (isType.today_total_data) color = calData.value < 230 ?  '#a9a9a9' : ''
  }

  if (!isType.today_total_data) color = getContrastColor(backgroundColorStyle())

  return {
    color,
    border: borderStyle(),
    backgroundColor: backgroundColorStyle(),
  };
};


</script>

<template>
  <div class="w-12 h-12 flex items-center content-center relative"
       :style="{ ...dataStyle() }">
    <div v-if="props.data?.dataset" class="text-sm w-full relative z-10">{{ calData }}</div>
  </div>
</template>

<style scoped>

</style>