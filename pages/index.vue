

<template>
  <div class="p-4 mb-32 md:pr-8">
    <!--  Time  -->
    <div class="md:flex justify-between items-center">
      <div class="text-center md:text-left">
        <time-sect/>
      </div>
      <div class="md:flex items-center hidden">
        <span>Hujan ringan</span>
        <img src="https://cdn2.iconfinder.com/data/icons/weather-365/64/weather-sun-cloud-rain-512.png" alt="" class="w-16 ml-4">
      </div>
    </div>


    <!--    content Wraper -->
    <div class="flex flex-col">
      <div class="md:flex flex-row md:space-x-4 mt-8">
        <!--  Temperature Card-->
        <div class="md:basis-1/4 bg-white rounded-3xl overflow-hidden">
          <temp-card temp="32.3"
                     update="3m"
                     time="05:09 PM"
                     change="0.4"
                     humidity="80"
                     high="34.1"
                     highTime="2m"
                     low="29.9"
                     lowTime="6h"
          />
        </div>

        <!--  Graph view-->
        <div class="md:basis-3/4 md:m-0 mt-4 p-4 bg-white rounded-3xl md:block">
          <div class="h-full">
            <Line :data="chartData" :options="chartOptions" />
          </div>
        </div>

      </div>

      <div class="mt-4 p-4 bg-white rounded-3xl hidden md:block">
        <calculation-card/>
      </div>
    </div>


  </div>


</template>

<script lang="ts" setup>
import { Line } from 'vue-chartjs';
import { ref } from 'vue';
// import { months, numbers } from '~/assets/js/chartjs-utils';

interface ChartData {
  x: number;
  y: number;
}

const data: ChartData[] = [];
const data2: ChartData[] = [];
let prev = 29;
let prev2 = 80;

for (let i = 0; i < 100; i++) {
  prev += 5 - Math.random() * 10;
  data.push({ x: i, y: prev });
  prev2 += 5 - Math.random() * 10;
  data2.push({ x: i, y: prev2 });
}

// const labels = months({ count: 7 });

const chartData = ref({
  // labels: labels,
  datasets: [
    {
      label: 'Temperature',
      borderColor: `#da3447`,
      borderWidth: 2,
      radius: 0,
      tension: 0.3,
      data: data,
      yAxisID: 'y',
    },
    {
      label: 'Humidity',
      borderColor: `#347cda`,
      borderWidth: 2,
      radius: 0,
      tension: 0.3,
      data: data2,
      yAxisID: 'y1',
    },
  ],
});

const totalDuration = 500;
const delayBetweenPoints = totalDuration / data.length;

const previousY = (ctx: any) =>
    ctx.index === 0
        ? ctx.chart.scales.y.getPixelForValue(100)
        : ctx.chart
            .getDatasetMeta(ctx.datasetIndex)
            .data[ctx.index - 1].getProps(['y'], true).y;

const animation = {
  x: {
    type: 'number',
    easing: 'linear',
    duration: delayBetweenPoints,
    from: NaN, // the point is initially skipped
    delay(ctx: any) {
      if (ctx.type !== 'data' || ctx.xStarted) {
        return 0;
      }
      ctx.xStarted = true;
      return ctx.index * delayBetweenPoints;
    },
  },
  y: {
    type: 'number',
    easing: 'linear',
    duration: delayBetweenPoints,
    from: previousY,
    delay(ctx: any) {
      if (ctx.type !== 'data' || ctx.yStarted) {
        return 0;
      }
      ctx.yStarted = true;
      return ctx.index * delayBetweenPoints;
    },
  },
};

const DISPLAY = true;
const BORDER = true;
const CHART_AREA = true;
const TICKS = true;

const chartOptions = ref({
  animation,
  stacked: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: true,
    }
  },
  scales: {
    x: {
      type: 'linear',
      border: {
        display: BORDER
      },
      grid: {
        display: DISPLAY,
        drawOnChartArea: CHART_AREA,
        drawTicks: TICKS,
      }
    },
    y: {
      type: 'linear',
      display: BORDER,
      grid: {
        color: function(context:any) {
          if (context.tick.value == 30) {
            return '#000000';
          } else {
            return `#f3f3f3`
          }
        }
      },
      y1: {
        type: 'linear',
        display: BORDER,
        grid: {
          drawOnChartArea: false, // only want the grid lines for one axis to show up
        },
      }
    }
  },
  responsive: true,
  maintainAspectRatio: false,
});

</script>