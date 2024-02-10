<script setup lang="ts">
import {useDataStore, usePreferences} from "~/store";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  parse,
  startOfMonth, subDays,
  subMonths
} from 'date-fns';
import Loading from "~/components/Loading.vue";
import { Line } from 'vue-chartjs'
import {
  expandHourlyData,
  generateMinMaxRefsObject,
  processDataEntries,
  propertyNames, setChartTicksAndGridColor,
  updateMinMax,
  UpdateType
} from "~/composables/utils";
import type {CalendarDays, ChartDataset, WeatherData} from "~/types";
import {chartOptionsMain} from "~/composables/chartOptionsMain";
import {assignAverageDataset, assignHumidityDataset, assignTemperatureDataset} from "~/composables/assignChartDataset";
import {collection, doc, getDoc} from "firebase/firestore";
import {da} from "date-fns/locale";

useHead({
  title: 'Calendar View',
})

const dataStore = useDataStore()

// vue-macros syntax to remove .value to access reactive
// efective only if value is determinated
let overallDatasets = $ref(dataStore.overall_datasets)
let isDark = $ref(useDark())
let isSlideLoading = $ref(true)
const isLoading = ref(true)

const selectedDate = ref()
const yesterday = ref()
const tommorow = ref()

const HUMIDITY_DARK_BORDER_COLOR = "#444444"

watch(useDark(), (_isDark) => {
  isDark = _isDark
  setChartTicksAndGridColor(isDark)
  refreshChart()
})

onMounted(() => {
  isLoading.value = false
  jumpToCurrentMonth()

  dataStore.activeRouter = 'calendar'

  chartOptionsMain.value.plugins.annotation.annotations = {}
  chartOptionsMain.value.scales.y.max = undefined
  chartOptionsMain.value.scales.x.ticks.autoSkipPadding = 20
  chartOptionsMain.value.scales.x.time.tooltipFormat = 'hh:mm a'
  chartOptionsMain.value.animation = false

  setChartTicksAndGridColor(isDark)
  refreshChart()
})

const currentDate = ref(new Date());
const calendarDays = ref<CalendarDays[]>([]);

const currentMonth = ref('');

const calData = generateMinMaxRefsObject(propertyNames);

const generateCalendarDays = () => {
  const start = startOfMonth(currentDate.value);
  const end = endOfMonth(currentDate.value);

  const firstDataset = overallDatasets[0]?.date;
  const lastDataset = overallDatasets.slice(-1)[0]?.date;

  const startPoint = !firstDataset || start >= startOfMonth(firstDataset);
  const endPoint = !lastDataset || end <= endOfMonth(lastDataset);

  if (startPoint && endPoint) {
    const daysOfMonth = eachDayOfInterval({ start, end });

    const _calData = generateMinMaxRefsObject(propertyNames);

    calendarDays.value = daysOfMonth.map((date) => {
      const dataset = overallDatasets.find((ds) => isSameDay(ds.date, date));

      if (dataset?.is_valid) {
        // find min max for highlight. use calData and _calData
        // set propery from composables/utils propertyNames
        updateMinMax(dataset, UpdateType.Local, calData, _calData);
      }

      return {
        dataset,
        datetime: date,
      };
    });
  }

  currentMonth.value = format(currentDate.value, 'MMMM yyyy');
};

const goToNextMonth = () => {
  currentDate.value = addMonths(currentDate.value, 1);
  generateCalendarDays();
};

const goToPreviousMonth = () => {
  currentDate.value = subMonths(currentDate.value, 1);
  generateCalendarDays();
};

const columnTitles = ['date', 'data point', 'high', 'low', 'temp avg', 'humid avg', 'temp diff sum']

const isBeforeFirstDatasetMonth = computed(() => {
  const firstDatasetDate = overallDatasets[0]?.date;
  return !firstDatasetDate || currentDate.value <= addMonths(startOfMonth(firstDatasetDate), 1);
});

const isAfterLastDatasetMonth = computed(() => {
  const lastDatasetDate = overallDatasets[overallDatasets.length - 1]?.date;
  return !lastDatasetDate || currentDate.value >= subMonths(endOfMonth(lastDatasetDate), 1);
});

const isCurrentMonth = computed(() => {
  return isSameMonth(currentDate.value, new Date());
});

const jumpToCurrentMonth = () => {
  currentDate.value = new Date();
  generateCalendarDays();
};

const slideIn = ref(false)
let selectedData = $ref({
  exist: false,
  isValid: false,
  title: '',
  data: {} as WeatherData
})

const chartRefreshTrigger = ref(0);
const refreshChart = () => chartRefreshTrigger.value += 1;

