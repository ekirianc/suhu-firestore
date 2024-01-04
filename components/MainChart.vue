<script setup lang="ts">
import {useDataStore, usePreferences} from "~/store";
import { Line } from 'vue-chartjs';
import 'chartjs-adapter-moment';
import {
  addMissingTimes,
  expandHourlyData,
  formattedDate, generateDateTimeWithHourlyInterval,
  generateHourlyIntervalDT,
} from "~/composables/utils";
import {animation, annotation, mainChartOptions} from "~/composables/mainChartOptions";
import {
  assignAverageDataset,
  assignDatasets, assignSimpleTempDataset,
  assignHumidityDataset,
  assignTemperatureDataset, assignSimpleHumidDataset
} from "~/composables/assignChartDataset";
import {formatDistanceToNow} from "date-fns";
import {useToggle} from "#imports";

useHead({
  title: 'Chart view',
});

const errorMessage = ref('')
const isError = ref(false)

// for refresh chart when change
const chartLoaded = ref(false);
const dataStore = useDataStore()
const userPreference = usePreferences()
const { width } = useWindowSize()
const SMALL_SCREEN = 480
const HUMIDITY_DARK_BORDER_COLOR = "#444444"

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
const isSmallScreen = width.value < SMALL_SCREEN

const disableSeriesToggle = ref(false)
const disableShowLabel = ref(false)

const [isFullscreenC01, fullscreenToggleC01] = useToggle()

function updateRelativeDatetime(){
  dataStore.relativeTime = formatDistanceToNow(dataStore.lastDatetime, { addSuffix: true, includeSeconds: true })
}

const intervalId = setInterval(updateRelativeDatetime, 60000)

onBeforeUnmount(()=>{
  // Clear the interval to avoid memory leaks
  clearInterval(intervalId)
})

const SHOW_LABEL = 'labelEnabled';
const SIMPLE_MODE = 'simpleEnabled';
const FOCUS_MODE = 'focusEnabled';
const CHART_ANIMATION = 'chartAnimation';

const labelToggle = (isChecked: boolean) => {
  isShowLabelOnRef.value = isChecked;
  isChecked ? localStorage.setItem(SHOW_LABEL, 'true') : localStorage.removeItem(SHOW_LABEL);
};

const seriesToggle = (isChecked: boolean) => {
  isSeriesOnRef.value = isChecked;
  userPreference.setSeriesToggle(isChecked);
};

const simpleToggle = (isChecked: boolean) => {
  isSimpleOnRef.value = isChecked;

  if (!isChecked) {
    isShowLabelOnRef.value = false;
    disableShowLabel.value = true;
    localStorage.removeItem(SIMPLE_MODE);
    localStorage.removeItem(SHOW_LABEL);
  } else {
    disableShowLabel.value = false;
    localStorage.setItem(SIMPLE_MODE, 'true');
  }
};

const focusToggle = () => {
  isFocusOnRef.value = !isFocusOnRef.value;

  if (isFocusOnRef.value) {
    if (isSmallScreen) {
      mainChartOptions.value.scales.y1.display = false;
    }
    localStorage.setItem(FOCUS_MODE, 'true');
  } else {
    isFocusOnRef.value = false;
    mainChartOptions.value.scales.y.display = true;
    mainChartOptions.value.scales.y1.display = true;
    localStorage.removeItem(FOCUS_MODE);
  }
};

const chartAnimationToggle = (isChecked: boolean) => {
  mainChartOptions.value.animation = isChecked ? animation : false;
  isChartAnimationOnRef.value = isChecked;
  isChecked ? localStorage.setItem(CHART_ANIMATION, 'true') : localStorage.removeItem(CHART_ANIMATION);
};

