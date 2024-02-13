<script setup lang="ts">

import {format, isToday} from "date-fns";
import type {CalendarDays} from "~/types";

const props = defineProps<CalendarDays>()
let datetime = props.datetime
watchEffect(()=>{
  datetime = props.datetime
})

</script>

<template>
  <div class="text-center text-gray-800 dark:text-gray-100 dark:bg-zinc-800 bg-zinc-100 border-b dark:border-b-zinc-600">
    <div class="relative w-12 h-12 flex flex-col border border-transparent dark:hover:bg-neutral-600 hover:bg-neutral-200 cursor-pointer">
      <!-- highlight today date -->
      <div v-if="isToday(datetime)" class="w-full h-[calc(100%+3rem*6)] absolute shadow-2xl bg-gray-100/10 z-20 scale-x-105 hover:bg-gray-400/10"/>

      <div v-else class="w-full h-[calc(100%+3rem*6)] absolute scale-x-105 hover:bg-gray-300/20 z-30"></div>
      <span>{{ format(datetime, 'd') }}</span>
      <span class="text-sm ">{{ format(datetime, 'E') }}</span>
      <!--active-->
      <div class="opacity-0 absolute left-0 top-0 bg-slate-200/20 border border-slate-500 dark:border-slate-500 z-20 w-full h-[calc(100%+3rem*6)] scale-x-105 shadow-2xl"
           :class="{'opacity-100': props.isActive}"></div>
    </div>
  </div>
</template>

<style scoped>

</style>