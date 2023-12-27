import type {Context} from "chartjs-plugin-datalabels";

interface YAxis {
  type: string;
  display: boolean;
  position: string;
  grid: {
    color: (context: any) => string;
  };
  max?: number; // Optional 'max' property
}

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

export const annotation = (mode: number)=>{
  // use 1 for hourly data
  let interval = mode === 1 ? 60 : 5;
  return {

    type: 'line',
    borderColor: 'black',
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
      const data = ctx.chart.data.datasets[1].data;
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
  if (localStorage.getItem(SIMPLE_MODE) === 'true' &&
      localStorage.getItem(SHOW_LABEL) === 'true' &&
      ctx.datasetIndex === 1 &&
      ctx.dataIndex % 2 !== 0 &&
      localStorage.getItem('timerangeIsOne') === 'true'
  ){
    return value
  } else {
    return null
  }
}

export const chartOptions = ref({
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
        tooltipFormat: 'DD MMM hh:mm a',
        displayFormats: {
          day: 'DD MMM',
          hour: 'hh A',
          minute: 'HH:mm',
        }
      },
      ticks: {
        autoSkip: true,
        autoSkipPadding: 20,
        maxRotation: 0
      },
    },
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      grid: {
        color: function(context:any) {
          if (context.tick.value == 30) {
            return '#2f2f2f';
          } else if(context.tick.value == 34){
            return '#2f2f2f';
          } else {
            return `#d5d5d5`
          }
        }
      },
    } as YAxis,
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      grid: {
        drawOnChartArea: false, // only want the grid lines for one axis to show up
      },
    },
  },
  plugins: {
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
      callbacks: {
        // footer: footer,
        labelPointStyle: function(context: any) {
          return {
            pointStyle: 'circle',
            rotation: 0
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
        return context.dataset.backgroundColor;
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
    // paddingBelowLegends: true
    // customCanvasBackgroundColor: {
    //   color: '#343434',
    // }

  },
});



