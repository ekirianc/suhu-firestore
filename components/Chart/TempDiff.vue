<script lang="ts" setup>
import {Bar} from 'vue-chartjs'
import type {ChartComponentRef} from 'vue-chartjs'
import {useDataStore} from "~/store";
import {subMonths} from "date-fns";
import colorLib from '@kurkle/color';
import {borderPlugin} from "~/composables/chartCustomPlugin";

const dataStore = useDataStore()

const isDark = useDark()
// const [isFullscreen, fullscreenToggle] = useToggle()

const isFullscreen = ref(false)
const handleFullscreenToggle = (isFullscr: boolean) => {
  isFullscreen.value = isFullscr
}

const datesArray: Date[] = dataStore.overall_datasets.map(data => new Date(data.date));
const lastDate = new Date(Math.max(...datesArray.map(date => date.getTime())));
const firstDate = new Date(Math.min(...datesArray.map(date => date.getTime())));

const minLabel = new Date(firstDate);
minLabel.setDate(firstDate.getDate() - 15);

const maxLabel = new Date(lastDate);
maxLabel.setDate(lastDate.getDate() + 8);

const chartData_HighLow = ref({
  labels: dataStore.overall_datasets.map(data=>data.date),
  datasets: [
    {
      label: 'temperature differencee',
      data: dataStore.overall_datasets.map(data=>data.temp_diff_sum),
      // backgroundColor: 'rgba(255,76,128,0.58)',
      borderWidth: 2,
      // borderColor: 'rgba(255,31,95,0.82)',
      borderRadius: 5,
      borderSkipped: false,
    },
  ],
})

const computedChartData = computed(() => ({
  labels: chartData_HighLow.value.labels,
  datasets: [...chartData_HighLow.value.datasets],
}));

const zoomOptions = {
  pan: {
    enabled: true,
    mode: 'x',
  },
  zoom: {
    wheel: {
      enabled: false,
    },
    pinch: {
      enabled: true
    },
    mode: 'x',
  },
  limits: {
    x: {min: 'original', max: maxLabel},
  },

}

const chartOptions_TempDiff = ref({
  // animation: false,
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false,
  },
  scales: {
    x: {
      type: 'time',
      display: true,
      grid: {},
      ticks: {
        autoSkip: true,
        maxRotation: 0,
        major: {
          enabled: true
        },
      },
      time: {
        tooltipFormat: 'DD MMM YYYY ',
        unit: 'day'
      },
      min: new Date(firstDate).setDate(firstDate.getDate() - 8)
    },
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      grid: {},
      // min: Math.round(minHighLow - 0.5),
      // max: Math.round(maxHighLow + 0.5),
      ticks: {
        color: ''
      },

    },
  } as any,
  plugins:{
    legend: {
      display: false,
    },
    tooltip: {
      animation: false,
    },
    zoom: zoomOptions,
  },
  elements: {
    bar: {
      backgroundColor: (colorize(false)),
      borderColor: colorize(true),
      borderWidth: 2
    }
  },
  onClick(e: any) {
    const chart = e.chart;
    chart.options.plugins.zoom.zoom.wheel.enabled = !chart.options.plugins.zoom.zoom.wheel.enabled;
    chart.options.plugins.zoom.zoom.pinch.enabled = !chart.options.plugins.zoom.zoom.pinch.enabled;
    chart.update();
  }
})

function transparentize(value: string, opacity: (number|undefined)) {
  let alpha = opacity === undefined ? 0.5 : 1 - opacity;
  return colorLib(value).alpha(alpha).rgbString();
}

function colorize(opaque: boolean) {
  let c
  return (ctx: any) => {
    const v = ctx.parsed.y;
    if (isDark.value){
      c = v < -20 ? '#487b9f'
          : v < 0 ? '#2557a9'
              : v < 20 ? 'rgb(208,116,43)'
                  : 'rgb(194,33,84)';
    }else {
      c = v < -20 ? '#83d0d0'
          : v < 0 ? '#5b93bd'
              : v < 20 ? 'rgb(248,173,113)'
                  : 'rgb(245,89,135)';
    }


    return opaque ? c : transparentize(c, 1 - Math.abs(v / 30));
  };
}

const initialMin = new Date(lastDate).setDate(lastDate.getDate() - 60)

const barRefreshTrigger = ref(0)
onMounted(()=>{
  chartOptions_TempDiff.value.scales.x.min = initialMin

  barRefreshTrigger.value += 1

  initialZoom()
})

onMounted(async () => {
  // if (!dataStore.last_temperature){
  //   await dataStore.fetchDataFromFirestore()
  // }
  chartColorsSet(darkModeScaleColor())

  barRefreshTrigger.value += 1
})

const darkModeScaleColor = () => (isDark.value ? '#bebebe' : '');
watch([useDark(), ], async () => {

  chartColorsSet(darkModeScaleColor())

  barRefreshTrigger.value += 1;
  initialZoom()
});

watch(isFullscreen, async (fullscreenNew ,fullscreenOld) => {
  if (fullscreenOld){
    barRefreshTrigger.value += 1
    initialZoom()
  }
  if (fullscreenNew){
    showAllButton()
  }
})


function chartColorsSet(color: string){
  chartOptions_TempDiff.value.scales.x.grid.color = () => (isDark.value ? '#4b4b4b' : '#d5d5d5')
  chartOptions_TempDiff.value.scales.y.grid.color = () => (isDark.value ? '#4b4b4b' : '#d5d5d5')
  chartOptions_TempDiff.value.scales.y.ticks.color = () => color;
  chartOptions_TempDiff.value.scales.x.ticks.color = (context: any) => {
    return context.tick.major ? '#ff3874' : color;
  };
}

const barChart = ref<ChartComponentRef | null>(null)

function resetGraph() {
  if (barChart.value?.chart) {
    // https://github.com/chartjs/chartjs-plugin-zoom/blob/master/docs/samples/wheel/time.md
    barChart.value.chart.zoomScale('x', {min: subMonths(maxLabel, 1).getTime(),max: maxLabel.getTime()}, 'default');
    barChart.value.chart.update();
  }
}

function showAllButton() {
  chartOptions_TempDiff.value.scales.x.min = new Date(firstDate).setDate(firstDate.getDate() - 8)
  barRefreshTrigger.value += 1
}

function initialZoom(){
  setTimeout(() => {
    if (barChart.value?.chart) {
      barChart.value?.chart.zoom(1.2);
      barChart.value?.chart.pan({
        x: -Number.MAX_SAFE_INTEGER
      }, undefined, 'default');
    }
    resetGraph()
  }, 10)
}
const handleToggleCollapse = () => {
  initialZoom()
}

const { width } = useWindowSize()
const SMALL_SCREEN = 480
const isSmallScreen = ref(width.value < SMALL_SCREEN)

</script>
<template>
  <chart-wrapper chart-name="Temp diff. from avg" :default-collapse="!isSmallScreen"
                 @show-all-clicked="showAllButton" @reset-clicked="resetGraph"
                 @fullscreen-clicked="handleFullscreenToggle" @toggle-collapse="handleToggleCollapse">
    <Bar ref="barChart" :data="computedChartData" :options="chartOptions_TempDiff" :plugins="[borderPlugin]" :key="barRefreshTrigger"/>
  </chart-wrapper>
</template>
<style scoped lang="css"></style>