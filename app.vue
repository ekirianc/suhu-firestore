<template>
  <NuxtLayout>
    <nuxt-page/>
  </NuxtLayout>
</template>

<script setup lang="ts">

import {useDataStore} from "~/store";

const dataStore = useDataStore()
await useAsyncData('firestore', () => dataStore.fetchDataFromFirestore())

useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - Temperature Monitor 2` : 'Temperature Monitor 2';
  }
})
</script>