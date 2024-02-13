<script setup lang="ts">
import {useDataStore, usePreferences} from "~/store";
import {Line} from 'vue-chartjs';
import 'chartjs-adapter-moment';
import {
  addMissingTimes,
  expandHourlyData, extendAvgTemperatureSeries,
  formattedDate, generateDateTimeWithHourlyInterval,
  generateHourlyIntervalDT, setChartTicksAndGridColor,
} from "~/composables/utils";
import {animation, annotation, chartOptionsMain} from "~/composables/chartOptionsMain";
import {
  assignAverageDataset,
  assignDatasets, assignSimpleTempDataset,
  assignHumidityDataset,
  assignTemperatureDataset, assignSimpleHumidDataset
} from "~/composables/assignChartDataset";
import {differenceInDays, eachMinuteOfInterval, formatDistanceToNow, parseISO} from "date-fns";
import ChartDataLabels from "chartjs-plugin-datalabels";
import type {ChartDataset} from "~/types";
import {windowSize} from "~/composables/windowSize";

const errorMessage = ref('')
const isError = ref(false)

const chartLoaded = ref(false);
const dataStore = useDataStore()
const userPreference = usePreferences()
const HUMIDITY_DARK_BORDER_COLOR = "#444444"

interface realTemperaturesHour{
  date: string
  temp: number[]
  humid: number[]
  datetime: Date[]
  firstTemp: number | null
  firstHumid: number | null
}

let realDatetime: Date[] = [];
let realTemperatures: (number | null)[] = []
let seriesDataHourly: realTemperaturesHour[] =[]
let realHumidity: (number | null)[] = []
let avgTemperatureSeries: (number | null)[] = []

const isSeriesOnRef = ref(userPreference.seriesToggle); // false
const isSimpleOnRef = ref();
const isOptionHiddenRef = ref()
const isShowLabelOnRef = ref()
const isChartAnimationOnRef = ref()
const chartRefreshTrigger = ref(0);

const { width, isSmallScreen, isLargeScreen, SMALL_SCREEN, XL_SCREEN } = windowSize()

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
  const getStoredAnimationSetting = localStorage.getItem(CHART_ANIMATION);
  const isAnimationOn = getStoredAnimationSetting === 'true'
  chartOptionsMain.value.animation = isAnimationOn ? animation : false;
  isChartAnimationOnRef.value = isAnimationOn;

  // chartOptionsMain.value.scales.x.ticks.autoSkipPadding = undefined
  chartOptionsMain.value.scales.x.time.tooltipFormat = 'DD MMM hh:mm a'

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
  { name: 'Today',  value: '1' },
  { name: '3 days', value: '3' },
  { name: '1 week', value: '7' }
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
  seriesDataHourly.length = 0

  chartData.value.datasets = []
  chartData.value.labels = []

  try {
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

        chartData.value.labels = doc.expanded_datetime; // X axis label

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
        const generatedDateTime = generateDateTimeWithHourlyInterval(doc.datetime, hourlyTempObj);

        if (!isSimpleOn){
          // Simple OFF
          realTemperatures = realTemperatures.concat(doc.temperatures);
          realHumidity = realHumidity.concat(doc.humidity);
          realDatetime = realDatetime.concat(doc.datetime);

        } else {
          // Simple ON
          realTemperatures = realTemperatures.concat(hourlyTemp);
          realHumidity = realHumidity.concat(hourlyHumid);
          realDatetime = realDatetime.concat(generatedDateTime);

          seriesDataHourly.push({
            date: doc.date,
            temp: hourlyTemp,
            humid: hourlyHumid,
            datetime: generatedDateTime,
            firstTemp: doc.temperatures[0],
            firstHumid: doc.humidity[0]
          })
        }

        if (!isSimpleOn)
          avgTemperatureSeries = avgTemperatureSeries.concat(expandHourlyData(dataStore.overall_hourly_average_by_entries));
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

        const sortedDatetime = sortedFilledData.map(entry => entry.timestamp)
        const sortedTemp = sortedFilledData.map(entry => entry.temperature)
        const sortedHumid = sortedFilledData.map(entry => entry.humidity)

        const filledDataFix = addMissingTimes(
            sortedDatetime, sortedTemp, sortedHumid
        );

        const fixedTemp = filledDataFix.map(entry => entry.temperature);
        const fixedHumid = filledDataFix.map(entry => entry.humidity);

        chartData.value.labels = filledDataFix.map(entry => entry.timestamp);
        chartData.value.datasets = assignDatasets(
            fixedTemp, fixedHumid,
        )

        const firstIndex = findIndexForTime(sortedDatetime[0])

        chartData.value.datasets.push(assignAverageDataset(avgTemperatureSeries.slice(firstIndex)))

      } else {
        // Series ON Simple ON
        const sortedSeriesData = seriesDataHourly.sort((a, b) =>
            (parseISO(a.date).getTime() - parseISO(b.date).getTime())
        );

        const combineData = (dataArray: (number | null)[][] | undefined) =>
            dataArray?.reduce((acc, curr) => {
              let startIndex = curr.findIndex((val) => val !== undefined && val !== null);
              if (startIndex === -1) startIndex = curr.length;
              return [...acc, ...curr.slice(startIndex)];
            }, []);

        const combinedTemp = combineData(sortedSeriesData.map(e => e.temp)) || [];
        const combinedHumid = combineData(sortedSeriesData.map(e => e.humid)) || [];

        const combinedDatetime = ([] as Date[]).concat(...sortedSeriesData.map(e => e.datetime));

        const hourlyAverageSingleDay = dataStore.overall_hourly_average_by_entries_obj
        const numberOfDays = differenceInDays(
            combinedDatetime.at(-1)!,
            combinedDatetime[0]
        ) + 1;

        const firstTemp = sortedSeriesData.map(e => e.firstTemp)[0]
        const firstHumid = sortedSeriesData.map(e => e.firstHumid)[0]

        // add new 1 hour at the end
        const lastTimestamp = combinedDatetime.at(-1)
        const newTimestamp = new Date(lastTimestamp!.getTime() + 60 * 60 * 1000); // Add 1 hour (in milliseconds)

        const filledData = fillMissingValues(combinedDatetime, combinedTemp, combinedHumid);
        const filledDatetime = filledData.map(e => e.datetime)
        const filledTemp = filledData.map(e => e.combinedTemp)
        const filledHumid = filledData.map(e => e.combinedHumid)

        chartData.value.labels = [...filledDatetime, newTimestamp!]
        chartData.value.datasets = assignDatasets(
            [firstTemp, ...filledTemp],
            [firstHumid, ...filledHumid],
        )

        const adjAvgTemperatureSeries = extendAvgTemperatureSeries(
            hourlyAverageSingleDay, combinedDatetime[0].getHours(), numberOfDays
        )
        chartData.value.datasets.push(assignAverageDataset(adjAvgTemperatureSeries))
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
    if (isDark) chartData.value.datasets[2].borderColor = HUMIDITY_DARK_BORDER_COLOR
  }else {
    localStorage.removeItem('timerangeIsOne')
  }

  setChartTicksAndGridColor(isDark)

})

