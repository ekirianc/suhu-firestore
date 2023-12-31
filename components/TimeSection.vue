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
import { ref, onMounted, onUnmounted } from 'vue';

const currentTime = ref('');
const currentDate = ref('');
const ampm = ref('');

const updateTime = () => {
  const date = new Date();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  ampm.value = hours >= 12 ? 'PM' : 'AM';
  currentTime.value = `${hours % 12}:${minutes < 10 ? '0' : ''}${minutes}`;
};

const updateDate = () => {
  const date = new Date();
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  currentDate.value = `${day} ${month} ${year}`;
};

// Update time and date on component mount
onMounted(() => {
  updateTime();
  updateDate();
  // Update time every second (adjust the interval as needed)
  const intervalId = setInterval(updateTime, 1000);

  // Clear the interval when the component is unmounted
  onUnmounted(() => {
    clearInterval(intervalId);
  });
});
</script>
