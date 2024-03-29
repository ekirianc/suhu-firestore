<script lang="ts" setup>
import {Bar} from 'vue-chartjs'
import type {ChartComponentRef} from 'vue-chartjs'
import {useDataStore} from "~/store";
import {subMonths} from "date-fns";
import colorLib from "@kurkle/color";
import {borderPlugin} from "~/composables/chartCustomPlugin";
import {windowSize} from "~/composables/windowSize";

const dataStore = useDataStore()

const isDark = useDark()
// const [isFullscreen, fullscreenToggle] = useToggle()

const isFullscreen = ref(false)
const handleFullscreenToggle = (isFullscr: boolean) => {
  isFullscreen.value = isFullscr
}

const findMinMax = (arr: number[]): { min: number; max: number } => {
  return {
    min: Math.min(...arr),
    max: Math.max(...arr),
  };
};

const { minHighLow, maxHighLow } = dataStore.overall_datasets.reduce(
    (result, dataset) => {
      const { min: minInDataset, max: maxInDataset } = findMinMax(dataset.high_low.flat());
      return {
        minHighLow: Math.min(minInDataset, result.minHighLow),
        maxHighLow: Math.max(maxInDataset, result.maxHighLow),
      };
    },
    { minHighLow: Infinity, maxHighLow: -Infinity }
);

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
      label: 'Data One',
      data: dataStore.overall_datasets.map(data=>data.high_low),
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

const chartOptions_HighLow = ref({
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
      min: Math.round(minHighLow - 0.5),
      max: Math.round(maxHighLow + 0.5),
      ticks: {
        color: ''
      }
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
  return (ctx: any) => {
    const max = ctx.parsed._custom.max;
    const min = ctx.parsed._custom.min;
    let c;

    if (max > 36) {
      c = 'rgb(239,181,104)'; // 💀💀💀
    } else if (max > 35) {
      c = 'rgb(209,139,250)'; // hot 🥵
    } else if (max < 32.9 && min > 29) {
      c = '#91b9f6'; // min max on overall average
    } else if (min < 29 && max < 33) {
      c = '#91e8c7'; // below average
    } else{
      c = 'rgb(232,111,146)'; // 33 to 35
    }

    if (isDark.value){
      if (max > 36) {
        c = 'rgb(199,137,57)'; // 💀💀💀
      } else if (max > 35) {
        c = 'rgb(121,14,182)'; // hot 🥵
      } else if (max < 32.9 && min > 29) {
        c = '#416598'; // min max on overall average
      } else if (min < 29 && max < 33) {
        c = '#4e999b'; // below average
      } else{
        c = 'rgb(218,33,89)'; // 33 to 35
      }
    }

    return opaque ? c : transparentize(c, 1 - Math.abs(max / 50));
  };
}

const initialMin = new Date(lastDate).setDate(lastDate.getDate() - 60)

const barRefreshTrigger = ref(0)
const refreshChart = () => {
  barRefreshTrigger.value += 1
}
onMounted(()=>{
  chartOptions_HighLow.value.scales.x.min = initialMin

  refreshChart()
  initialZoom()
})

onMounted(async () => {
  // if (!dataStore.last_temperature){
  //   await dataStore.fetchDataFromFirestore()
  // }
  chartColorsSet(darkModeScaleColor())

  refreshChart()
})

const darkModeScaleColor = () => (isDark.value ? '#bebebe' : '#484848');
watch([useDark(), ], async () => {

  chartColorsSet(darkModeScaleColor())

  refreshChart()
  initialZoom()
});

watch(isFullscreen, async (fullscreenNew ,fullscreenOld) => {
  if (fullscreenOld){
    refreshChart()
    initialZoom()
  }
  if (fullscreenNew){
    showAllButton()
  }
})

function chartColorsSet(color: string){
  chartOptions_HighLow.value.scales.x.grid.color = () => (isDark.value ? '#4b4b4b' : '#d5d5d5')
  chartOptions_HighLow.value.scales.y.grid.color = () => (isDark.value ? '#4b4b4b' : '#d5d5d5')
  chartOptions_HighLow.value.scales.y.ticks.color = () => color;
  chartOptions_HighLow.value.scales.x.ticks.color = (context: any) => {
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
  chartOptions_HighLow.value.scales.x.min = new Date(firstDate).setDate(firstDate.getDate() - 8)
  refreshChart()
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

const { width, isSmallScreen } = windowSize()

</script>
<template>
  <chart-wrapper chart-name="Daily high-low temp" :default-collapse="!isSmallScreen"
                 @show-all-clicked="showAllButton" @reset-clicked="resetGraph"
                 @fullscreen-clicked="handleFullscreenToggle" @toggle-collapse="handleToggleCollapse">
    <Bar ref="barChart" :data="computedChartData" :options="chartOptions_HighLow" :plugins="[borderPlugin]" :key="barRefreshTrigger"/>
  </chart-wrapper>
</template>
<style scoped lang="css"></style>