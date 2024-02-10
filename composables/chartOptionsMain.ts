// noinspection JSUnusedGlobalSymbols

import type {Context} from "chartjs-plugin-datalabels";

const totalDuration = 200;
const delayBetweenPoints = totalDuration / 200;
export const animation = {
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
    }
  },
};

export const annotation = (mode?: number, color?: string)=>{
  // use 1 for hourly data
  let interval = mode === 1 ? 60 : 5;
  return {

    type: 'line',
    borderColor: color ? color : 'black',
    borderWidth: 1,
    label: {
      display: true,
      content: 'last',
      position: 'end'
    },
    display: (ctx: any) => ctx.chart.isDatasetVisible(1),
    scaleID: 'x',
    value: (ctx: any) => {
      // return datetime (label)
      let data = []
      if (ctx.chart.data.datasets[1]){
        data = ctx.chart.data.datasets[1].data;
      }
      const currentDate = new Date();

      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i] !== null) {
          // expanded data has null data after last data if it below 288 data point
          const timeInterval = i * interval * 60 * 1000; // in milliseconds

          currentDate.setHours(0, 0, 0, 0);
          currentDate.setTime(currentDate.getTime() + timeInterval);
          return currentDate
        }
      }
    }
  }
};

const SIMPLE_MODE = 'simpleEnabled'
const SHOW_LABEL = 'labelEnabled'
export function customFormatter(value: number, ctx: Context) {
  // only show label on temperature when timerange is "1"
  if (localStorage.getItem(SIMPLE_MODE) === 'true' &&
      localStorage.getItem(SHOW_LABEL) === 'true' &&
      ctx.datasetIndex === 1 &&
      ctx.dataIndex % 2 !== 0 && // show once every 2 point
      localStorage.getItem('timerangeIsOne') === 'true'
  ){
    return value.toFixed(1)
  } else {
    return null
  }
}

const zoomOptions = {
  pan: {
    enabled: true,
    mode: 'x',
  },
  zoom: {
    wheel: {
      enabled: false,
    },
    pinch: {
      enabled: false
    },
    mode: 'x',
  },
  limits: {
    x: {min: 'original', max: 'original'},
  },

}

export const chartOptionsMain = ref({
  // Chart options configuration
  animation: {},
  stacked: false,
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false,
  },
  scales: {
    x: {
      type: 'time',
      display: true,
      time: {
        // Luxon format string
        tooltipFormat: '', // seted on onMounted in chart and calendar
        displayFormats: {
          calendarDays: 'DD MMM',
          hour: 'hh A',
          minute: 'HH:mm',
        }
      },
      ticks: {
        autoSkip: true,
        autoSkipPadding: 20,
        maxRotation: 0,
        color: '',
        major: {
          enabled: true
        },
        font: function(context: any) {
          if (context.tick && context.tick.major) {
            return {
              weight: 'bold',
            };
          }
        }
      },
      grid: {},
    },
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      grid: {},
      ticks: {}
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      grid: {
        drawOnChartArea: false, // only want the grid lines for one axis to show up
      },
      ticks: {}
    },
  } as any,
  plugins: {
    zoom: zoomOptions,
    legend: {
      display: false,
    },
    annotation: {
      drawTime: 'afterDraw',
      annotations: {}
    },
    tooltip: {
      animation: false,
      usePointStyle: true,
      itemSort: function(a: {raw: number}, b: {raw: number}) {
        return b.raw - a.raw;
      },
      callbacks: {
        // footer: footer,
        labelPointStyle: function() {
          return {
            pointStyle: 'circle',
            rotation: 0
          };
        },
        labelColor: function(context: any) {
          return {
            borderColor: context.dataset.borderColor,
            backgroundColor: context.dataset.borderColor,
          };
        },
      }
    },
    htmlLegend: {
      // ID of the container to put the legend in
      containerID: 'legend-container',
    },
    datalabels: {
      backgroundColor: function(context: any) {
        return context.dataset.borderColor;
      },
      borderRadius: 4,
      color: 'white',
      font: {
        weight: 'bold'
      },
      formatter: customFormatter,
      // formatter: (value, ctx) => ctx.datasetIndex === 1 ? value: '',
      // padding: 6
    }
  },
  onClick(e: any) {
    const chart = e.chart;
    chart.options.plugins.zoom.zoom.wheel.enabled = !chart.options.plugins.zoom.zoom.wheel.enabled;
    chart.options.plugins.zoom.zoom.pinch.enabled = !chart.options.plugins.zoom.zoom.pinch.enabled;

    chart.update();
  }
});



