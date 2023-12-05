<template>
    <div class="w-full mx-auto p-4 flex items-center space-x-4 absolute top-[-4rem] z-0 ">
      <div class="w-1/2 h-5 bg-white border rounded-full mx-auto">
        <div :style="{ width: progress + '%' }" class="h-full bg-sky-500 rounded-full"></div>
      </div>
    </div>
</template>

<script setup>

// Define a ref to store the start time and assign it the current time initially
const startTime = ref(new Date());

// Define a ref to store the progress percentage
const progress = ref(0);

// Define a function to update the progress based on the elapsed time
const updateProgress = () => {
  // Get the current time
  const currentTime = new Date();

  // Calculate the elapsed time in milliseconds using the start time ref
  const elapsedTime = currentTime - startTime.value;

  // Calculate the progress percentage based on 10 seconds (10000 milliseconds)
  const percentage = Math.min((elapsedTime / 10000) * 100, 100);

  // Update the progress ref
  progress.value = percentage;

  // Reset the progress bar if it's full
  if (percentage === 100) {
    resetStartTime();
  }
};

// Define a variable to store the interval ID
let interval;

// Define a function to start the interval
const startInterval = () => {
  // Update the progress every second (1000 milliseconds)
  interval = setInterval(updateProgress, 1000);
};

// Define a function to stop the interval
const stopInterval = () => {
  // Clear the interval
  clearInterval(interval);
};

// Define a function to reset the start time to the current time
const resetStartTime = () => {
  // Assign the current time to the start time ref
  startTime.value = new Date();
};

// Use the onMounted hook to start the interval when the component is mounted
onMounted(() => {
  startInterval();
});

// Use the onUnmounted hook to stop the interval when the component is unmounted
onUnmounted(() => {
  stopInterval();
});

// Use the onUpdated hook to check if the progress has reached 100% and call th
</script>