const getSelectedEntries = async (_datetime: Date) => {
  const noDataDate = ref(format(_datetime, "dd MMMM yyyy"))

  selectedDate.value = _datetime
  yesterday.value = subDays(selectedDate.value, 1)
  tommorow.value = addDays(selectedDate.value, 1)

  try {
    isSlideLoading = true
    const db = useFirestore();

    const formattedDate = format(_datetime, 'yyyy-MM-dd');

    const dailyRef = doc(collection(db, 'dailyRecords'), formattedDate);

    // Use getDoc to fetch the initial data
    const docSnapshot = await getDoc(dailyRef);
    const data = docSnapshot.data();

    if (data?.today_entries){
      const times = data.today_entries.time
      const temperature = data.today_entries.temp
      const humidity = data.today_entries.humid

      dataStore.isSelectedDataValid = data.today_is_valid

      if (times.length >= 2 && times.at(-1) === "12:00 AM") {
        // Remove the last occurrence of "12:00 AM"
        times.pop(); temperature.pop(); humidity.pop();
      }

      handleSelectedEntries('', data)

    }else {
      dataStore.isSelectedDataValid = false
      handleSelectedEntries(noDataDate.value)
    }

  } catch (error) {
    console.error(error);
  } finally {
    isSlideLoading = false
  }
}

const handleSelectedEntries = (title: string, data?: any) => {
  slideIn.value = true

  let averageDataset = {}
  chartData.value.labels = []
  chartData.value.datasets = []
  refreshChart()

  if (data?.today_date){
    const toDate = parse(data.today_date, "yyyy-MM-dd", new Date())
    const title = format(toDate, "dd MMMM yyyy")

    const {
      temperatureContainer, humidityContainer, dummyDatetimeArray
    } = processDataEntries(data)

    chartData.value.labels = dummyDatetimeArray

    const temperatureDataset = assignTemperatureDataset('Temperature', temperatureContainer, 0)
    chartData.value.datasets.push(temperatureDataset);

    const humidityDataset = assignHumidityDataset(humidityContainer)
    chartData.value.datasets.push(humidityDataset);

    averageDataset = assignAverageDataset(expandHourlyData(dataStore.overall_hourly_average_adj));
    chartData.value.datasets.push(averageDataset);

    if (isDark) chartData.value.datasets[1].borderColor = HUMIDITY_DARK_BORDER_COLOR

    selectedData = {
      exist: true,
      isValid: data.today_is_valid,
      title,
      data
    }
  }else {
    selectedData = {
      exist: false,
      isValid: false,
      title,
      data: {} as WeatherData
    }
  }

};

const closeSlide = () => slideIn.value = false

const chartData = ref<{ labels: Date[]; datasets: ChartDataset[];}>({
  labels: [],
  datasets: [],
});

onKeyStroke('Escape', () => {
  if (slideIn.value){
    slideIn.value = false
  }
})

const userPreference = usePreferences()
const isPercentageOnRef = ref(userPreference.percentageToggle)

const percentageToggle = (isChecked: boolean) => {
  isPercentageOnRef.value = isChecked;
  userPreference.setPercentageToggle(isChecked);
};

