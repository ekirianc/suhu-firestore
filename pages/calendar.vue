<script setup lang="ts">
import {useDataStore} from "~/store";
import {startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, subMonths, getDay, isSameDay} from 'date-fns';

const dataStore = useDataStore()

const currentDate = ref(new Date());
const weekdays = ref(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
const calendarDays = ref([]);
const emptyGridDays = ref([]);

const currentMonth = ref('');

const generateCalendarDays = () => {
  const start = startOfMonth(currentDate.value);
  const end = endOfMonth(currentDate.value);
  const daysOfMonth = eachDayOfInterval({ start, end });

  // Find the min and max temperatures from temp_high
  const minTempHigh = Math.min(...dataStore.overall_datasets.map((dataset) => dataset.temp_high || 0));
  const maxTempHigh = Math.max(...dataStore.overall_datasets.map((dataset) => dataset.temp_high || 0));



  // Calculate the first day of the month
  const firstDayOfMonth = getDay(start);

  // Generate empty grid cells for days before the first day of the month
  emptyGridDays.value = Array.from({ length: firstDayOfMonth }, (_, index) => index);

  // Generate calendar days
  calendarDays.value = daysOfMonth.map((date) => {
    const dataset = dataStore.overall_datasets.find((ds) => isSameDay(ds.date, date));

    return {
      date,
      day: format(date, 'd'),
      inCurrentMonth: date.getMonth() === currentDate.value.getMonth(),
      dataset, // Store the entire dataset for the day
      color: dataset ? mapTemperatureToColor(dataset.temp_high, minTempHigh, maxTempHigh) : null,
    };
  });

  currentMonth.value = format(currentDate.value, 'MMMM yyyy');
};

// Function to get the temp_high value for a specific date
const getTempHighForDate = (date) => {
  const dataset = dataStore.overall_datasets.find((ds) => isSameDay(ds.date, date));
  return dataset ? dataset.temp_high : null;
};

const goToNextMonth = () => {
  currentDate.value = addMonths(currentDate.value, 1);
  generateCalendarDays();
};

const goToPreviousMonth = () => {
  currentDate.value = subMonths(currentDate.value, 1);
  generateCalendarDays();
};

const dayClass = (day) => {
  const current = day.dataset && day.dataset.is_valid && day.dataset.temp_high
  return {
    'text-gray-500': !day.inCurrentMonth,
    'bg-red-400': current >= 33,
    'bg-red-600': current >= 34,
    'bg-red-900': current >= 35,
    'bg-blue-500': current < 34,
    // 'contrast-text': day.color,
  };
};

const mapTemperatureToColor = (temperature, minTemp, maxTemp) => {
  // Adjust the saturation gradient based on your preferences
  const gradient = (temperature - minTemp) / (maxTemp - minTemp);
  const saturation = (1 - gradient) * 620;
  const hue = 200 - (gradient * 0.1);

  return `hsl(${hue}, ${saturation}%, 50%)`;
};

onMounted(() => {
  generateCalendarDays();
});


interface DataData{
  date: Date
}

let datetime: Date[] = [];
let sortedData = [] as DataData[]

const isLoading = ref(true)
watchEffect(async () => {
  isLoading.value = true;
  try {
    if (!dataStore.last_temperature) {
      await dataStore.fetchDataFromFirestore();
    }

    dataStore.overall_datasets.slice(-10).forEach((field, index) => {
      datetime = datetime.concat(field.date)
    })

    sortedData = datetime.map((date, index) => ({
      date
    })).sort((a, b) => b.date.getTime() - a.date.getTime());
  }catch (e){
    console.log(e)
  }finally {
    isLoading.value = false
  }
})

useHead({
  title: 'List view',
});

</script>
<template>
  <div class="text-gray-400">
      <client-only>

        <div class="calendar">
          <div class="header">
            <button @click="goToPreviousMonth">Previous Month</button>
            <h2>{{ currentMonth }}</h2>
            <button @click="goToNextMonth">Next Month</button>
          </div>

          <div class="grid grid-cols-7 gap-4 p-4 w-96 h-80">
            <!-- Weekday headers -->
            <div v-for="(day, index) in weekdays" :key="index" class="col-span-1 text-center font-bold">{{ day }}</div>

            <!-- Empty grid cells for days outside the current month -->
            <div v-for="day in emptyGridDays" :key="day" class="col-span-1"></div>

            <!-- Calendar days -->
            <div v-for="day in calendarDays" :key="day.date" class="col-span-1 text-center" :class="dayClass(day)" :style="{ backgroundColor: day.color }">
              <div>{{ day.day }}</div>
              <div v-if="day.dataset && day.dataset.temp_high !== null" class="text-sm text-white">{{ day.dataset.temp_high }}</div>
            </div>
          </div>
        </div>

      </client-only>
  </div>

</template>


