<script lang="ts" setup>
import {Bar} from 'vue-chartjs'
import type {ChartComponentRef} from 'vue-chartjs'
import {useDataStore} from "~/store";
import {subMonths} from "date-fns";
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
      label: 'temperature',
      data: dataStore.overall_datasets.map(data=>data.temp_deviation),
      backgroundColor: 'rgba(255,76,128,0.58)',
      borderWidth: 2,
      borderColor: 'rgba(255,31,95,0.82)',
      borderRadius: 5,
      borderSkipped: false,
      yAxisID: 'y'
    },
    {
      label: 'humidity',
      data: dataStore.overall_datasets.map(data=>data.humid_deviation),
      backgroundColor: 'rgba(76,213,255,0.58)',
      borderWidth: 2,
      borderColor: 'rgba(31,136,255,0.82)',
      borderRadius: 5,
      borderSkipped: false,
      yAxisID: 'y1'
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

const chartOptions_Dev = ref({
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
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      grid: {
        drawOnChartArea: false, // only want the grid lines for one axis to show up
      },
      ticks: {
        color: ''
      },
    },
  } as any,
  plugins:{
    legend: {
      display: true,
    },
    tooltip: {
      animation: false,
    },
    zoom: zoomOptions,
  },
  onClick(e: any) {
    const chart = e.chart;
    chart.options.plugins.zoom.zoom.wheel.enabled = !chart.options.plugins.zoom.zoom.wheel.enabled;
    chart.options.plugins.zoom.zoom.pinch.enabled = !chart.options.plugins.zoom.zoom.pinch.enabled;
    chart.update();
  }
})

const initialMin = new Date(lastDate).setDate(lastDate.getDate() - 60)

const barRefreshTrigger = ref(0)
onMounted(()=>{
  chartOptions_Dev.value.scales.x.min = initialMin

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
  chartOptions_Dev.value.scales.x.grid.color = () => (isDark.value ? '#4b4b4b' : '#d5d5d5')
  chartOptions_Dev.value.scales.y.grid.color = () => (isDark.value ? '#4b4b4b' : '#d5d5d5')
  chartOptions_Dev.value.scales.y.ticks.color = () => color;
  chartOptions_Dev.value.scales.y1.ticks.color = color;
  chartOptions_Dev.value.scales.x.ticks.color = (context: any) => {
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
  chartOptions_Dev.value.scales.x.min = new Date(firstDate).setDate(firstDate.getDate() - 8)
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
</script>
<template>
  <chart-wrapper chart-name="Temp & humid deviation" @show-all-clicked="showAllButton"
                 @reset-clicked="resetGraph" @fullscreen-clicked="handleFullscreenToggle"
                 @toggle-collapse="handleToggleCollapse">
    <Bar ref="barChart" :data="computedChartData" :options="chartOptions_Dev" :plugins="[borderPlugin]" :key="barRefreshTrigger"/>
  </chart-wrapper>
</template>
<style scoped lang="css"></style>