</script>
<template>
  <div v-if="isLoading"><Loading class="h-3/4"/></div>
  <div v-else>
    <div class="px-2 transition-all duration-500" :class="[slideIn?'w-2/3':'w-full']">
      <div class="p-4 mb-4 flex space-x-4 items-center justify-between transition-all" :class="[slideIn?'md:w-full':'md:w-96']" >
        <h2>{{ currentMonth }}</h2>
        <div class="flex text-gray-500 dark:text-gray-50 space-x-4 leading-none">
          <button
              @click="jumpToCurrentMonth"
              v-if="!isCurrentMonth"
              class="py-2 px-3 bg-zinc-300 dark:bg-zinc-600 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            <icon name="ic:baseline-loop"/>
          </button>
          <button
              @click="goToPreviousMonth"
              :disabled="isBeforeFirstDatasetMonth"
              class="py-2 px-3 rounded-lg"
              :class="[isBeforeFirstDatasetMonth ? 'bg-transparent':'bg-zinc-300 dark:bg-zinc-600 dark:hover:bg-zinc-700 hover:bg-zinc-200']"
          >
            <icon name="mingcute:arrow-left-fill"/>
          </button>
          <button
              @click="goToNextMonth"
              :disabled="isAfterLastDatasetMonth"
              class="py-2 px-3 rounded-lg"
              :class="[isAfterLastDatasetMonth ? 'bg-transparent':'bg-zinc-300 dark:bg-zinc-600 dark:hover:bg-zinc-700 hover:bg-zinc-200']"
          >
            <icon name="mingcute:arrow-right-fill"/>
          </button>

        </div>
      </div>

      <div class="flex rounded-xl overflow-hidden border dark:border-neutral-700">
        <div class="relative text-white dark:bg-zinc-800 bg-zinc-100 border-r border-r-zinc-300 dark:border-r-zinc-600">
          <div class="divide-y divide-zinc-200 dark:divide-zinc-700">
            <div v-for="columnTitle in columnTitles" :key="columnTitle"  class="w-24 h-12 flex items-center content-center px-4">
              <div class="text-sm dark:text-white text-gray-700 w-full">{{ columnTitle }}</div>
            </div>
          </div>
        </div>
        <div class="overflow-x-auto dark:bg-zinc-800 bg-zinc-50">
          <div class="flex">
            <div v-for="data in calendarDays" :key="data.datetime" >
              <CalendarDay @click="getSelectedEntries(data.datetime)" :datetime="data.datetime"/>
            </div>
          </div>
          <div class="flex">
            <div v-for="data in calendarDays" :key="data.datetime" class="text-center">
              <CalendarData :data :isDark type="today_total_data"/>
              <CalendarData :data :isDark type="temp_high" :max="calData.highTemp.max" :min="calData.highTemp.min"/>
              <CalendarData :data :isDark type="temp_low" :max="calData.lowTemp.max" :min="calData.lowTemp.min"/>
              <CalendarData :data :isDark type="average_temp" :max="calData.tempAvg.max" :min="calData.tempAvg.min"/>
              <CalendarData :data :isDark type="average_humid" :max="calData.humidAvg.max" :min="calData.humidAvg.min"/>
              <CalendarData :data :isDark type="temp_diff_sum" :max="calData.tempDiffSum.max" :min="calData.tempDiffSum.min"/>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>

  <div class="w-0 h-full absolute top-0 right-0 overflow-x-hidden transition-all" :class="{'w-1/3' : slideIn}">
    <div class="absolute p-4 top-0 border-l border-zinc-300 w-full h-full overflow-y-auto overflow-x-hidden shadow-xl bg-white transition-all duration-500
                dark:border-zinc-700 dark:bg-zinc-800/70 backdrop-blur dark:text-zinc-100"
         :class="[slideIn ? 'right-0' : '-right-full']">

      <div class="flex justify-between space-x-4 items-center text-neutral-600 dark:text-neutral-200 mb-4">
        <div class="flex space-x-4 items-center">
          <button @click="closeSlide" class="btn">
            <icon name="material-symbols-light:double-arrow" class="text-2xl"/>
          </button>
          <span class="text-xl"> {{ selectedData.title }} </span>
        </div>
        <div class="flex space-x-4 items-center">
          <span v-if="isSlideLoading"><Icon name="eos-icons:loading" class="text-2xl"/></span>
          <button @click="getSelectedEntries(yesterday)" class="btn">
            <icon name="solar:arrow-left-linear" class="text-2xl"/>
          </button>
          <button  @click="getSelectedEntries(tommorow)" class="btn">
            <icon name="solar:arrow-right-linear" class="text-2xl"/>
          </button>
        </div>
      </div>

      <div class="grid gap-4">
        <div class="p-4 card-2">
          <div class="aspect-[4/2]">
            <Line v-if="selectedData.exist" :key="chartRefreshTrigger"
                  :data="chartData" :options="chartOptionsMain"
                  :plugins="[htmlLegendPlugin, borderPlugin]"/>
            <div v-else class="h-full text-center flex items-center">
              <h2 class="text-4xl dark:text-neutral-600 w-full"> no data <span class="text-2xl relative -top-1">🫤</span> </h2>
            </div>
          </div>
          <div v-if="selectedData.exist" id="legend-container" class="text-gray-600 dark:text-gray-200"></div>
        </div>

        <div v-if="selectedData.isValid" class="grid grid-cols-2 gap-4">
          <DataCard label="Data Point"
                    :data="selectedData.data.today_data_point_count"
                    icon="solar:check-read-linear"
                    color="text-green-500 dark:text-green-300"
          />
          <DataCard label="Temp Diff Sum"
                    :data="Number(selectedData.data.today_statistics.temp_diff_sum)"
                    :range="dataStore.overall_min_max.tempDiffSum"
                    :average="dataStore.overall_hourly_temp_diff_average"
                    icon="ph:sigma-bold"
                    unit="°C"
          />
          <DataCard label="Highest Temp"
                    :data="selectedData.data.today_highest_temp.value"
                    :range="dataStore.overall_min_max.highTemp"
                    :average="dataStore.overall_high_temp_average"
                    icon="uil:temperature"
                    color="text-red-400"
                    unit="°C"
          />
          <DataCard label="Lowest Temp"
                    :data="selectedData.data.today_lowest_temp.value"
                    :range="dataStore.overall_min_max.lowTemp"
                    :average="dataStore.overall_low_temp_average"
                    icon="uil:temperature-empty"
                    color="text-sky-400"
                    unit="°C"
          />
          <DataCard label="Temp Avg"
                    :data="selectedData.data.today_average.temp"
                    :average="dataStore.overall_temp_average"
                    :range="dataStore.overall_min_max.tempAvg"
                    icon="mdi:temperature-celsius"
                    unit="°C"
          />
          <DataCard label="Humid Avg"
                    :data="selectedData.data.today_average.humid"
                    :range="dataStore.overall_min_max.humidAvg"
                    :average="dataStore.overall_humid_average"
                    icon="material-symbols:humidity-percentage-outline"
                    unit="%"
          />
        </div>
        <div v-else-if="selectedData.exist">
          <DataCard label="Data Point"
                    :data="selectedData.data.today_data_point_count"
                    icon="iconamoon:close"
                    color="dark:text-red-400"
          />
        </div>
      </div>

    </div>
  </div>

</template>