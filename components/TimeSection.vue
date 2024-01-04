<template>
  <div class="flex space-x-2 relative top-1.5 w-full">
    <div>
      <span class="text-3xl dark:text-gray-200">{{ currentTime }} {{ ampm }}</span>
    </div>
    <div class="self-end text-gray-500 relative -top-1.5 dark:text-gray-400">
      {{ currentDate }}
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted, onUnmounted} from 'vue';
import {format} from 'date-fns';

const currentTime = ref('');
const currentDate = ref('');
const ampm = ref('');

const updateTimeAndDate = () => {
  const now = new Date();

  currentTime.value = format(now, 'h:mm');
  ampm.value = format(now, 'a');

  currentDate.value = format(now, 'd MMM yyyy');
};

// Update time and date on component mount
onMounted(() => {
  updateTimeAndDate();

  // Update time and date every second
  const intervalId = setInterval(() => {
    updateTimeAndDate();
  }, 1000);

  // Clear the interval when the component is unmounted
  onUnmounted(() => {
    clearInterval(intervalId);
  });
});
</script>
