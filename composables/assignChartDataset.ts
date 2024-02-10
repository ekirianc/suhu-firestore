const chartColor = [
  '#fa4183', '#F7D060', '#8ADAB2', '#6e8fe1',
  '#e0adfa', '#9BB8CD', '#B6BBC4'
];
const skipped = (ctx: any, value: any) => ctx.p0.skip || ctx.p1.skip ? value : undefined;

const bgColor = (context: any) => {
  const bgColor = [
    'rgba(255,26,104,0.16)',
    'rgba(255,255,255,0)',
  ]
  if(!context. chart. chartArea) {
    return;
  }
  const {ctx, data, chartArea: {top, bottom}} = context.chart;
  const gradientBg = ctx.createLinearGradient(0, top, 0, bottom);
  gradientBg.addColorStop(0, bgColor[0])
  gradientBg.addColorStop(1, bgColor[1])
  return gradientBg;
}

// Single day / Series OFF
export const assignHumidityDataset = (data: (number | null)[]) => {
  return {
    label: 'Humidity',
    data: data,
    borderColor: '#b4c4d0',
    borderWidth: 2,
    radius: 0,
    yAxisID: 'y1',
    spanGaps: true,
    segment: {
      borderDash: (ctx: any) => skipped(ctx, [6, 6]),
    },
  }
};

export const assignTemperatureDataset = (label: string, data: (number | null)[] , index: number) => {
  return {
    label: label,
    data: data,
    borderColor: chartColor[index],
    backgroundColor: bgColor,
    borderWidth: 2,
    radius: 0,
    yAxisID: 'y',
    spanGaps: true,
    segment: {
      borderDash: (ctx: any) => skipped(ctx, [6, 6]),
    },
  }
}

export const assignAverageDataset = (data: (number | null)[]) => {
  return {
    label: 'all time Average',
    data: data,
    borderWidth: 2,
    borderColor: '#1d8eff',
    radius: 2,
    yAxisID: 'y',
    spanGaps: true,
    borderDash: [5, 5],
  }
};
export const assignSimpleTempDataset = (label: string, data: (number | null)[], index: number) => {
  return {
    label: label,
    data: data,
    borderWidth: 2,
    borderColor: chartColor[index],
    // backgroundColor: chartColor[index],
    backgroundColor: bgColor,
    radius: 2,
    yAxisID: 'y',
    spanGaps: true,
    tension: 0.4,
    datalabels: {
      align: 'end',
      anchor: 'end'
    },
    segment: {
      borderDash: (ctx: any) => skipped(ctx, [6, 6]),
    },
    fill: false
  }
};

export const assignSimpleHumidDataset = (data: (number | null)[]) => {
  return {
    label: "humidity",
    data: data,
    borderWidth: 2,
    borderColor: `#bacddc`,
    radius: 2,
    yAxisID: 'y1',
    spanGaps: true,
    tension: 0.4,
    segment: {
      borderDash: (ctx: any) => skipped(ctx, [6, 6]),
    },
  }
};

// Series ON
export const assignDatasets = (tempData: (number | null)[] | undefined, humidData: (number | null)[] | undefined, ) => {
  return [
    {
      label: "temperature",
      data: tempData,
      borderColor: chartColor[0],
      backgroundColor: bgColor,
      borderWidth: 2,
      radius: 0,
      yAxisID: 'y',
      spanGaps: true,
      segment: {
        borderDash: (ctx: any) => skipped(ctx, [6, 6]),
      },
      // fill: true
    },
    {
      label: "humidity",
      data: humidData,
      borderColor: `#bacddc`,
      borderWidth: 2,
      radius: 0,
      // showLine: false,
      spanGaps: true,
      yAxisID: 'y1',
      segment: {
        borderDash: (ctx: any) => skipped(ctx, [6, 6]),
      },
    },

  ];
}