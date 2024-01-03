<script setup lang="ts">


</script>

<template>
  <div class="grid lg:grid-cols-8 xl:grid-cols-6 mb-12">
    <sidebar-info class="overflow-hidden hidden lg:block lg:col-span-2 xl:col-span-1"/>

    <div class="lg:col-span-6 xl:col-span-5" >
      <sidebar-info-mini class="lg:hidden"/>

      <main-chart/>

      <div class="grid lg:grid-cols-2 lg:grid-rows-2 [&>div]:card mt-4 gap-4">
        <div class="">
          <p class="ml-2">daily high and low temp</p>
        </div>
        <div class="">
          <p>daily high and low temp</p>
        </div>
        <div class="">
          <p>daily high and low temp</p>
        </div>
        <div class="">
          <p>daily high and low temp</p>
        </div>
      </div>

    </div>
  </div>

  <div class="p-4 flex justify-end">
    <a href="https://github.com/ekirianc/temperature-monitor-2 " target="_blank"
       class="dark:text-gray-400 dark:hover:text-gray-100 text-gray-600 hover:text-gray-900 block">
      <Icon name ="mdi:github" class="relative bottom-0.5" /> Github
    </a>
  </div>
</template>