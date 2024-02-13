<script setup lang="ts">

import { useDataStore } from "~/store";
import {toggleColorMode} from "~/composables/colorModeUtils";
import {windowSize} from "~/composables/windowSize";

const isDark = useDark()
const toggleDark = useToggle(isDark)
const colorMode = useColorMode()
const dataStore = useDataStore()

const toggleColorModeHandler = () => {
  toggleColorMode(colorMode);
  toggleDark();
};

onKeyStroke('1', () => { navigateTo('/chart') })
onKeyStroke('2', () => { navigateTo('/calendar') })
onKeyStroke('`', () => { navigateTo('/') })
const keys = useMagicKeys()
const toggleDarkShortcut = keys['Shift+Ctrl+L']

watch(toggleDarkShortcut, (v) => {
  if (v) toggleColorModeHandler()
})

const hoverColor = ref('#fd3871')

const route = useRoute()

const activeRoute = ref()
const isCalendarRoute = ref()
watchEffect(() => {
  activeRoute.value = route.path
  isCalendarRoute.value = dataStore.activeRoute === '/calendar'
})
const setActive = (_route: string) => {
  activeRoute.value = _route
}
setActive(activeRoute.value)

const { isSmallScreen } = windowSize()
let _isSmallScreen

onMounted(() => {
  _isSmallScreen = isSmallScreen
  isCalendarRoute.value = route.path
})


</script>

<template>

  <nav class="flex space-x-4 lg:grid-cols-8"
       :class="{'lg:grid xl:grid-cols-6' : !isCalendarRoute, 'p-2': _isSmallScreen, 'p-4': !_isSmallScreen}">

    <div class="content-center lg:col-span-2 xl:col-span-1 w-full md:w-auto justify-between flex">

      <div class="flex space-x-2">
        <nuxt-link to="/"
                   class="dark:text-white rounded-xl border border-transparent dark:hover:border-gray-600">
          <span class="flex items-center h-full w-11">
            <icon name="ion:arrow-back" class="text-xl w-full"/>
          </span>
        </nuxt-link>
        <nuxt-link to="/chart" @click="setActive(route.path)"
                   class="bg-white rounded-xl text-pink-600 dark:bg-gray-600 dark:text-white hover:bg-primary dark:hover:bg-primary hover:text-white">
          <span class="flex items-center h-full px-1 py-3">
            <icon name="lucide:line-chart" class="text-xl w-10 "/>
            <span v-if="activeRoute === '/chart'" class="mr-3">Chart</span>
          </span>
        </nuxt-link>
        <nuxt-link to="/calendar" @click="setActive(route.path)"
                   class="bg-white rounded-xl text-pink-600 dark:bg-gray-600 dark:text-white hover:bg-primary dark:hover:bg-primary hover:text-white">
          <span class="flex items-center h-full px-1 py-3">
            <icon name="solar:calendar-linear" class="text-xl w-10 "/>
            <span v-if="activeRoute === '/calendar'" class="mr-3" >Calendar</span>
          </span>
        </nuxt-link>
      </div>

      <button @click="toggleColorModeHandler()" class="block md:hidden dark:text-gray-400 dark:hover:text-gray-100 text-gray-600 hover:text-gray-900">
        <span class="rounded-full border border-transparent hover:border-gray-400 transition-all p-3">
          <span v-if="isDark"> <icon name="tabler:moon" class="text-xl relative bottom-0.5"/> </span>
          <span v-else> <icon name="tabler:sun" class="text-xl relative bottom-0.5"/> </span>
        </span>
      </button>

    </div>

    <div class="w-full hidden md:block lg:col-span-6 lg:pl-6 xl:col-span-5 transition-all duration-300"
         :class="{'xl:pl-8 lg:pr-20' : !isCalendarRoute}">
      <div class="flex justify-between h-full items-center">

        <clock/>

        <div class="flex w-full justify-end dark:text-gray-300 text-gray-600">
          <!--<button class=" dark:hover:text-gray-100 mr-2 hover:text-gray-900">-->
          <!--  <span class="rounded-full border border-transparent hover:border-gray-600 p-3">-->
          <!--    <span> <icon name="solar:settings-linear" class="text-xl relative bottom-0.5"/> </span>-->
          <!--  </span>-->
          <!--</button>-->
          <button @click="toggleColorModeHandler()" class=" dark:hover:text-gray-100 mr-4 hover:text-gray-900">
            <span class="rounded-full border border-transparent hover:border-gray-600 p-3">
              <span v-if="isDark"> <icon name="tabler:moon" class="text-xl relative bottom-0.5"/> </span>
              <span v-else> <icon name="tabler:sun" class="text-xl relative bottom-0.5"/> </span>
            </span>
          </button>
          <day-progress-bar class="w-2/3 hidden lg:block"/>
        </div>
      </div>
    </div>

  </nav>
  <div class="md:mt-0 mb-10">

    <slot />

  </div>

</template>

<style scoped>
.router-link-exact-active{
  /*font-weight: bold;*/
  color: white;
  background-color: #FA6892;
  box-shadow: 0 0.444px 0.53px 0 rgba(255, 23, 90, 0.08), 0 1.946px 1.761px 0 rgba(255, 23, 90, 0.10), 0 4.889px 4.301px 0 rgba(255, 23, 90, 0.11), 0 9.997px 9.52px 0 rgba(255, 23, 90, 0.13), 0 19.028px 21.273px 0 rgba(255, 23, 90, 0.16), 0 41px 55px 0 rgba(255, 23, 90, 0.23);

}
.router-link-exact-active:hover{
  background-color: v-bind(hoverColor);
}
</style>