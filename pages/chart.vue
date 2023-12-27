<script setup lang="ts">
import {useDataStore, usePreferences} from "~/store";
import { Line } from 'vue-chartjs';
import 'chartjs-adapter-moment';
import {expandHourlyData, formattedDate, generateDateTimeRange, reduceDatetimeToHourly} from "~/composables/utils";
import {animation, annotation, chartOptions} from "~/composables/chartOptions";
import {
  assignAverageDataset,
  assignDatasets, assignSimpleTempDataset,
  assignHumidityDataset,
  assignTemperatureDataset, assignSimpleHumidDataset
} from "~/composables/assignChartDataset";


// for refresh chart when change
const chartLoaded = ref(false);
const dataStore = useDataStore()
const userPreference = usePreferences()
const { width, height } = useWindowSize()

let realDatetime: Date[] = [];
let realTemperatures: (number | null)[] = []
let realHumidity: (number | null)[] = []
let avgTemperatureSeries: (number | null)[] = []

const isSeriesOnRef = ref(userPreference.seriesToggle); // false
const isSimpleOnRef = ref();
const isFocusOnRef = ref()
const isShowLabelOnRef = ref()
const isChartAnimationOnRef = ref()
const chartRefreshTrigger = ref(0);

const SHOW_LABEL = 'labelEnabled'
const labelToggle = (isChecked: boolean) => {
  isShowLabelOnRef.value = isChecked
  isChecked ? localStorage.setItem(SHOW_LABEL, 'true') : localStorage.removeItem(SHOW_LABEL);

}

const seriesToggle = (isChecked: boolean) => {
  isSeriesOnRef.value = isChecked
  userPreference.setSeriesToggle(isChecked)
}

const SIMPLE_MODE = 'simpleEnabled'
const simpleToggle = (isChecked: boolean) => {
  isSimpleOnRef.value = isChecked

  if (!isChecked){
    isShowLabelOnRef.value = false
    disableShowLabel.value = true
    localStorage.removeItem(SIMPLE_MODE)
    localStorage.removeItem(SHOW_LABEL)
  }else {
    disableShowLabel.value = false
    localStorage.setItem(SIMPLE_MODE, 'true')
  }

}

const FOCUS_MODE = 'focusEnabled'
const focusToggle = (isChecked: boolean) => {
  if (isChecked){
    isFocusOnRef.value = true
    if (width.value <= 480){
      chartOptions.value.scales.y.display = false
      chartOptions.value.scales.y1.display = false
    }
    localStorage.setItem(FOCUS_MODE, 'true')
  }else {
    isFocusOnRef.value = false
    chartOptions.value.scales.y.display = true
    chartOptions.value.scales.y1.display = true
    localStorage.removeItem(FOCUS_MODE)
  }
}

// Animation setting
const CHART_ANIMATION = 'chartAnimation';
chartOptions.value.animation = false
const chartAnimationToggle = (isCheked: boolean) => {
  if (!isCheked){
    chartOptions.value.animation = false
    isChartAnimationOnRef.value = false
    localStorage.removeItem(CHART_ANIMATION)
  }else {
    chartOptions.value.animation = animation
    isChartAnimationOnRef.value = true
    localStorage.setItem(CHART_ANIMATION, 'true')
  }
}

onMounted(() => {
  const storedAnimationSetting = localStorage.getItem(CHART_ANIMATION);
  if (storedAnimationSetting === 'true') {
    chartOptions.value.animation = animation;
    isChartAnimationOnRef.value = true;
  } else {
    chartOptions.value.animation = false;
    isChartAnimationOnRef.value = false;
  }

  const storedFocusModeSetting = localStorage.getItem(FOCUS_MODE);
  if (storedFocusModeSetting === 'true') {
    if (width.value <= 480){
      chartOptions.value.scales.y.display = false
      chartOptions.value.scales.y1.display = false
    }

    isFocusOnRef.value = true;
  } else {
    chartOptions.value.scales.y.display = true
    chartOptions.value.scales.y1.display = true
    isFocusOnRef.value = false;
  }
});

