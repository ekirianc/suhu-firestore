<script setup lang="ts">
import {useDataStore, usePreferences} from "~/store";
import {Line} from 'vue-chartjs';
import 'chartjs-adapter-moment';
import {
  addMissingTimes,
  expandHourlyData,
  formattedDate, generateDateTimeWithHourlyInterval,
  generateHourlyIntervalDT,
} from "~/composables/utils";
import {animation, annotation, chartOptionsMain} from "~/composables/chartOptionsMain";
import {
  assignAverageDataset,
  assignDatasets, assignSimpleTempDataset,
  assignHumidityDataset,
  assignTemperatureDataset, assignSimpleHumidDataset
} from "~/composables/assignChartDataset";
import {formatDistanceToNow} from "date-fns";
import ChartDataLabels from "chartjs-plugin-datalabels";
import ErrorBar from "~/components/ErrorBar.vue";

useHead({
  title: 'Chart view',
});

interface ChartDataset {
  label?: string
  data?: (number | null)[]
  borderColor?: string
  borderWidth?: number
  radius?: number
  yAxisID?: string
  spanGaps?: boolean
  segment?: object
  borderDash?: number[],
  backgroundColor?: string | object,
  showLine?: boolean,
  fill?: boolean,
}

const errorMessage = ref('')
const isError = ref(false)

// for refresh chart when change
const chartLoaded = ref(false);
const dataStore = useDataStore()
const userPreference = usePreferences()
const { width } = useWindowSize()
const SMALL_SCREEN = 480
const XL_SCREEN = 1280
const HUMIDITY_DARK_BORDER_COLOR = "#444444"

let realDatetime: Date[] = [];
let realTemperatures: (number | null)[] = []
let realHumidity: (number | null)[] = []
let avgTemperatureSeries: (number | null)[] = []

const isSeriesOnRef = ref(userPreference.seriesToggle); // false
const isSimpleOnRef = ref();
const isOptionHiddenRef = ref()
const isShowLabelOnRef = ref()
const isChartAnimationOnRef = ref()
const chartRefreshTrigger = ref(0);
const isSmallScreen = ref(width.value < SMALL_SCREEN)
const isLargeScreen = ref(width.value < XL_SCREEN)

watch(width, (width) => {
  // to keep it responsive on window resize
  // specialized for option menu
  isSmallScreen.value = width < SMALL_SCREEN
  isLargeScreen.value = width < XL_SCREEN

})

const disableSeriesToggle = ref(false)
const disableShowLabel = ref(false)

const [isFullscreen, fullscreenToggle] = useToggle()

function updateRelativeDatetime(){
  dataStore.relative_time = formatDistanceToNow(dataStore.last_datetime, { addSuffix: true, includeSeconds: true })
}

const intervalId = setInterval(updateRelativeDatetime, 60000)

onBeforeUnmount(()=>{
  // Clear the interval to avoid memory leaks
  clearInterval(intervalId)
})

const SHOW_LABEL = 'labelEnabled';
const SIMPLE_MODE = 'simpleEnabled';
const HIDE_OPTION = 'optionHidden';
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

const optionToggle = () => {
  isOptionHiddenRef.value = !isOptionHiddenRef.value;

  isOptionHiddenRef.value ? localStorage.setItem(HIDE_OPTION, 'true') : localStorage.removeItem(HIDE_OPTION);

};

const chartAnimationToggle = (isChecked: boolean) => {
  chartOptionsMain.value.animation = isChecked ? animation : false;
  isChartAnimationOnRef.value = isChecked;
  isChecked ? localStorage.setItem(CHART_ANIMATION, 'true') : localStorage.removeItem(CHART_ANIMATION);
};

const refreshChart = () => chartRefreshTrigger.value += 1;

onMounted(() => {
  // Animation setting
  const storedAnimationSetting = localStorage.getItem(CHART_ANIMATION);
  chartOptionsMain.value.animation = storedAnimationSetting === 'true' ? animation : false;
  isChartAnimationOnRef.value = storedAnimationSetting === 'true';

  // chart Option setting
  const storedHideOption = localStorage.getItem(HIDE_OPTION);
  if (storedHideOption === 'true') {
    isOptionHiddenRef.value = true
  } else {
    if (isSmallScreen.value || isLargeScreen.value){
      localStorage.setItem(HIDE_OPTION, 'true')
      isOptionHiddenRef.value = true
    }else {
      isOptionHiddenRef.value = false;
    }
  }

  if (localStorage.getItem('mainChartZoom')){
    localStorage.removeItem('mainChartZoom')
  }

  updateRelativeDatetime()
});

