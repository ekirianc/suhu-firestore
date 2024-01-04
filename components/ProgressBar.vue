<template>
  <div class="flex">
    <div class="w-full h-10 rounded-xl text-gray-400 relative border-l-2 border-r-2 border-slate-500 dark:bg-gray-900 bg-slate-200">
      <div :style="{ width: progress + '%' }" class="h-full bg-slate-300 rounded-xl flex items-center pl-4 dark:bg-slate-800 transition-all duration-500 ease-out"></div>
      <div class="text-slate-600 dark:text-slate-300 ">
        <span class="absolute top-2 left-4">{{progress.toFixed(2)}}%</span>
        <div v-if="dataFetched" :style="{left: sunrisePercentage + '%'}" class="absolute top-1.5 h-2/3 w-1 bg-gray-400 rounded-full">
          <Icon name="line-md:sun-rising-loop" class="ml-2 text-xl"/>
        </div>
        <div v-if="dataFetched" :style="{left: sunsetPercentage + '%'}" class="absolute top-1.5 h-2/3 w-1 bg-gray-400 rounded-full">
          <Icon name="line-md:moon-loop" class="ml-2 text-xl"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import moment from "moment-timezone";

const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);

const progress = ref(0);
const totalMillisecondsInDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const updateProgress = () => {
  const currentTime = new Date();
  const elapsedMilliseconds = currentTime - startOfDay;

  progress.value = Math.min((elapsedMilliseconds / totalMillisecondsInDay) * 100, 100)
};

let interval;

const startInterval = () => {
  interval = setInterval(updateProgress, 1000);
};

const stopInterval = () => {
  clearInterval(interval);
};

onMounted(() => {
  fetchData();
  startInterval();
});

onUnmounted(() => {
  stopInterval();
});

const dataFetched = ref(false);
const sunsetPercentage = ref()
const sunrisePercentage = ref()

const fetchData = async () => {
  try {
    const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=0.59&longitude=117&hourly=temperature_2m&daily=sunrise,sunset&timezone=Asia%2FSingapore');
    const responseData = await response.json();

    const today = moment().format('YYYY-MM-DD')
    const todayIndex = responseData.daily.time.indexOf(today);
    const sunsetTime = new Date(responseData.daily.sunset[todayIndex]).getTime();
    const sunriseTime = new Date(responseData.daily.sunrise[todayIndex]).getTime();

    const timeUntilSunset = sunsetTime - startOfDay;
    sunsetPercentage.value = Math.min((timeUntilSunset / totalMillisecondsInDay) * 100, 100);

    const timeUntilSunrise = sunriseTime - startOfDay;
    sunrisePercentage.value = Math.min((timeUntilSunrise / totalMillisecondsInDay) * 100, 100);

    // Set the dataFetched variable to true after successful data fetch
    dataFetched.value = true;
  } catch (error) {
    console.error('Error fetching data:', error);
    // Handle errors if needed
  }
};


</script>