onKeyStroke('Escape', () => {
  if (isFullscreen.value){
    fullscreenToggle()
  }
})

onKeyStroke('s', () => {
  isSimpleOnRef.value = !isSimpleOnRef.value
  isSimpleOnRef.value ? localStorage.setItem(SIMPLE_MODE, 'true') : localStorage.removeItem(SIMPLE_MODE);
}, { dedupe: true })

interface Measurement {
  datetime: Date;
  combinedTemp: number | null;
  combinedHumid: number | null;
}

function fillMissingValues(combinedDatetime: Date[], combinedTemp: (number|null)[], combinedHumid: (number|null)[]): Measurement[] {
  const filledArray: Measurement[] = [];

  for (let i = 0; i < combinedDatetime.length; i++) {
    const measurement: Measurement = {
      datetime: combinedDatetime[i],
      combinedTemp: combinedTemp[i],
      combinedHumid: combinedHumid[i]
    };

    filledArray.push(measurement);

    if (i < combinedDatetime.length - 1) {
      const current = combinedDatetime[i].getTime();
      const next = combinedDatetime[i + 1].getTime();
      const diff = next - current;

      if (diff > 3600000) { // 1 hour in milliseconds
        const numMissingValues = Math.floor(diff / 3600000) - 1;
        for (let j = 1; j <= numMissingValues; j++) {
          const missingTimestamp = current + j * 3600000;
          const missingDate = new Date(missingTimestamp);
          filledArray.push({
            datetime: missingDate,
            combinedTemp: null,
            combinedHumid: null
          });
        }
      }
    }
  }

  return filledArray;
}

function findIndexForTime(start: Date) {
  // Define the start and end times
  const startTime = new Date();
  startTime.setHours(0, 0, 0, 0);

  const endTime = new Date();
  endTime.setHours(23, 55, 0, 0);

  // Generate array of dates with 5-minute intervals
  const dateArray = eachMinuteOfInterval({ start: startTime, end: endTime }, { step: 5 });

  for (let i = 0; i < dateArray.length; i++) {
    if (dateArray[i].getHours() === start.getHours() &&
        dateArray[i].getMinutes() === start.getMinutes()) {
      return i;
    }
  }
  return -1; // If not found
}

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
                  'px-1': isSmallScreen}">

      <div class="flex justify-between relative -top-1 mb-2 text-sm md:text-base" :class="{'px-4': isSmallScreen}">
        <!-- Select  -->
        <time-range-tabs :chart-loaded="chartLoaded"
                         :time-ranges="timeRanges"
                         @update:selectedTimeRange="handleSelectedTimeRange"
        />

        <div class="flex items-center space-x-2 dark:text-gray-200">
          <!-- reset zoom -->
          <button @click="refreshChart" class="rounded-lg px-2 h-full hover:bg-gray-200 dark:hover:bg-gray-600">
            <Icon name="pepicons-pop:arrow-spin" class="text-lg relative -top-0.5"/>
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

      <div class="mb-2"
           :class="[isFullscreen?'h-[calc(100vh-120px)]' :
                    isOptionHiddenRef? 'xl:aspect-[5/1.82] aspect-[4/3] md:aspect-[2/1] w-full' :
                                       'xl:aspect-[5/2.5] aspect-[4/3] md:aspect-[2/1] w-full']" >
          <Line v-if="chartLoaded"
                :data="computedChartData" :options="chartOptionsMain"
                :plugins="[htmlLegendPlugin, ChartDataLabels, borderPlugin]"
                :key="chartRefreshTrigger" />
      </div>
      <div id="legend-container" class="text-gray-600 dark:text-gray-200"></div> <!--config legend di plugins/chartjs.client.ts-->

    </div>

    <!-- chart data option-->
    <div v-if="!isOptionHiddenRef"
         class="basis-1/4 card card-effect space-y-3"
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