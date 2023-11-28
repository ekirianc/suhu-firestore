<template>
  <div class="grid">
    <div>
      <span class="text-4xl">{{ currentTime }}</span>
      <span class="text-2xl text-gray-400 ml-2">{{ampm}}</span>
    </div>
    <div>
      {{ currentDate }}
    </div>
  </div>
</template>

<script setup>
const currentTime = ref('');
const currentDate = ref('');
const ampm = ref('');

setInterval(() => {
  const date = new Date();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  ampm.value = date.getHours() >= 12 ? 'PM' : 'AM';
  currentTime.value = `${hours % 12}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  currentDate.value = `${day} ${month} ${year}`;
}, 1000);

</script>
