<template>

  <nav class="p-4">
    <div class="flex space-x-4 content-center">
      <nuxt-link to="/" class="px-4 py-3 dark:text-white"><icon name="ion:arrow-back"/></nuxt-link>
      <nuxt-link to="/chart" class="px-4 py-3 bg-white rounded-2xl text-pink-600">
        <icon name="lucide:line-chart" class="text-xl"/>
      </nuxt-link>
      <nuxt-link to="/list" class="px-4 py-3 bg-white rounded-2xl text-pink-600">
        <icon name="fluent:apps-list-detail-20-regular" class="text-2xl"/>
      </nuxt-link>

      <button @click="toggleDark()" class="dark:text-gray-400 dark:hover:text-gray-100 text-gray-600 hover:text-gray-900">
        <span class="rounded-full border border-transparent hover:border-gray-400 transition-all px-3 py-1">
          <span v-if="isDark"> <icon name="tabler:moon" class="text-xl relative bottom-0.5"/> </span>
          <span v-else> <icon name="tabler:sun" class="text-xl relative bottom-0.5"/> </span>
          <span class="ml-2 ">{{ isDark ? 'Dark' : 'Light' }}</span>
        </span>
      </button>

    </div>
  </nav>
<!--  :style="{'margin-top':navH+'px'}"-->
  <div class="md:mx-20 md:mt-0 mb-10">

    <slot />

  </div>

</template>

<script setup lang="ts">

  const isDark = useDark()
  const toggleDark = useToggle(isDark)

</script>

<style scoped>
.router-link-exact-active{
  /*font-weight: bold;*/
  color: white;
  background-color: #FA6892;
  box-shadow: 0 0.444px 0.53px 0 rgba(255, 23, 90, 0.08), 0 1.946px 1.761px 0 rgba(255, 23, 90, 0.10), 0 4.889px 4.301px 0 rgba(255, 23, 90, 0.11), 0 9.997px 9.52px 0 rgba(255, 23, 90, 0.13), 0 19.028px 21.273px 0 rgba(255, 23, 90, 0.16), 0 41px 55px 0 rgba(255, 23, 90, 0.23);

}
</style>