onMounted(() => {
  // Animation setting
  const storedAnimationSetting = localStorage.getItem(CHART_ANIMATION);
  mainChartOptions.value.animation = storedAnimationSetting === 'true' ? animation : false;
  isChartAnimationOnRef.value = storedAnimationSetting === 'true';

  // Focus mode setting
  const storedFocusModeSetting = localStorage.getItem(FOCUS_MODE);
  if (storedFocusModeSetting === 'true') {
    if (isSmallScreen) {
      mainChartOptions.value.scales.y1.display = false;
    }
    isFocusOnRef.value = true;
  } else {
    mainChartOptions.value.scales.y.display = true;
    mainChartOptions.value.scales.y1.display = true;
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
  { name: 'Today', initial: 'T',  value: '1' },
  { name: '3 days', initial: '3d', value: '3' },
  { name: '1 week', initial: '1w', value: '7' }
]
// ==========================================================
// ==========================================================
// ==========================================================

watch([isChartAnimationOnRef, isFocusOnRef, isSimpleOnRef, isShowLabelOnRef, useDark(), isFullscreenC01], () => {
  // If isChartAnimationOnRef changes, increment chartRefreshTrigger
  // put this to :key on chart component, so it will refresh on every option changes
  chartRefreshTrigger.value += 1;
});

// TODO update chart if there some data update
// watch tidak akan bekerja jika ()=>dataStore.dataChanges mereturn data berulang banyak kali
watch([selectedTimeRange, isSeriesOnRef, isSimpleOnRef, useDark(),], async ([timeRange, isSeriesOn, isSimpleOn, isDark]) => {
  userPreference.timeRange = timeRange
  chartLoaded.value = false
  dataCountLabel.value = dataStore.dataEntries.length === 0 ? 'no data' : 'calculating...';

  // Clear the arrays before fetching new data
  realTemperatures.length = 0
  realHumidity.length = 0
  realDatetime.length = 0
  avgTemperatureSeries.length = 0
  chartData.value.datasets = []
  chartData.value.labels = []

  try {
    let totalDataPointCount = 0;
    let averageDataset: ChartDataset = {}

    if (!isSeriesOn) {
      // averageDataset on Series OFF
      const sourceData = isSimpleOn ? dataStore.adj_overall_hourly_average : expandHourlyData(dataStore.adj_overall_hourly_average);
      averageDataset = assignAverageDataset(sourceData);
      chartData.value.datasets.push(averageDataset);
    }

    dataStore.dataEntries.slice(0, Number(timeRange)).forEach((doc, index) => {
      const hourlyTemp = doc.hourlyTemperature.filled
      const hourlyTempAdj = doc.hourlyTemperature.adjusted
      const hourlyTempObj = doc.hourlyTemperature.object

      const hourlyHumid = doc.hourlyHumidity.filled
      const hourlyHumidAdj = doc.hourlyHumidity.adjusted

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
          mainChartOptions.value.plugins.annotation.annotations = {
            annotation: annotation(1, isDark ? '#a9a9a9' : undefined)
          };

          chartData.value.labels = []
          chartData.value.labels = generateHourlyIntervalDT()

          const simpleTemperature = assignSimpleTempDataset(formattedDate(doc.date), hourlyTempAdj, index);
          chartData.value.datasets.push(simpleTemperature);

          if (timeRange === "1"){
            // Series OFF and Simple ON
            const simpleHumidity: ChartDataset = assignSimpleHumidDataset(hourlyHumidAdj)
            chartData.value.datasets.push(simpleHumidity);

            const maxValue = Math.max(...hourlyTemp.filter(value => value !== null) as number[]);
            mainChartOptions.value.scales.y.max = maxValue + 1
            chartData.value.datasets[1].fill = true

            disableShowLabel.value = false
            isShowLabelOnRef.value = true
            localStorage.setItem(SHOW_LABEL, "true")
          }else {
            disableShowLabel.value = true
            isShowLabelOnRef.value = false
            localStorage.removeItem(SHOW_LABEL)
            mainChartOptions.value.scales.y.max = undefined
          }
        }else {
          // Simple OFF, assign real data
          mainChartOptions.value.plugins.annotation.annotations = {
            annotation: isDark ? annotation(0, '#a9a9a9') : annotation()
          };

          mainChartOptions.value.scales.y.max = undefined

          const temperatureDataset: ChartDataset = assignTemperatureDataset(formattedDate(doc.date), temp, index)
          chartData.value.datasets.push(temperatureDataset);
          // just assign humidity when timerange = 1
          if (timeRange === "1"){
            const humidityDataset: ChartDataset = assignHumidityDataset(humidity)
            chartData.value.datasets.push(humidityDataset);
            chartData.value.datasets[1].fill = true
          }
        }

        // Series OFF and range 1
        if (timeRange === "1"){
          if (!isSimpleOn){
            disableSeriesToggle.value = true
            disableShowLabel.value = true
            isShowLabelOnRef.value = false
            localStorage.removeItem(SHOW_LABEL)
          }
          disableSeriesToggle.value = true
        }else {
          disableSeriesToggle.value = false
        }

      }else {
        // Series ON
        // Simple On / Simple OFF

        const generatedDateTime = generateDateTimeWithHourlyInterval(doc.datetime, hourlyTempObj);

        realTemperatures = realTemperatures.concat(isSimpleOn ? hourlyTemp : doc.temperatures);
        realHumidity = realHumidity.concat(isSimpleOn ? hourlyHumid : doc.humidity);
        realDatetime = realDatetime.concat(isSimpleOn ? generatedDateTime : doc.datetime);

        avgTemperatureSeries = avgTemperatureSeries.concat(
            isSimpleOn ? dataStore.overall_hourly_average : expandHourlyData(dataStore.overall_hourly_average)
        );

        totalDataPointCount += doc.dataPointCount;
        dataCountLabel.value = totalDataPointCount.toString()
      }
    })

    if (isSeriesOn){
      // Series ON
      mainChartOptions.value.plugins.annotation.annotations = {};
      isShowLabelOnRef.value = false
      disableShowLabel.value = true
      localStorage.removeItem(SHOW_LABEL)

      if (!isSimpleOn){
        // Series ON Simple OFF
        const filledData = addMissingTimes(realDatetime, realTemperatures, realHumidity);
        const sortedFilledData = filledData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        const sortedTemp = filledData.map(entry => entry.temperature);
        const sortedHumid = filledData.map(entry => entry.humidity);

        chartData.value.labels = sortedFilledData.map(entry => entry.timestamp);
        chartData.value.datasets = assignDatasets(
            [filledData[0].temperature, ...sortedTemp],
            [filledData[0].humidity, ...sortedHumid],
        )
        chartData.value.datasets.push(assignAverageDataset(avgTemperatureSeries))
      }else {
        // Series ON Simple ON
        const sortedData = realDatetime.map((timestamp, index) => ({
          timestamp,
          temperature: realTemperatures[index],
          humidity: realHumidity[index],
        })).sort((a, b) => (a.timestamp.getTime() - b.timestamp.getTime()));

        const sortedTemp = sortedData.map(entry => entry.temperature)
        const sortedHumid = sortedData.map(entry => entry.humidity)

        // add new 1 hour at the end
        const lastTimestamp = sortedData[sortedData.length - 1].timestamp;
        const newTimestamp = new Date(lastTimestamp.getTime() + 60 * 60 * 1000); // Add 1 hour (in milliseconds)
        const newEntry = {
          timestamp: newTimestamp,
          temperature: null,
          humidity: null,
        };
        const updatedSortedData = [...sortedData, newEntry].sort((a, b) => (a.timestamp.getTime() - b.timestamp.getTime()));

        chartData.value.labels = updatedSortedData.map(entry => entry.timestamp);
        chartData.value.datasets = assignDatasets(
            [sortedData[0].temperature, ...sortedTemp],
            [sortedData[0].humidity, ...sortedHumid],
        )
        chartData.value.datasets.push(assignAverageDataset(avgTemperatureSeries))
      }

      if (isDark){
        chartData.value.datasets[1].borderColor = HUMIDITY_DARK_BORDER_COLOR
        chartData.value.datasets[2].borderColor = "#2d5a9f" // avg border color
      }
    }

  } catch (error) {
    isError.value = true
    errorMessage.value = `${error}`
  } finally {
    chartLoaded.value = true
  }

  if(timeRange === "1"){
    isSeriesOnRef.value = false
    userPreference.seriesToggle = false
    localStorage.setItem('timerangeIsOne', 'true')
    if (isDark){
      chartData.value.datasets[2].borderColor = HUMIDITY_DARK_BORDER_COLOR
    }
  }else {
    localStorage.removeItem('timerangeIsOne')
  }

  mainChartOptions.value.scales.y.grid.color = (ctx: any) => {
    const threshold = ctx.tick.value === 30 || ctx.tick.value === 34;
    return isDark ? (threshold ? '#aba6a6' : '#4b4b4b') : (threshold ? '#2f2f2f' : '#d5d5d5');
  };
  mainChartOptions.value.scales.x.grid.color = () => (isDark ? '#4b4b4b' : '#d5d5d5')
  // chartOptions.value.scales.x.grid.display = () => !(width.value < 480 && isFocusOnRef.value)

  const darkModeScaleColor = () => (isDark ? '#bebebe' : '');
  mainChartOptions.value.scales.y.ticks.color = darkModeScaleColor;
  mainChartOptions.value.scales.y1.ticks.color = darkModeScaleColor;
  // chartOptions.value.scales.x.ticks.color = darkModeScaleColor;
  mainChartOptions.value.scales.x.ticks.color = function(context: any) {
    return context.tick.major ? '#ff3874' : darkModeScaleColor();
  };

})
</script>