onMounted(async () => {
  // get data from firebase
  if (!dataStore.lastTemperature) {
    await dataStore.fetchDataFromFirestore()
  }
  selectedTimeRange.value = userPreference.timeRange

  isSimpleOnRef.value = localStorage.getItem(SIMPLE_MODE) === 'true';
  isShowLabelOnRef.value = localStorage.getItem(SHOW_LABEL) === 'true';

});

const disableSeriesToggle = ref(false)
const disableOverallAvgToggle = ref(false)
const disableShowLabel = ref(false)


const chartData = ref<{ labels: Date[]; datasets: ChartDataset[];}>({
  labels: [],
  datasets: [],
});

const computedChartData = computed(() => ({
  labels: chartData.value.labels,
  datasets: [...chartData.value.datasets],
}));

const handleSelectedTimeRange = (timerange: string)=>{
  selectedTimeRange.value = timerange;
}

const selectedTimeRange = ref('')
const dataCountLabel = ref('loading...') // show data count for selected time range

const timeRanges = [
  { name: 'Today',  value: '1' },
  { name: '3 days', value: '3' },
  { name: '7 days', value: '7' }
]

// ==========================================================
// ==========================================================
// ==========================================================

watch([selectedTimeRange, isChartAnimationOnRef, isFocusOnRef, isSimpleOnRef, isShowLabelOnRef], () => {
  // If isChartAnimationOnRef changes, increment chartRefreshTrigger
  // put this to :key on chart component so it will refresh every option changes
  chartRefreshTrigger.value += 1;
});

