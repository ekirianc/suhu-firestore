<template>

  <nav ref="nav" class="fixed mx-auto inset-x-0 md:w-1/4 md:mt-6 md:rounded-full bg-white top-0 z-50">
    <div class="px-8 p-2 [&>div>a]:p-4 grid grid-cols-3 text-gray-500">
      <div class=" text-4xl text-center"><nuxt-link to="/graph">
        <Icon name="tabler:graph" />
      </nuxt-link></div>
      <div class="text-4xl text-center"><nuxt-link to="/">
        <Icon name="iconamoon:home" />
      </nuxt-link></div>
      <div class="text-4xl text-center"><nuxt-link to="/all-data">
        <Icon name="fluent:table-offset-24-regular" />
      </nuxt-link></div>
    </div>
  </nav>
<!--  :style="{'margin-top':navH+'px'}"-->
  <div class="md:mx-20 mt-16 md:mt-0 mb-10">
    <div class="md:flex justify-between items-center py-6">
      <div class="text-center md:text-left">
        <time-sect/>
      </div>
      <div class="md:flex items-center hidden">
        <span>Hujan ringan</span>
        <img src="https://cdn2.iconfinder.com/data/icons/weather-365/64/weather-sun-cloud-rain-512.png" alt="" class="w-16 ml-4">
      </div>
    </div>

    <slot />

  </div>

</template>

<script setup>
import {onMounted} from "vue";

const nav = ref(0)
const navH = ref(0)
onMounted(() => {
  navH.value = nav.value.clientHeight + 24
})
</script>

<style scoped>
.router-link-exact-active{
  /*font-weight: bold;*/
  color: #449dde;
}
</style>