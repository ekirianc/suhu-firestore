<script setup lang="ts">
import {useDataStore} from "~/store";
import { Line } from 'vue-chartjs';
import 'chartjs-adapter-moment';
import { addMinutes, startOfDay } from 'date-fns';

// for refresh chart when change
const chartLoaded = ref(false);

let timeArrayForLabel: Date[] = [];
let temperatureData: number[] = [];
let humidityData: number[] = [];

const dataStore = useDataStore()

const allTemperatures: (number | null)[] = []
const allDatetime: Date[] = []
onMounted(async () => {
  selectedTimeRange.value = '1'
});

// console.log(filledTemperatures);

const chartData = ref({
  labels: allDatetime,
  datasets: [
    // Temperature dataset
    {
      label: "temperature",
      data: allTemperatures,
      borderColor: `#da5b6a`,
      borderWidth: 2,
      radius: 0,
      // spanGaps: true
    },
  ],
});

const chartOptions = ref({
  // Chart options configuration
  stacked: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: true,
    }
  },
  scales: {
    x: {
      type: 'time',
      time: {
        // Luxon format string
        tooltipFormat: 'DD MMM hh:mm a',
        displayFormats: {
          day: 'DD MMM',
          hour: 'hh:mm a',
          minute: 'HH:mm',
        }
      },
      ticks: {
        autoSkip: true,
        autoSkipPadding: 50,
        maxRotation: 0
      },
    },
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      grid: {
        color: function(context:any) {
          if (context.tick.value == 30) {
            return '#2f2f2f';
          } else if(context.tick.value == 34){
            return '#2f2f2f';
          } else {
            return `#d5d5d5`
          }
        }
      },
    },
  },
  responsive: true,
  maintainAspectRatio: false,
});

const selectedTimeRange = ref()
const dataCount = ref('select range first') // show data count for selected time range

const timeRanges = [
  { name: 'Today',        value: '1'     },
  { name: '3 days',       value: '3'     },
  { name: '7 days',       value: '7'     }
]

watch(selectedTimeRange, async (timeRange) => {

  chartLoaded.value = false
  dataCount.value = 'calculating...'

  // Clear the arrays before fetching new data
  humidityData.length = 0;
  allTemperatures.length = 0
  allDatetime.length = 0

  // console.log(allTemperatures.length)
  try {
    await dataStore.fetchDataFromFirestore(timeRange)
    dataStore.dataEntries.forEach((doc) => {
      const temp = doc.temperatures.reverse()
      const datetime = doc.datetime.reverse()
      allTemperatures.push(...temp);
      allDatetime.push(...datetime);
    })
    console.log(allTemperatures.length)
    console.log(dataStore.dataEntries)
    dataCount.value = allTemperatures.length.toString()

  } catch (error) {
      dataCount.value = `${error}`
  } finally {
    chartLoaded.value = true
  }
})
</script>

<template>

  <div class="flex">
    <!-- sidebar -->
    <div class="py-4 basis-1/5">
      <div class="text-xl space-y-5">
        <div class="grid">
          <span class="label">current temperature (°C)</span>
          <span class="text-6xl font-medium font-inter text-gray-800">
          {{ dataStore.lastTemperature }}
        </span>
        </div>
        <div class="grid">
          <span class="label">last update</span>
          <span class="mr-2 text-gray-600">{{ dataStore.relativeTime }}</span>
          <span class="text-gray-400 text-sm">({{ dataStore.lastEntryTime }})</span>
        </div>
        <div class="grid">
          <span class="label">humidity</span>
          <span>{{ dataStore.lastHumidity }}%</span>
        </div>
        <div class="grid">
          <span class="label">heat index</span>
          <span>{{ dataStore.lastHeatIndex }} °C</span>
        </div>
        <div class="grid">
          <span class="label">today high</span>
          <div>
            <span>{{ dataStore.todayHighTempData }} °C </span>
            <span class="text-gray-400 text-lg">({{dataStore.todayHighTempTime}})</span>
          </div>
        </div>
        <div class="grid">
          <span class="label">today low</span>
          <div>
            <span>{{ dataStore.todayLowTempData }} °C </span>
            <span class="text-gray-400 text-lg">({{dataStore.todayLowTempTime}})</span>
          </div>
        </div>
        <div class="grid">
          <span class="label">status</span>
          <span>{{  }}</span>
        </div>
      </div>
    </div>

    <div class="basis-4/5">
      <div class="flex space-x-4">
        <!-- chart data option-->
        <div class="w-1/4 p-4 bg-white rounded-3xl">
          <span>Time range: </span>
          <div>
            <div class="relative inline-flex w-full">
              <select v-model="selectedTimeRange" class="ins w-full appearance-none bg-white border border-gray-300 px-4 py-2 pr-8 rounded leading-tight focus:outline-none focus:border-gray-500 focus:bg-white">
                <option v-for="timeRange in timeRanges" :value="timeRange.value">
                  {{timeRange.name}}
                </option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <Icon name="iconamoon:arrow-down-2" />
              </div>
            </div>
          </div>
        </div>

        <!--  chart view-->
        <div class=" md:basis-3/4 md:m-0 mt-4 p-4 bg-white rounded-3xl">
          <div>
            <div class="flex justify-between mx-4">
              <h2 class="font-bold text-xl">Plot</h2>
              <div class="flex">
                <span class="hidden md:block mr-2">Data Count: </span>
                {{ dataCount }}
              </div>
            </div>

            <div class="h-48 md:h-80">
              <Line v-if="chartLoaded" :data="chartData" :options="chartOptions"/>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

</template>