watch([selectedTimeRange, isSeriesOnRef, isSimpleOnRef],
    async ([timeRange, isSeriesOn, isSimpleOn]) => {
  userPreference.timeRange = timeRange
  chartLoaded.value = false

  if (dataStore.dataEntries.length == 0){
    dataCountLabel.value = 'no data'
  } else {
    dataCountLabel.value = 'calculating...'
  }

  // Clear the arrays before fetching new data
  realTemperatures.length = 0
  realHumidity.length = 0
  realDatetime.length = 0
  avgTemperatureSeries.length = 0
  chartData.value.datasets = []
  chartData.value.labels = []

  if(timeRange == "1"){
    disableOverallAvgToggle.value = false
    isSeriesOnRef.value = false
    userPreference.seriesToggle = false
    disableShowLabel.value = false
    localStorage.setItem('timerangeIsOne', 'true')
  }else {
    localStorage.removeItem('timerangeIsOne')
  }

  try {
    let totalDataPointCount = 0;
    let averageDataset: ChartDataset = {}

    if (!isSeriesOn) {
      // series OFF
      if (isSimpleOn){

        averageDataset = assignAverageDataset(dataStore.adj_overall_hourly_average)
      }else {
        averageDataset = assignAverageDataset(expandHourlyData(dataStore.adj_overall_hourly_average))
      }
      chartData.value.datasets.push(averageDataset);
    }

    let isFirstIteration = true;
    dataStore.dataEntries.slice(0, Number(timeRange)).forEach((doc, index) => {
      if (!isSeriesOn){
        // Series OFF

        const temp = doc.expandedTemperature
        const humidity = doc.expandedHumidity
        const datetime = doc.expandedDatetime

        totalDataPointCount += doc.dataPointCount;
        dataCountLabel.value = totalDataPointCount.toString()

        chartData.value.labels = datetime; // X axis label

        if (isSimpleOn){
          // Series OFF and Simple ON, assign hourly data
          chartOptions.value.plugins.annotation.annotations = { annotation: annotation(1), }

          chartData.value.labels = []
          chartData.value.labels = generateDateTimeRange()


          if (timeRange == "1"){
            // karena data adjHourlyTemperature ditambah 1 di depan, jadi last entry maju 1 jam.
            // slice last entry for fix it
            const simpleTemperature: ChartDataset = assignSimpleTempDataset(formattedDate(doc.date), doc.adjHourlyTemperature.slice(0, -1), index)
            chartData.value.datasets.push(simpleTemperature);

            const simpleHumidity: ChartDataset = assignSimpleHumidDataset(doc.adjHourlyHumidity.slice(0, -1))
            chartData.value.datasets.push(simpleHumidity);
            chartOptions.value.scales.y.max = Math.max(...doc.hourlyTemperatureValue) + 1

          }else {
            const simpleTemperature: ChartDataset = assignSimpleTempDataset(formattedDate(doc.date), doc.adjHourlyTemperature, index)
            chartData.value.datasets.push(simpleTemperature);

            disableShowLabel.value = true
            isShowLabelOnRef.value = false
            localStorage.removeItem(SHOW_LABEL)
            chartOptions.value.scales.y.max = undefined

          }
        }else {
          // Simple OFF, assign real data
          chartOptions.value.plugins.annotation.annotations = { annotation }
          chartOptions.value.scales.y.max = undefined

          const temperatureDataset: ChartDataset = assignTemperatureDataset(formattedDate(doc.date), temp, index)
          chartData.value.datasets.push(temperatureDataset);
          // just assign humidity when timerange = 1
          if (timeRange == "1"){
            const humidityDataset: ChartDataset = assignHumidityDataset(humidity)
            chartData.value.datasets.push(humidityDataset);
          }
        }

        // Series OFF and range 1
        if (timeRange == "1"){
          if (!isSimpleOn){
            disableSeriesToggle.value = true
            disableShowLabel.value = true
            isShowLabelOnRef.value = false
            localStorage.removeItem(SHOW_LABEL)
          }
          disableSeriesToggle.value = true
          disableOverallAvgToggle.value = false
        }else {
          // if timeRange not "1" enable series toggle
          disableSeriesToggle.value = false
        }

      }else {
        // Series ON
        if (isSimpleOn){
          // Series ON simple ON
          realTemperatures = realTemperatures.concat(doc.hourlyTemperatureValue)
          realHumidity = realHumidity.concat(doc.hourlyHumidityValue)
          realDatetime = realDatetime.concat(reduceDatetimeToHourly(doc.datetime))
          // TODO buat hourlyTemperature berada pada jam yang sama seperti key-nya

          avgTemperatureSeries = avgTemperatureSeries.concat(dataStore.overall_hourly_average)

        }else {
          // Series ON simple OFF
          realTemperatures = realTemperatures.concat(doc.temperatures);
          realHumidity = realHumidity.concat(doc.humidity);
          realDatetime = realDatetime.concat(doc.datetime);

          avgTemperatureSeries = avgTemperatureSeries.concat(expandHourlyData(dataStore.overall_hourly_average))
        }
        totalDataPointCount += doc.dataPointCount;
        dataCountLabel.value = totalDataPointCount.toString()
      }
    })

    if (isSeriesOn){
      // Series ON
      chartOptions.value.plugins.annotation.annotations = {};
      isShowLabelOnRef.value = false
      disableShowLabel.value = true
      localStorage.removeItem(SHOW_LABEL)

      // Sort data chronologically
      const sortedData = realDatetime.map((timestamp, index) => ({
        timestamp,
        temperature: realTemperatures[index],
        humidity: realHumidity[index],
      })).sort((a, b) => (a.timestamp.getTime() - b.timestamp.getTime()));

      const sortedTemp = sortedData.map(entry => entry.temperature)
      const sortedHumid = sortedData.map(entry => entry.humidity)

      // Assign sorted data to chart
      chartData.value.labels = sortedData.map(entry => entry.timestamp);
      chartData.value.datasets = assignDatasets(
          [sortedData[0].temperature, ...sortedTemp],
          [sortedData[0].humidity, ...sortedHumid],
      )
      chartData.value.datasets.push(assignAverageDataset(avgTemperatureSeries))

      // console.log(avgTemperatureSeries.length)
      // console.log(sortedTemp.length)
      // console.log(realDatetime)
    }



  } catch (error) {
    dataCountLabel.value = `${error}`
  } finally {
    chartLoaded.value = true
  }
})

// const selectedTimeRangeLabel = ref("")

</script>

