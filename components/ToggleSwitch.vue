<!-- components/ToggleSwitch.vue -->

<template>
  <div :class="{'cursor-not-allowed': isDisabled}">
    <label class="inline-flex items-center cursor-pointer">
      <span class="relative top-1 group">
        <!--  switch body  -->
        <span
            class="block w-14 h-8 bg-gray-200 rounded-full transition-shadow transform dark:bg-gray-600"
            :class="{ 'bg-primary dark:bg-primary-dark group-hover:bg-primary-2 ': isChecked,
                      'group-hover:border-2 group-hover:border-gray-500': (!isChecked && !isDisabled),
                      'cursor-not-allowed bg-gray-100 border-gray-200 dark:bg-gray-800': isDisabled }"
        ></span>
        <!-- switch inner-->
        <span
            class="absolute top-1 left-1 w-6 h-6 bg-gray-400/70 rounded-full transition-transform transform"
            :class="{ 'translate-x-6 bg-white': isChecked,
                       'group-hover:bg-gray-500 dark:group-hover:bg-gray-300 ': (!isChecked && !isDisabled),
                      'bg-gray-300 cursor-not-allowed': isDisabled }"
        ></span>
      </span>
      <input
          type="checkbox"
          v-model="isChecked"
          class="opacity-0 w-0 h-0"
          :disabled="isDisabled"
          @change="$emit('toggle', isChecked)"
      />
    </label>
<!--    <span class="relative -top-2 ml-3 text-gray-700">{{ isChecked ? 'Stacked' : 'Series' }}</span>-->
    <span class="relative -top-2 ml-3" v-if="props.label"
          :class="[{'text-zinc-400 dark:text-zinc-500': isDisabled}, 'text-zinc-700 dark:text-zinc-100']">{{ label }}</span>
  </div>
</template>

<script setup>
// Define the reactive property
const isChecked = ref(false);

const props = defineProps({
  label: String,
  isDisabled: Boolean,
  defaultToggle: Boolean
});

onMounted(()=>{
  isChecked.value = props.defaultToggle
})

watch([() => props.defaultToggle], ([defaultToggle]) => {
  isChecked.value = defaultToggle
})

</script>
