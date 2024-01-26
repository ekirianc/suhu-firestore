<script setup lang="ts">
import { useDataStore } from "~/store";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  parse,
  startOfMonth,
  subMonths
} from 'date-fns';
import Loading from "~/components/Loading.vue";
import { Line } from 'vue-chartjs'
import { generateMinMaxRefsObject, propertyNames, updateMinMax, UpdateType } from "~/composables/utils";

const dataStore = useDataStore()
let overallDatasets = $ref(dataStore.overall_datasets)
const isDark = ref(useDark())

watch(useDark(), (_isDark) => {
  isDark.value = _isDark
})

const isLoading = ref(true)
onMounted(async () => {
  try {
    isLoading.value = true
    if (!dataStore.last_temperature) {
      await dataStore.fetchDataFromFirestore();
      overallDatasets = dataStore.overall_datasets
    }
  }catch (e){
    console.log(e)
  }finally {
    isLoading.value = false
    jumpToCurrentMonth()
  }
})

useHead({
  title: 'Calendar view',
});

const currentDate = ref(new Date());
const calendarDays = ref<any[]>([]);

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
      const today_total_data = dataset?.today_total_data ?? null;

      if (dataset?.is_valid) {
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

const columnTitles = ['date', 'data point', 'high', 'low', 'temp avg', 'humid avg', 'temp diff sum', ]

const isBeforeFirstDatasetMonth = computed(() => {
  const firstDatasetDate = overallDatasets[0]?.date;
  return !firstDatasetDate || currentDate.value <= addMonths(startOfMonth(firstDatasetDate), 1);
});

const isAfterLastDatasetMonth = computed(() => {
  const lastDatasetDate = overallDatasets[dataStore.overall_datasets.length - 1]?.date;
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
const selectedData = ref();

const handleSelectedEntries = (selectedEntries: any) => {
  slideIn.value = true

  if (selectedEntries.today_date){
    const date = parse(selectedEntries.today_date, "yyyy-MM-dd", new Date())
    // console.log(selectedEntries.today_entries.time)
    selectedData.value = {
      exist: true,
      date: format(date, "dd MMMM yyyy"),
      // TODO generate temperature and time like dummyDatetimeArray on store
    }
  }else {
    selectedData.value = {
      exist: false,
      date: selectedEntries,
    }
  }

};

const closeSlide = () => slideIn.value = false

const chartData = ref({
  labels: ['January', 'February', 'March', 'April', 'May'],
  datasets: [
    {
      label: 'Data One',
      borderColor: '#f87979',
      data: [40, 20, 12, 50, 10],
    },
  ],
})
const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
})

</script>
<template>
  <div :class="{'mx-2': !slideIn}">
    <div v-if="isLoading"><Loading class="h-3/4"/></div>
    <div v-else>
      <div :class="{'w-1/2' : slideIn}">
        <div class="p-4 mb-4 flex space-x-4 items-center justify-between " :class="[slideIn?'md:w-full':'md:w-96']" >
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
              <CalendarDay :calendarDays="calendarDays" @update:selectedEntries="handleSelectedEntries" />
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

      <div v-if="slideIn"
           class="absolute z-20 right-0 top-0 p-4 border-l bg-zinc-100 w-1/2 h-full overflow-y-auto shadow-xl
                  dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
        <div class=" mb-4">
          <button @click="closeSlide" class="p-2 hover:bg-red-500/40 rounded-xl">
            <icon name="charm:cross" class="text-2xl"/>
          </button>
          <span class="p-4"> {{ selectedData.date }} </span>
        </div>
        <div class="dark:bg-zinc-700/50 p-4 rounded-lg">
          <div v-if="selectedData.exist">
            <Line :data="chartData" :options="chartOptions"/>
          </div>
          <div v-else>
            <span class="text-4xl dark:text-white">No Data</span>
          </div>
        </div>
      </div>

    </div>
  </div>

</template>