<template>
  <div class="flex">
    <div class="px-8 flex items-center">
      icon
    </div>
    <div class="grow ml-4 ">
      <div class="grid grid-cols-5 space-x-4 [&>div>div]:bg-[#EDF3F4] [&>div>div]:rounded-lg">
        <div class="[&>span]:px-6 bg-[#EDF3F4] flex justify-between items-center rounded-xl">
          <span>Total Day</span>
          <span class="text-4xl">167</span>
        </div>
        <div class="[&>div]:flex [&>div]:justify-between [&>div>span]:px-4 [&>div>span]:py-2 ">
          <div class="mb-2">
            <span >Avg. Temp</span>
            <span >31.05</span>
          </div>
          <div>
            <span>Avg. Humid</span>
            <span>31.05</span>
          </div>
        </div>
        <div class="[&>div]:flex [&>div]:justify-between [&>div>span]:px-4 [&>div>span]:py-2">
          <div class="mb-2">
            <span>35.8</span>
            <span>(3d ago)</span>
          </div>
          <div>
            <span>27.6</span>
            <span>(76d ago)</span>
          </div>
        </div>
        <div class="flex justify-between items-center px-4 bg-[#EDF3F4] rounded-xl">
          <span class="grid">
            <span>Correlation  </span>
            <span class="text-sm">(daily low & high)</span>
          </span>
          <span class="text-2xl">48.72 % </span>
        </div>
        <div class="flex items-center justify-center bg-gray-700 rounded-xl">
          <span class="text-4xl text-white">68%</span>
        </div>
      </div>
    </div>
  </div>
</template>