<template>
  <div v-if="isError" class="bg-red-500 text-white absolute top-0 left-0 w-full p-2 text-center">
    {{ errorMessage }}
  </div>
  <div class="xl:flex xl:space-y-0 " :class="[isFullscreenC01 ? 'xl:space-x-0 space-y-0':'xl:space-x-4 space-y-4']">
    <!-- chart data option-->
    <div v-if="!isFocusOnRef" class="md:basis-1/4 card">
      <div class="flex justify-between items-center">
        <h2 class="ml-1" >Option</h2>
        <button @click="focusToggle" class="rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
          <Icon name ="basil:cross-solid" class="text-3xl"/>
        </button>
      </div>
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
    <div class="card"
         :class="{'px-0 pb-4 pt-0 md:w-full md:px-4': isFocusOnRef,
                  'md:basis-3/4': !isFocusOnRef,
                  'fixed top-0 left-0 w-full h-screen border-2 border-pink-400': isFullscreenC01}">
      <div>
        <!-- focus mode ON-->
        <div v-if="isFocusOnRef" class="flex justify-between mx-4 my-2 lg:pt-0">
          <div class="flex items-center space-x-2">
            <h2 class="mr-1">Chart</h2>
            <button v-if="!isFullscreenC01" @click="focusToggle" class="rounded-lg px-2 h-full hover:bg-gray-200 dark:hover:bg-gray-600">
              <Icon name ="solar:settings-linear" class="text-xl relative -top-0.5"/>
            </button>
            <button @click="fullscreenToggleC01()" class="rounded-lg px-2 h-full hover:bg-gray-200 dark:hover:bg-gray-600">
              <Icon name="humbleicons:expand" class="relative text-lg -top-0.5"/>
            </button>
          </div>
          <div>
            <time-range-tabs :chart-loaded="chartLoaded"
                             :time-ranges="timeRanges"
                             @update:selectedTimeRange="handleSelectedTimeRange"
                             :is-small-screen="isSmallScreen"
            />
          </div>
        </div>

        <!-- focus mode OFF-->
        <div v-else class="flex justify-between mx-4 relative -top-1.5">
          <div class="flex space-x-4 items-center">
            <h2>Chart</h2>
            <button @click="fullscreenToggleC01(); isSmallScreen?focusToggle():undefined" class="rounded-lg px-2 h-full hover:bg-gray-200 dark:hover:bg-gray-600">
              <Icon name="humbleicons:expand" class="relative text-lg -top-0.5"/>
            </button>
          </div>
          <div class="flex items-center">
            <span class="hidden md:block mr-2">Data Count: </span>
            <span>{{ dataCountLabel }}</span>
          </div>
          <!-- Select Dropdown  -->
          <time-range-tabs :chart-loaded="chartLoaded"
                           :time-ranges="timeRanges"
                           @update:selectedTimeRange="handleSelectedTimeRange"
                           :is-small-screen="isSmallScreen"
          />
        </div>

        <div class="h-64 mb-2" :class="[isFullscreenC01?'h-[calc(100vh-120px)]':'md:h-80']">
          <Line v-if="chartLoaded" :data="computedChartData" :options="mainChartOptions" :key="chartRefreshTrigger" />
        </div>
        <div id="legend-container"></div> <!--config legend di plugins/chartjs.ts-->

      </div>
    </div>
  </div>
</template>