<script setup lang="ts">

import {useFirestore} from "vuefire";
import {collection, doc, getDoc, } from "firebase/firestore";
import {format, isToday} from "date-fns";
import type {CalendarDays} from "~/composables/types";

const props = defineProps<CalendarDays>()
const dataset = ref(props.dataset)
const datetime = ref(props.datetime)

const emits = defineEmits();

const handleClick = async (_dataset:any ,_datetime: any) => {
  const formattedDateEmit = ref(format(_datetime, "dd MMMM yyyy"))

  if (_dataset){
    try {
      const db = useFirestore();

      const formattedDate = format(_datetime, 'yyyy-MM-dd');

      const dailyRef = doc(collection(db, 'dailyRecords'), formattedDate);

      // Use getDoc to fetch the initial data
      const docSnapshot = await getDoc(dailyRef);
      const data = docSnapshot.data();

      if (data?.today_entries){
        const times = data.today_entries.time
        const temperature = data.today_entries.temp
        const humidity = data.today_entries.humid

        if (times.length >= 2 && times[times.length - 1] === "12:00 AM") {
          // Remove the last occurrence of "12:00 AM"
          times.pop(); temperature.pop(); humidity.pop();
        }
        emits('update:selectedEntries', data);

      }else {
        emits('update:selectedEntries', formattedDateEmit.value);
      }

    } catch (error) {
      console.error(error);
    }
  }else {
    emits('update:selectedEntries', formattedDateEmit.value);
  }
};

</script>

<template>
  <div class="text-center text-gray-800 dark:text-gray-100 dark:bg-zinc-800 bg-zinc-100 border-b dark:border-b-zinc-600">
    <div  @click="handleClick(dataset, datetime)" class="relative w-12 h-12 flex flex-col border border-transparent dark:hover:bg-neutral-600 hover:bg-neutral-200 cursor-pointer">
      <div v-if="isToday(datetime)" class="w-full h-[calc(100%+3rem*6)] absolute shadow-2xl bg-gray-100/10 z-20 scale-x-105 hover:bg-gray-400/10"/>
      <div v-else class="w-full h-[calc(100%+3rem*6)] absolute scale-x-105 hover:bg-gray-400/10 z-30"></div>
      <span>{{ format(datetime, 'd') }}</span>
      <span class="text-sm ">{{ format(datetime, 'E') }}</span>
    </div>
  </div>
</template>

<style scoped>

</style>