<template>

  <nav ref="nav" class="fixed m-4 bg-white rounded-3xl shadow-xl w-[calc(100%-2rem)] bottom-0 border-2
              md:flex md:w-20 md:h-[calc(100vh-2rem)] md:border-0">
    <div class="px-8 md:p-4 my-auto [&>div]:my-8 [&>div>a]:p-4 flex md:block justify-between">
      <div><nuxt-link to="/">H</nuxt-link></div>
      <div><nuxt-link to="/graph">G</nuxt-link></div>
      <div><nuxt-link to="/all-data">D</nuxt-link></div>
    </div>
  </nav>

  <div class="md:pl-28 pt-4" :style="{'margin-bottom':navH+'px'}">
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
  font-weight: bold;
}
</style>