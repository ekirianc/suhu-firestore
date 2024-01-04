<template>
  <div class="flex flex-col">
    <div class="overflow-x-auto">
      <div class="align-middle inline-block min-w-full sm:px-6 lg:px-8">
        <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Temperature
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Humidity
              </th>
            </tr>
            </thead>
<!--            <tbody class="bg-white divide-y divide-gray-200">-->
<!--            <tr v-for="(data, index) in jsonData" :key="index">-->
<!--              <td class="px-6 py-4 whitespace-nowrap">-->
<!--                <div class="text-sm text-gray-900">{{ data.date }}</div>-->
<!--              </td>-->
<!--              <td class="px-6 py-4 whitespace-nowrap">-->
<!--                <div class="text-sm text-gray-900">{{ data.hourly_temp[Object.keys(data.hourly_temp).pop()] }}</div>-->
<!--              </td>-->
<!--              <td class="px-6 py-4 whitespace-nowrap">-->
<!--                <div class="text-sm text-gray-900">{{ data.hourly_humid[Object.keys(data.hourly_temp).pop()] }}</div>-->
<!--              </td>-->
<!--            </tr>-->
<!--            </tbody>-->
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {useFirestore} from "vuefire";
import {collection, getDocs, limit, query, orderBy} from "firebase/firestore";

useHead({
  title: 'List view',
});
interface Data {
  date: number;
  hourly_temp: string;
  hourly_humid: string;
}
//
// const db = useFirestore()
//
// const jsonData = ref<Data[]>([]);
//
// onMounted(async () => {
//   try {
//     const q = query(collection(db, 'temperature'),
//         orderBy('date', 'desc'),
//         limit(3)
//     )
//     const querySnapshot  = await getDocs(q);
//
//     jsonData.value = querySnapshot.docs.map((doc) => doc.data() as Data);
//   } catch (error) {
//     console.error("Error fetching data from Firebase:", error);
//   }
// });
</script>