<template>
  <div class="lg:flex mb-12">
    <!-- sidebar -->
    <div class="py-4 lg:basis-1/5 transition-all overflow-hidden hidden lg:block">
      <div class="text-xl space-y-5">
        <div class="grid text-center md:text-left">
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

    <div class="lg:basis-4/5" >
      <!-- mini info / sidebar mini -->
      <div class="px-4 py-8 flex space-x-4 md:hidden justify-center text-gray-800 font-inter">
        <div class="grid">
          <span>Last Temp.</span>
          <span class="text-4xl font-medium">{{dataStore.lastTemperature}}</span>
        </div>
        <div class="grid">
          <span>Humid: {{dataStore.lastHumidity}}%</span>
          <span>Peak: {{dataStore.todayHighTempData}}°C <span class="text-gray-400">({{dataStore.todayHighTempTime}})</span></span>
          <span>Low: {{dataStore.todayLowTempData}}°C <span class="text-gray-400">({{dataStore.todayLowTempTime}})</span></span>
        </div>
      </div>

      <div class="lg:flex lg:space-x-4">
        <!-- chart data option-->
        <div v-if="!isFocusOnRef" class="md:basis-1/4 p-4 bg-white rounded-3xl overflow-y-scroll no-scrollbar md:block">
          <h2 class="ml-1 font-bold text-xl mb-2" >Option</h2>
          <toggle-switch @toggle="focusToggle"
                         label="Focus Mode"
                         :default-toggle="isFocusOnRef"/>
          <toggle-switch @toggle="seriesToggle"
                         :is-disabled="disableSeriesToggle"
                         label="Series"
                         :default-toggle="isSeriesOnRef"/>
          <toggle-switch @toggle="chartAnimationToggle"
                         label="Animation"
                         :default-toggle="isChartAnimationOnRef"/>
          <toggle-switch @toggle="simpleToggle"
                         label="Simple Mode"
                         :default-toggle="isSimpleOnRef"/>
          <toggle-switch @toggle="labelToggle"
                         label="Show data labels"
                         :is-disabled="disableShowLabel"
                         :default-toggle="isShowLabelOnRef"/>

        </div>

        <!--  chart view-->
        <div class="bg-white rounded-3xl mt-4 lg:mt-0"
             :class="{'px-2 pb-4 pt-0 md:w-full md:px-4': isFocusOnRef, 'p-4 md:basis-3/4': !isFocusOnRef}">
          <div>
            <!-- focus mode ON-->
            <div v-if="isFocusOnRef" class="flex justify-between mx-4 my-2">
              <toggle-switch @toggle="focusToggle"
                             label="Focus Mode"
                             :default-toggle="isFocusOnRef"/>
              <div>
                <time-range-dropdown :chart-loaded="chartLoaded"
                                     :time-ranges="timeRanges"
                                     :initial-timerange="selectedTimeRange"
                                     @update:selectedTimeRange="handleSelectedTimeRange"
                                      />
              </div>
            </div>

            <!-- focus mode OFF-->
            <div v-else class="flex justify-between mx-4" >
              <h2 class="font-bold text-xl">Plot</h2>
              <div class="flex">
                <span class="hidden md:block mr-2">Data Count: </span>
                <span>{{ dataCountLabel }}</span>
              </div>
              <!-- Select Dropdown  -->
              <time-range-dropdown :chart-loaded="chartLoaded"
                                   :time-ranges="timeRanges"
                                   :initial-timerange="selectedTimeRange"
                                   @update:selectedTimeRange="handleSelectedTimeRange"
              />
            </div>

            <div class="h-64 md:h-80">
              <Line v-if="chartLoaded" :data="computedChartData" :options="chartOptions" :key="chartRefreshTrigger" />
            </div>
            <div id="legend-container"></div>

          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="p-4 flex justify-center">
    <a href="https://github.com/ekirianc/temperature-monitor-2 " target="_blank"
       class="dark:text-gray-400 dark:hover:text-gray-100 text-gray-600 hover:text-gray-900 block">
      <Icon name ="mdi:github" class="relative bottom-0.5" /> Github
    </a>
  </div>
</template>