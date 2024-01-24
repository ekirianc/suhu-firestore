<script setup lang="ts">

import {useFirestore} from "vuefire";
import {collection, doc, getDoc, } from "firebase/firestore";
import {format, isToday} from "date-fns";

const props = defineProps({
  day: Array,
})
const emits = defineEmits();

const handleClick = async (day: any) => {
  const formattedDateEmit = ref(format(day.datetime, "dd MMMM yyyy"))

  if (day.dataset){
    try {
      const db = useFirestore();

      const formattedDate = format(day.datetime, 'yyyy-MM-dd');

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
  <div v-for="day in props.day" :key="day.datetime" class="text-center text-gray-800 dark:text-gray-100">
    <div  @click="handleClick(day)" class="relative w-12 h-12 flex flex-col border border-transparent dark:hover:bg-neutral-600 hover:bg-neutral-200 cursor-pointer">
      <div v-if="isToday(day.datetime)" class="w-full h-[calc(100%+3rem*6)] absolute shadow-2xl bg-gray-100/10 z-20 scale-x-105 hover:bg-gray-400/10"/>
      <div v-else class="w-full h-[calc(100%+3rem*6)] absolute scale-x-105 hover:bg-gray-400/10 z-20"></div>
      <span>{{ day.date }}</span>
      <span class="text-sm ">{{ day.day }}</span>
    </div>
  </div>
</template>

<style scoped>

</style>