onMounted(async () => {
  // if (!dataStore.last_temperature) {
  //   await dataStore.fetchDataFromFirestore();
  // }
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

watch([isOptionHiddenRef, isFullscreen], () => {
  // If isChartAnimationOnRef changes, increase chartRefreshTrigger
  // put this to :key on chart component, so it will refresh on every option changes
  chartRefreshTrigger.value += 1;
});

watch([isChartAnimationOnRef, isSimpleOnRef, isShowLabelOnRef, useDark(), ], () => {
  // If isChartAnimationOnRef changes, increase chartRefreshTrigger
  // put chartRefreshTrigger to :key on chart component, so it will refresh on every option changes
  refreshChart()
});

watch([selectedTimeRange, isSeriesOnRef, isSimpleOnRef, useDark(), ()=>dataStore.last_datetime], async ([timeRangeNew, isSeriesOn, isSimpleOn, isDark],[timeRangeOld]) => {
  userPreference.timeRange = timeRangeNew
  chartLoaded.value = false
  dataCountLabel.value = dataStore.data_entries.length === 0 ? 'no data' : 'calculating...';

  if (Boolean(localStorage.getItem('mainChartZoom'))){
    // zoom limit not updated on timerange change. need refresh
    refreshChart()
  }

  // Clear the arrays before fetching new data
  realTemperatures.length = 0
  realHumidity.length = 0
  realDatetime.length = 0
  avgTemperatureSeries.length = 0
  chartData.value.datasets = []
  chartData.value.labels = []

  try {
    let totalDataPointCount = 0;
    let averageDataset = {}

    if (!isSeriesOn) {
      // averageDataset on Series OFF
      const sourceData = isSimpleOn ? dataStore.overall_hourly_average_adj : expandHourlyData(dataStore.overall_hourly_average_adj);
      averageDataset = assignAverageDataset(sourceData);
      chartData.value.datasets.push(averageDataset);
    }

    dataStore.data_entries.slice(0, Number(timeRangeNew)).forEach((doc, index) => {
      const hourlyTemp = doc.hourly_temperature.filled
      const hourlyTempAdj = doc.hourly_temperature.adjusted
      const hourlyTempObj = doc.hourly_temperature.object

      const hourlyHumid = doc.hourly_humidity.filled
      const hourlyHumidAdj = doc.hourly_humidity.adjusted

      if (!isSeriesOn){
        // Series OFF

        const temp = doc.expanded_temperature
        const humidity = doc.expanded_humidity
        const datetime = doc.expanded_datetime

        totalDataPointCount += doc.data_point_count;
        dataCountLabel.value = totalDataPointCount.toString()

        chartData.value.labels = datetime; // X axis label

        if (isSimpleOn){
          // Series OFF and Simple ON, assign hourly data
          chartOptionsMain.value.plugins.annotation.annotations = {
            annotation: annotation(1, isDark ? '#a9a9a9' : undefined)
          };

          chartData.value.labels = []
          chartData.value.labels = generateHourlyIntervalDT()

          const simpleTemperature = assignSimpleTempDataset(formattedDate(doc.date), hourlyTempAdj, index);
          chartData.value.datasets.push(simpleTemperature);

          if (timeRangeNew === "1"){
            // Series OFF and Simple ON
            const simpleHumidity = assignSimpleHumidDataset(hourlyHumidAdj)
            chartData.value.datasets.push(simpleHumidity);

            const maxValue = Math.max(...hourlyTemp.filter(value => value !== null) as number[]);
            chartOptionsMain.value.scales.y.max = Math.round(maxValue + 1)
            chartData.value.datasets[1].fill = true

            disableShowLabel.value = false
            if (timeRangeOld !== ""){
              // not gonna executed on first visit
              isShowLabelOnRef.value = true
              localStorage.setItem(SHOW_LABEL, "true")
            }
          }else {
            disableShowLabel.value = true
            isShowLabelOnRef.value = false
            localStorage.removeItem(SHOW_LABEL)
            chartOptionsMain.value.scales.y.max = undefined
            if (timeRangeOld === '1'){
              // scales.y.max not gonna updated if you don't do this here
              refreshChart()
            }
          }
        }else {
          // Simple OFF, assign real data
          chartOptionsMain.value.plugins.annotation.annotations = {
            annotation: isDark ? annotation(0, '#a9a9a9') : annotation()
          };

          chartOptionsMain.value.scales.y.max = undefined

          const temperatureDataset = assignTemperatureDataset(formattedDate(doc.date), temp, index)
          chartData.value.datasets.push(temperatureDataset);
          // just assign humidity when timerange = 1
          if (timeRangeNew === "1"){
            const humidityDataset = assignHumidityDataset(humidity)
            chartData.value.datasets.push(humidityDataset);
            chartData.value.datasets[1].fill = true
          }
        }

        // Series OFF and range 1
        if (timeRangeNew === "1"){
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
            isSimpleOn ? dataStore.overall_hourly_average_by_entries : expandHourlyData(dataStore.overall_hourly_average_by_entries)
        );

        totalDataPointCount += doc.data_point_count;
        dataCountLabel.value = totalDataPointCount.toString()
      }
    })

    if (isSeriesOn){
      // Series ON
      chartOptionsMain.value.plugins.annotation.annotations = {};
      isShowLabelOnRef.value = false
      disableShowLabel.value = true
      localStorage.removeItem(SHOW_LABEL)

      if (!isSimpleOn){
        // Series ON Simple OFF
        const filledData = addMissingTimes(realDatetime, realTemperatures, realHumidity);
        const sortedFilledData = filledData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        // console.log(filledData)

        const sortedTemp = filledData.map(entry => entry.temperature);
        const sortedHumid = filledData.map(entry => entry.humidity);

        chartData.value.labels = sortedFilledData.map(entry => entry.timestamp);
        chartData.value.datasets = assignDatasets(
            sortedTemp, sortedHumid,
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

  if(timeRangeNew === "1"){
    isSeriesOnRef.value = false
    userPreference.seriesToggle = false
    localStorage.setItem('timerangeIsOne', 'true')
    if (isDark){
      chartData.value.datasets[2].borderColor = HUMIDITY_DARK_BORDER_COLOR
    }
  }else {
    localStorage.removeItem('timerangeIsOne')
  }

  chartOptionsMain.value.scales.y.grid.color = (ctx: any) => {
    const threshold = ctx.tick.value === 30 || ctx.tick.value === 34;
    return isDark ? (threshold ? '#aba6a6' : '#4b4b4b') : (threshold ? '#2f2f2f' : '#d5d5d5');
  };
  chartOptionsMain.value.scales.x.grid.color = () => (isDark ? '#4b4b4b' : '#d5d5d5')
  // chartOptions.value.scales.x.grid.display = () => !(width.value < 480 && isOptionOnRef.value)

  const darkModeScaleColor = () => (isDark ? '#bebebe' : '#525252');
  chartOptionsMain.value.scales.y.ticks.color = darkModeScaleColor;
  chartOptionsMain.value.scales.y1.ticks.color = darkModeScaleColor;
  // chartOptions.value.scales.x.ticks.color = darkModeScaleColor;
  chartOptionsMain.value.scales.x.ticks.color = function(context: any) {
    return context.tick.major ? '#ff3874' : darkModeScaleColor();
  };

})

onKeyStroke('Escape', () => {
  if (isFullscreen.value){
    fullscreenToggle()
  }
})

onKeyStroke('s', () => {
  isSimpleOnRef.value = !isSimpleOnRef.value
  isSimpleOnRef.value ? localStorage.setItem(SIMPLE_MODE, 'true') : localStorage.removeItem(SIMPLE_MODE);
})

</script>

<template>
  <error-bar v-if="isError" :message="errorMessage"/>

  <div class="xl:flex xl:space-y-0 relative" :class="[isFullscreen ? 'xl:space-x-0 space-y-0':'xl:space-x-4 space-y-4']">
    <!--  chart view-->
    <div class="card "
         :class="{'md:w-full': isOptionHiddenRef,
                  'md:basis-3/4': !isOptionHiddenRef,
                  'fixed top-0 left-0 w-full h-screen border-2 dark:border-pink-400 z-50': isFullscreen,
                  'card-effect': !isFullscreen,
                  'px-0': isSmallScreen}">

    <div class="flex justify-between relative -top-1 mb-2" :class="{'px-4': isSmallScreen}">
        <!-- Select  -->
        <time-range-tabs :chart-loaded="chartLoaded"
                         :time-ranges="timeRanges"
                         @update:selectedTimeRange="handleSelectedTimeRange"
        />

        <div class="flex items-center space-x-2 dark:text-gray-200">
          <!-- reset zoom -->
          <button @click="refreshChart" class="rounded-lg px-2 h-full hover:bg-gray-200 dark:hover:bg-gray-600">
            <Icon name="pepicons-pop:arrow-spin" class="text-lg"/>
          </button>
          <!-- Setting -->
          <button v-if="!isFullscreen" @click="optionToggle"
                  class="rounded-lg px-2 h-full hover:bg-gray-200 dark:hover:bg-gray-600"
                  :class="{'bg-gray-200 dark:bg-gray-600': !isOptionHiddenRef}">
            <Icon name ="solar:settings-linear" class="text-xl relative -top-0.5"/>
          </button>
          <!-- fullscreen -->
          <button @click="fullscreenToggle(); " class="rounded-lg px-2 h-full hover:bg-gray-200 dark:hover:bg-gray-600">
            <Icon name="humbleicons:expand" class="relative text-lg -top-0.5"/>
          </button>
        </div>

      </div>

      <div class="mb-2" :class="[isFullscreen?'h-[calc(100vh-120px)]' : 'aspect-[4/3] md:aspect-[2/1] xl:h-[50vh] w-full']">
          <Line v-if="chartLoaded" ref="mainChart"
                :data="computedChartData" :options="chartOptionsMain"
                :plugins="[htmlLegendPlugin, ChartDataLabels, borderPlugin]"
                :key="chartRefreshTrigger" />
      </div>
      <div id="legend-container" class="text-gray-600 dark:text-gray-200"></div> <!--config legend di plugins/chartjs.client.ts-->

    </div>

    <!-- chart data option-->
    <div v-if="!isOptionHiddenRef"
         class="basis-1/4 card card-effect space-y-2"
         :class="{'absolute right-4 -top-1': isSmallScreen || isLargeScreen}">
      <div class="flex justify-between items-center">
        <h2 class="ml-1" >Option</h2>
        <button @click="optionToggle" class="rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
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
  </div>
</template>