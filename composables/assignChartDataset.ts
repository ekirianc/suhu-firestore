import ChartDataLabels from 'chartjs-plugin-datalabels';
import {Chart} from "chart.js";
Chart.register(ChartDataLabels);

const chartColor = ['#fa4183', '#8ADAB2', '#F7D060', '#FFC5C5', '#BEADFA', '#9BB8CD', '#B6BBC4'];

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
  }
};

export const assignTemperatureDataset = (label: string, data: (number | null)[] , index: number) => {
  return {
    label: label,
    data: data,
    borderColor: chartColor[index],
    backgroundColor: chartColor[index],
    borderWidth: 2,
    radius: 0,
    yAxisID: 'y',
    spanGaps: true,
    datalabels: {
      color: '#FFCE56'
    }
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
    backgroundColor: chartColor[index],
    radius: 2,
    yAxisID: 'y',
    spanGaps: true,
    tension: 0.4,
    datalabels: {
      align: 'end',
      anchor: 'end'
    }
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

  }
};

// Series ON
export const assignDatasets = (tempData: (number | null)[], humidData: (number | null)[], ) => {
  return [
    {
      label: "temperature",
      data: tempData,
      borderColor: chartColor[0],
      borderWidth: 2,
      radius: 0,
      yAxisID: 'y',
      spanGaps: true,
    },
    {
      label: "humidity",
      data: humidData,
      borderColor: `#bacddc`,
      borderWidth: 2,
      radius: 0,
      // showLine: false,
      // spanGaps: true,
      yAxisID: 'y1',
    },

  ];
}