<script setup lang="ts">
const prop = defineProps({
  message: String
})
</script>

<template>
  <div class="bg-red-500 text-white absolute top-0 left-0 w-full p-2 text-center ">
    {{ prop.message }}
  </div>
</template>

<style scoped>

</style>