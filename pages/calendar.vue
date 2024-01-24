<script setup lang="ts">
import {useDataStore} from "~/store";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  parse
} from 'date-fns';
import Loading from "~/components/Loading.vue";
import { Line } from 'vue-chartjs'
import {updateMinMaxRefs} from "~/composables/utils";

const dataStore = useDataStore()

onMounted(() => {
  if (dataStore.overall_datasets.length > 0) {
    generateCalendarDays();
  }
});

const isLoading = ref(true)
onMounted(async () => {
  try {
    isLoading.value = true
    if (!dataStore.last_temperature) {
      await dataStore.fetchDataFromFirestore();
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

class MinMaxRefs{
  min: number; max: number;
  constructor() {
    this.min = Infinity;
    this.max = -Infinity;
  }
}

const createMinMaxRefs = (): MinMaxRefs => new MinMaxRefs();

const generateMinMaxRefsObject = () => ({
  lowTemp: createMinMaxRefs(),
  highTemp: createMinMaxRefs(),
  tempAvg: createMinMaxRefs(),
  humidAvg: createMinMaxRefs(),
  tempDiffSum: createMinMaxRefs(),
});

const calData = generateMinMaxRefsObject();

const generateCalendarDays = () => {
  const start = startOfMonth(currentDate.value);
  const end = endOfMonth(currentDate.value);

  const firstDataset = dataStore.overall_datasets[0]?.date;
  const lastDataset = dataStore.overall_datasets.slice(-1)[0]?.date;

  const startPoint = !firstDataset || start >= startOfMonth(firstDataset);
  const endPoint = !lastDataset || end <= endOfMonth(lastDataset);

  if (startPoint && endPoint) {
    const daysOfMonth = eachDayOfInterval({ start, end });

    const _calData = generateMinMaxRefsObject();

    calendarDays.value = daysOfMonth.map((date) => {
      const dataset = dataStore.overall_datasets.find((ds) => isSameDay(ds.date, date));
      const today_total_data = dataset?.today_total_data ?? null;

      if (dataset) updateMinMaxRefs(_calData, calData, dataset);

      return {
        dataset,
        datetime: date,
        date: format(date, 'd'),
        day: format(date, 'E'),
        today_total_data,
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
  const firstDatasetDate = dataStore.overall_datasets[0]?.date;
  return !firstDatasetDate || currentDate.value <= addMonths(startOfMonth(firstDatasetDate), 1);
});

const isAfterLastDatasetMonth = computed(() => {
  const lastDatasetDate = dataStore.overall_datasets[dataStore.overall_datasets.length - 1]?.date;
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
  <div class="mx-2">
    <div v-if="isLoading"><Loading class="h-3/4"/></div>
    <div v-else>
      <div :class="{'w-1/2' : slideIn}">
        <div class="p-4 mb-4 flex space-x-4 items-center justify-between " :class="[slideIn?'md:w-full':'md:w-96']" >
          <h2>{{ currentMonth }}</h2>
          <div class="flex text-gray-500 dark:text-gray-50 space-x-4 leading-none">
            <button
                @click="jumpToCurrentMonth"
                v-if="!isCurrentMonth"
                class="py-2 px-3 bg-neutral-300 dark:bg-neutral-600 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700"
            >
              <icon name="ic:baseline-loop"/>
            </button>
            <button
                @click="goToPreviousMonth"
                :disabled="isBeforeFirstDatasetMonth"
                class="py-2 px-3 rounded-lg"
                :class="[isBeforeFirstDatasetMonth ? 'bg-transparent':'bg-neutral-300 dark:bg-neutral-600 dark:hover:bg-neutral-700 hover:bg-neutral-200']"
            >
              <icon name="mingcute:arrow-left-fill"/>
            </button>
            <button
                @click="goToNextMonth"
                :disabled="isAfterLastDatasetMonth"
                class="py-2 px-3 rounded-lg"
                :class="[isAfterLastDatasetMonth ? 'bg-transparent':'bg-neutral-300 dark:bg-neutral-600 dark:hover:bg-neutral-700 hover:bg-neutral-200']"
            >
              <icon name="mingcute:arrow-right-fill"/>
            </button>

          </div>
        </div>

        <div class="flex">
          <div class="relative">
            <div class="text-white dark:bg-neutral-700 bg-neutral-50 pl-4">
              <div v-for="columnTitle in columnTitles" :key="columnTitle"  class="w-20 h-12 flex items-center content-center">
                <div class="text-sm dark:text-white text-gray-700 w-full">{{ columnTitle }}</div>
              </div>
            </div>
          </div>
          <div class="overflow-x-auto dark:bg-neutral-700 bg-neutral-50">
            <div class="flex">
              <CalendarDay :day="calendarDays" @update:selectedEntries="handleSelectedEntries" />
            </div>
            <div class="flex">
              <div v-for="day in calendarDays" :key="day.datetime" class="text-center">
                <CalendarData :data="day" type="today_total_data"/>
                  <CalendarData :data="day" type="temp_high" :max="calData.highTemp.max"/>
                  <CalendarData :data="day" type="temp_low" :max="calData.lowTemp.max"/>
                  <CalendarData :data="day" type="average_temp" :max="calData.tempAvg.max"/>
                  <CalendarData :data="day" type="average_humid" :max="calData.humidAvg.max"/>
                  <CalendarData :data="day" type="temp_diff_sum" :max="calData.tempDiffSum.max"/>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="slideIn"
           class="absolute z-20 right-0 top-0 p-4 border-l bg-neutral-100 w-1/2 h-full overflow-y-auto shadow-xl
                  dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
        <div class=" mb-4">
          <button @click="closeSlide" class="p-2 hover:bg-red-500/40 rounded-xl">
            <icon name="charm:cross" class="text-2xl"/>
          </button>
          <span class="p-4"> {{ selectedData.date }} </span>
        </div>
        <div class="dark:bg-neutral-700/50 p-4 rounded-lg">
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