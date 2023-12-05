
<script lang="ts" setup>
import { Line } from 'vue-chartjs';
import {onMounted, ref} from "vue";
import {DateTime} from 'luxon';
import 'chartjs-adapter-moment';
import {getRelativeTime} from "~/composables/getRelativeTime";
import {toNumber} from "@vue/shared";

interface ChartData {
  x: number;
  y: number;
}

interface Data {
  [key: string]: {
    time: number;
    temp: number;
    humid: number;
  };
}

const timeArray: Date[] = [];
const tempData: ChartData[] = [];
const humidData: ChartData[] = [];

const data = ref<Data>({});
const loaded = ref(false);

let convertedEpoch: Date | string ;

const convertEpochTo = (epochTime: number, format: string): Date | string => {
  switch (format) {
    case 'JSDate':
      convertedEpoch = DateTime.fromSeconds(epochTime).toJSDate();
      break;
    case 'ShortTime':
      convertedEpoch = DateTime.fromSeconds(epochTime).toLocaleString({ timeStyle: 'short' });
      break;
  }
  return convertedEpoch;
};

// const labels = months({ count: 7 });
// console.log(labels)

const chartData = ref({
  labels: timeArray,
  datasets: [
    {
      label: 'Temperature',
      borderColor: `#da5b6a`,
      borderWidth: 2,
      radius: 0,
      // tension: 0.2,
      // stepped: true,
      data: tempData,
      yAxisID: 'y',
    },
    {
      label: 'Humidity',
      borderColor: `#b4ccef`,
      borderWidth: 2,
      radius: 0,
      // tension: 0.2,
      // stepped: true,
      data: humidData,
      yAxisID: 'y1',
    },
  ],
});

const chartOptions = ref({
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
        tooltipFormat: 'DD MMMM yyyy hh:mm a'
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
const timeRanges = [{
  name: '3 hours ago',
  value: '3hours'
}, {
  name: 'Today',
  value: 'today',
}, {
  name: '24 hours ago',
  value: '24hours'
},{
  name: 'Yesterday',
  value: 'yesterday'
}, {
  name: '3 days',
  value: '3days'
}]

const lastTemperatureDifference = ref<string | null>(null); // Default to null or an initial value

const getTemperatureDifferences = (): { time: Date; difference: number }[] => {
  const differences: { time: Date; difference: number }[] = [];

  if (tempData.length > 0) {
    const lastTemp = tempData[tempData.length - 1];

    // Filter data points from the last 3 hours
    const last3HoursData = tempData.filter((_, index) => {
      const timeDifference = timeArray[tempData.length - 1].getTime() - timeArray[index].getTime();
      const hoursDifference = timeDifference / (1000 * 60 * 60);
      return hoursDifference <= 3;
    });

    // Calculate differences
    differences.push({ time: timeArray[tempData.length - 1], difference: 0 });

    for (let i = 1; i < last3HoursData.length; i++) {
      differences.push({
        time: timeArray[tempData.length - i - 1],
        difference: Number(lastTemp) - Number(last3HoursData[i]),
      });
    }
  }

  return differences;
};


const count = ref('select range first')
const loading = ref(false)

let lastUpdate:string,
    temp:string,
    lastUpdateTime:string,
    lastHumidity:string = ""


onMounted(() => {
  selectedTimeRange.value = 'today'
});

// watch works directly on a ref
watch(selectedTimeRange, async (timeRange) => {
    loaded.value = false
    count.value = 'calculating...'

    // Clear the arrays before fetching new data
    timeArray.length = 0;
    tempData.length = 0;
    humidData.length = 0;

    try {
      const res = await fetch(`/api/temperature/query?timeRange=${timeRange}`)
      const resData = await res.json()
      const apiData = resData.data
      count.value = resData.count

      if (resData.count !== 0){
        lastUpdate = getRelativeTime(resData.latest.time);
        lastUpdateTime = convertEpochTo(resData.latest.time, 'ShortTime')
        temp = resData.latest.temp;
        lastHumidity = resData.latest.humid
      }

      for (const entry of apiData) {
        // Assuming entry.time is already a number in the response
        const timeLabel = convertEpochTo(entry.time, 'JSDate');
        const timeDate = typeof timeLabel === 'string' ? new Date(timeLabel): timeLabel;

        timeArray.push( timeDate );
        tempData.push(entry.temp);
        humidData.push(entry.humid);
      }

      // Calculate temperature differences
      const temperatureDifferences = getTemperatureDifferences();

      if (temperatureDifferences.length > 0) {
        const lastTemperatureDifferenceValue = temperatureDifferences[temperatureDifferences.length - 2].difference;

        // Format temperature with two decimal places
        const formattedTemperatureDifference = Number(lastTemperatureDifferenceValue).toFixed(2);

        // Update the ref with the formatted value
        lastTemperatureDifference.value = formattedTemperatureDifference;
      } else {
        // Set the ref to null or an initial value if there are no differences
        lastTemperatureDifference.value = null;
      }

    } catch (error) {
      count.value = 'Error! Could not reach the API. ' + error
    } finally {
      loading.value = false
      loaded.value = true
    }
})



</script>

<template>
  <div class="px-4 md:px-0 mb-32">

    <!--    content Wraper -->
    <div class="flex flex-col">
      <div class="md:flex flex-row md:space-x-4">
        <!--  Temperature Card-->
        <div class="md:basis-1/4 bg-white rounded-3xl overflow-hidden">
          <temp-card :temp="temp"
                     :update="lastUpdate"
                     :time="lastUpdateTime"
                     :change="lastTemperatureDifference "
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
            <div class="flex"><span class="hidden md:block mr-2">Data Count:</span> {{ count }}</div>
            <select v-model="selectedTimeRange">
              <option v-for="timeRange in timeRanges" :value="timeRange.value">
                {{timeRange.name}}
              </option>
            </select>

          </div>
          <div class="h-48 md:h-80">
            <Line v-if="loaded" :data="chartData" :options="chartOptions"/>
          </div>
        </div>



      </div>

      <div class="mt-4 p-4 bg-white rounded-3xl hidden md:block">
        <calculation-card/>
      </div>
    </div>

  </div>


</template>