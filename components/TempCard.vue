<template>
  <div>
    <div class="text-center pt-10 pb-16 bg-sky-300">
      <div class="text-6xl">{{ temp }}°C</div>
      <div class="update">Last Update {{ update }} ({{ time }})</div>
    </div>
    <div class="relative">
      <progress-bar/>
    </div>
    <div class="flex justify-between p-8">
      <div class="[&>div]:mb-3">
        <div class="changes">Changes (in 3h) </div>
        <div class="humidity">Humidity </div>
        <div class="high">Highest ({{ highTime }}) </div>
        <div class="low">Lowest ({{ lowTime }}) </div>
      </div>
      <div class="text-right [&>div]:mb-3">
        <div class="changes"> {{ change }}</div>
        <div class="humidity">{{ humidity }}%</div>
        <div class="high">{{ high }}°C</div>
        <div class="low">{{ low }}°C</div>
      </div>
    </div>

  </div>
</template>

<script setup>
defineProps({
  temp: String,
  update: String,
  time: String,
  change: String,
  humidity: String,
  highTime: String,
  high: String,
  lowTime: String,
  low: String
})
</script>

