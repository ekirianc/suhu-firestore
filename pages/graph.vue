<script setup>
import { useCollection, useFirestore } from 'vuefire'
import {DateTime} from 'luxon';
import 'chartjs-adapter-moment';

import {
  collection,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  getDocs, doc, setDoc,
} from 'firebase/firestore'

const db = useFirestore()

const addTemp = async () => {
  const epochTime = Math.floor(Date.now() / 1000);
  const docRef = doc(db, 'temperature', String(epochTime));
  await setDoc(docRef, {
    temp: rand(20,40).toFixed(2),
    humid: rand(50,100).toFixed(2),
    time: epochTime
  });
  console.log('Document written with ID: ', epochTime);
}

const removeTemp = async () => {
  // Get the last document in the collection
  const q = query(
      collection(db, 'temperature'),
      orderBy('time', 'desc'),
      limit(1)
  )
  const snapshot = await getDocs(q)

  // Delete the document
  if (!snapshot.empty) {
    const doc = snapshot.docs[0]
    await deleteDoc(doc.ref)
    console.log('Document deleted with ID: ', doc.id)
  }
}

const temps = useCollection(collection(db, 'temperature'))

function epochToUtcString(epochTime) {
  const date = new Date(epochTime * 1000);
  return date.toLocaleString('en-US', { timeZone: 'Asia/Singapore' });
}

</script>

<template>

  <div class="flex space-x-4 m-4">
    <button @click="addTemp" class="rounded-2xl bg-sky-500 p-4">
      add data
    </button>
    <button @click="removeTemp" class="rounded-2xl bg-red-500 p-4">
      Remove last
    </button>
  </div>

  <!--  <pre>{{temps}}</pre>-->

  <ul class="p-4">
    <li class="flex space-x-4" v-for="temp in temps" :key="temp.id">
      <span>{{ temp.temp }}</span>
      <span>{{ temp.humid }}</span>
      <span>{{ epochToUtcString(temp.time) }}</span>
    </li>
  </ul>
</template>
