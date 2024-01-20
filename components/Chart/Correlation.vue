<script lang="ts" setup>
import {Line} from 'vue-chartjs'
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

let correlationFixed: (number | null)[] = []
dataStore.overall_datasets.forEach((data)=> {
  const correlation = data.correlation_high_low
  correlationFixed = correlationFixed.concat(correlation)
})
const firstNonNullIndex = correlationFixed.findIndex(value => value !== null);

// Remove the first non-null element if it exists
if (firstNonNullIndex !== -1) {
  correlationFixed[firstNonNullIndex] = null;
}

const skipped = (ctx: any, value: any) => ctx.p0.skip || ctx.p1.skip ? value : undefined;

const chartData_HighLow = ref({
  labels: dataStore.overall_datasets.map(data=>data.date),
  datasets: [
    {
      label: 'temperature',
      data: correlationFixed,
      backgroundColor: 'rgba(255,76,128,0.58)',
      borderWidth: 2,
      borderColor: 'rgba(255,31,95,0.82)',
      spanGaps: true,
      segment: {
        borderDash: (ctx: any) => skipped(ctx, [6, 6]),
      },
      tension: 0.4,
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

const chartOptions_Corr = ref({
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
  onClick(e: any) {
    const chart = e.chart;
    chart.options.plugins.zoom.zoom.wheel.enabled = !chart.options.plugins.zoom.zoom.wheel.enabled;
    chart.options.plugins.zoom.zoom.pinch.enabled = !chart.options.plugins.zoom.zoom.pinch.enabled;

    // chart.options.plugins.zoom.pan.enabled = !chart.options.plugins.zoom.pan.enabled

    chart.update();
  }
})

const initialMin = new Date(lastDate).setDate(lastDate.getDate() - 60)

const barRefreshTrigger = ref(0)
onMounted(()=>{
  chartOptions_Corr.value.scales.x.min = initialMin

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
  chartOptions_Corr.value.scales.x.grid.color = () => (isDark.value ? '#4b4b4b' : '#d5d5d5')
  chartOptions_Corr.value.scales.y.grid.color = () => (isDark.value ? '#4b4b4b' : '#d5d5d5')
  chartOptions_Corr.value.scales.y.ticks.color = () => color;
  chartOptions_Corr.value.scales.x.ticks.color = (context: any) => {
    return context.tick.major ? '#ff3874' : color;
  };
}

const theChart = ref<ChartComponentRef | null>(null)

function resetGraph() {
  if (theChart.value?.chart) {
    // https://github.com/chartjs/chartjs-plugin-zoom/blob/master/docs/samples/wheel/time.md
    theChart.value.chart.zoomScale('x', {min: subMonths(maxLabel, 1).getTime(),max: maxLabel.getTime()}, 'default');
    theChart.value.chart.update();
  }
}

function showAllButton() {
  chartOptions_Corr.value.scales.x.min = new Date(firstDate).setDate(firstDate.getDate() - 8)
  barRefreshTrigger.value += 1
}

function initialZoom(){
  setTimeout(() => {
    if (theChart.value?.chart) {
      theChart.value?.chart.zoom(1.2);
      theChart.value?.chart.pan({
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
  <chart-wrapper chart-name="High-low correlation" @show-all-clicked="showAllButton"
                 @reset-clicked="resetGraph" @fullscreen-clicked="handleFullscreenToggle"
                 @toggle-collapse="handleToggleCollapse">
    <Line ref="theChart" :data="computedChartData" :options="chartOptions_Corr" :plugins="[borderPlugin]" :key="barRefreshTrigger"/>
  </chart-wrapper>


</template>
<style scoped lang="css"></style>