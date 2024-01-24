<script setup lang="ts">
import * as chroma from "chroma.ts";
import {luminance} from "~/composables/luminance";
import type { Datasets } from "~/composables/types";

type ScaleType = string;

interface TemperatureProps {
  data: {
    dataset?: Datasets;
    today_total_data: number | null,
  };
  type: string;
  max?: number;
  min?: number
}

const props = defineProps<TemperatureProps>();

// const getTemperatureColor = (type: ScaleType, value: number | undefined): string => {
const getTemperatureColor = (type: ScaleType, value: string | undefined): string => {
  // const scales: Record<ScaleType, chroma.Scale> = {
  //   temp_high: chroma.scale(['#e7d1e4', '#f53da4', '#520112']).domain(25, 40),
  //   temp_low: chroma.scale(['#aeeee9', '#4fe2ff', '#000000']).domain(26, 32),
  //   average_temp: chroma.scale(['#656464', '#725f67', '#151010']).domain(28, 33),
  //   average_humid: chroma.scale(['#234241', '#588891', '#37717e']).domain(74, 91),
  //   temp_diff_sum: chroma.scale(['#396572', '#725f67', '#b02c2c']).domain(-30, 30),
  // };
  //
  // const scale = scales[type] || chroma.scale(['#333333']);
  //
  // return value !== undefined ? scale(value).hex() : '#333333';

  const scales: Record<ScaleType, string> = {
    temp_high: '#f53da4',
    temp_low: '#4ab8ce',
    average_temp: '#3cb997',
    average_humid: '#9c56c4',
    temp_diff_sum: '#57c7c3',
  };

  return scales[type]
};

const getBackgroundColor = (
    { is_valid, today_total_data, temp_high, temp_low, average_temp, average_humid, temp_diff_sum }: Datasets,
    type: ScaleType
) => {

  if (!is_valid) {
    return '#333333';
  }

  switch (type) {
    case 'temp_high':
    case 'temp_low':
    case 'average_temp':
    case 'average_humid':
    case 'temp_diff_sum':
      return getTemperatureColor(type, (eval(type) as string | undefined));
    case 'today_total_data':
      return today_total_data === 288 ? '#989a9d' : '#333333';
    default:
      return '#333333';
  }
};

const data = ref()

const dataset = props.data.dataset

if (dataset && (dataset as any)[props.type]) {
  data.value = (dataset as any)[props.type];
}

const backgroundColorStyle = () => props.data?.dataset ? getBackgroundColor(props.data.dataset, props.type) : '#333333'

const borderStyle = () => props.data.dataset && props.max === data.value ? '2px solid white' : 'none'

const getContrastColor = (backgroundColor: string): string => {
  const luminanceVal = luminance(backgroundColor);
  // Choose a threshold value to determine when to switch to light or dark text
  const threshold = 0.4;
  return luminanceVal > threshold ? '#000000' : '#ffffff';
};

const dataHighlightStyle = () => {
  return {
    // color: getContrastColor(backgroundColor),
    border: borderStyle(),
    // backgroundColor: backgroundColorStyle(),
  };
};


</script>

<template>
  <div class="w-12 h-12 flex items-center content-center dark:text-neutral-100 relative"
       :style="{ ...dataHighlightStyle() }">
    <div v-if="props.data?.dataset" class="text-sm w-full relative z-10">{{ data }}</div>
<!--    <div v-if="props.data.dataset?.is_valid" class="absolute h-full w-1 left-0 bottom-0 bg-red-500 z-0" :style="{backgroundColor: backgroundColorStyle()}"></div>-->
    <div v-if="props.data.dataset?.is_valid" class="absolute w-full h-1 left-0 bottom-0 bg-red-500 z-0" :style="{backgroundColor: backgroundColorStyle()}"></div>
    <!-- TODO set width based on data. use min max from props -->
  </div>
</template>

<style scoped>

</style>