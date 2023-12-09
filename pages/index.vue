
<script lang="ts" setup>
import { Line } from 'vue-chartjs';
import { DateTime } from 'luxon';
import 'chartjs-adapter-moment';

// for refresh chart when change
const chartLoaded = ref(false);

let temperature3HoursAgo = ref<number | null>(null); // Default to null or an initial value

// data for chart
const timeArrayForLabel: Date[] = [];
const temperatureData: number[] = [];
const humidityData: number[] = [];

const chartData = ref({
  labels: timeArrayForLabel,
  datasets: [
    // Temperature dataset
    {
      label: 'Temperature',
      data: temperatureData,
      borderColor: `#da5b6a`,
      borderWidth: 2,
      radius: 0,
      yAxisID: 'y',
    },
    // Humidity dataset
    {
      label: 'Humidity',
      data: humidityData,
      borderColor: `#b4ccef`,
      borderWidth: 2,
      radius: 0,
      yAxisID: 'y1',
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
        tooltipFormat: 'DD MMM yyyy hh:mm a',
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
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      grid: {
        drawOnChartArea: false, // only want the grid lines for one axis to show up
      },
    }
  },
  responsive: true,
  maintainAspectRatio: false,
});

const selectedTimeRange = ref()
const dataCount = ref('select range first') // show data count for selected time range

// variable for temperature card
let lastUpdate: string,
    temperature: number,
    lastHumidity: number,
    lastUpdateTime: string

const timeRanges = [
  { name: '3 hours ago',  value: '3hours'    },
  { name: 'Today',        value: 'today'     },
  { name: '24 hours ago', value: '24hours'   },
  { name: 'Yesterday',    value: 'yesterday' },
  { name: '3 days',       value: '3days'     },
  { name: '7 days',       value: '7days'     }
]

onMounted(() => {
  selectedTimeRange.value = 'today'
});

watch(selectedTimeRange, async (timeRange) => {
    chartLoaded.value = false
    dataCount.value = 'calculating...'

    // Clear the arrays before fetching new data
    timeArrayForLabel.length = 0;
    temperatureData.length = 0;
    humidityData.length = 0;

    try {
      const res = await fetch(`/api/temperature/test-query?timeRange=${timeRange}`)
      // const res = await fetch(`/api/temperature/query?timeRange=${timeRange}`)
      const resData = await res.json()

      dataCount.value = resData.count

      // get data for temperature card
      if (resData.count !== 0) {
        const latestData = resData.latest;
        lastUpdate = getRelativeTime(latestData.time);
        lastUpdateTime = DateTime.fromSeconds(latestData.time).toLocaleString({ timeStyle: 'short' });
        temperature = latestData.temp;
        lastHumidity = latestData.humid;

        const indexToRetrieve = Math.max(resData.data.length - 35 - 1, 0);
        temperature3HoursAgo = resData.data[indexToRetrieve]?.temp || 0;
      } else {
        const lastData = await fetch(`/api/temperature/test-query?timeRange=last`);
        const resDataLast = await lastData.json();

        const latestData = resDataLast.latest;
        lastUpdate = getRelativeTime(latestData.time);
        lastUpdateTime = DateTime.fromSeconds(latestData.time).toLocaleString({ timeStyle: 'short' });
        temperature = latestData.temp;
        lastHumidity = latestData.humid;
        temperature3HoursAgo = ref(0);
      }


      resData.data.forEach((entry: { time: number, temp: number, humid: number }) => {
        const timeLabel = DateTime.fromSeconds(entry.time).toJSDate();
        timeArrayForLabel.push(timeLabel);
        temperatureData.push(entry.temp);
        humidityData.push(entry.humid);
      });

    } catch (error) {
      dataCount.value = 'Error! Could not reach the API. ' + error
    } finally {
      chartLoaded.value = true
    }
})



</script>

<template>
  <div class="px-4 md:px-0 mb-32">
    <div class="flex flex-col">
      <div class="md:flex flex-row md:space-x-4">
        <!--  Temperature Card-->
        <div class="md:basis-1/4 bg-white rounded-3xl overflow-hidden">
          <temp-card :temp="temperature"
                     :update="lastUpdate"
                     :time="lastUpdateTime"
                     :change="(temperature - temperature3HoursAgo).toFixed(2)"
                     :humidity="lastHumidity"
                     high="34.1"
                     highTime="2m"
                     low="29.9"
                     lowTime="6h"
          />
        </div>

        <!--  Graph view-->
        <div class="md:basis-3/4 md:m-0 mt-4 p-4 bg-white rounded-3xl">
          <div class="flex justify-between mx-4">
            <h2 class="font-bold text-xl">Graph</h2>
            <div class="flex"><span class="hidden md:block mr-2">Data Count:</span> {{ dataCount }}</div>

            <div class="relative inline-flex">
              <select v-model="selectedTimeRange" class="appearance-none bg-white border border-gray-300 px-4 py-2 pr-8 rounded leading-tight focus:outline-none focus:border-gray-500 focus:bg-white">
                <option v-for="timeRange in timeRanges" :value="timeRange.value">
                  {{timeRange.name}}
                </option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <Icon name="iconamoon:arrow-down-2" />
              </div>
            </div>
          </div>

          <div class="h-48 md:h-80">
            <Line v-if="chartLoaded" :data="chartData" :options="chartOptions"/>
          </div>
        </div>
      </div>

      <!-- Calculation Card -->
      <div class="mt-4 p-4 bg-white rounded-3xl hidden md:block">
        <calculation-card/>
      </div>
    </div>

  </div>


</template>