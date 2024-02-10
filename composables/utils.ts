import type {Datasets} from "~/types";
import {chartOptionsMain} from "~/composables/chartOptionsMain";

export function setChartTicksAndGridColor(isDark: boolean){
    chartOptionsMain.value.scales.y.grid.color = (ctx: any) => {
        const threshold = ctx.tick.value === 30 || ctx.tick.value === 34;
        return isDark ? (threshold ? '#aba6a6' : '#4b4b4b') : (threshold ? '#2f2f2f' : '#d5d5d5');
    };
    chartOptionsMain.value.scales.x.grid.color = () => (isDark ? '#4b4b4b' : '#d5d5d5')

    const darkModeScaleColor = () => (isDark ? '#bebebe' : '#525252');
    chartOptionsMain.value.scales.y.ticks.color = darkModeScaleColor;
    chartOptionsMain.value.scales.y1.ticks.color = darkModeScaleColor;
    // chartOptions.value.scales.x.ticks.color = darkModeScaleColor;
    chartOptionsMain.value.scales.x.ticks.color = function(context: any) {
        return context.tick.major ? '#ff3874' : darkModeScaleColor();
    };
}

interface HourlyData {
    [hour: string]: number | null;
}

export function expandHourlyData(hourly_data: number[]){
    // takes data from overall_hourly_average (24 data count) and adjusted (25 data count, for series off)
    // expand hpurly data to 288 data point with null in between
    const expandedData: HourlyData = {};
    const interval = 60/5 // minutes

    for (let hour = 0; hour < 24; hour++) {
        const existingValue = hourly_data[hour];
        const startIndex = hour * 12;

        for (let i = 0; i < interval; i++) {
            expandedData[startIndex + i] = i === 0 ? existingValue : null;
        }
    }

    // duplicate first entry to last (Series OFF)
    // if Series ON, hourly_data[24] return undefined
    expandedData[287] = hourly_data[24];

    return Object.values(expandedData)
}

export function formattedDate(docDate: string){
    // format date to DD MMM
    const date = new Date(docDate)
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    return  day + ' ' + month;
}

export function generateHourlyIntervalDT(): Date[] {
    // generate datetime with interval 1 hour from 0 AM to 11 PM then 11:59 PM
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Set to midnight

    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999); // Set to 11:59:59 PM

    const dateTimeRange: Date[] = [];
    let currentDateTime = new Date(startDate);

    while (currentDateTime <= endDate) {
        dateTimeRange.push(new Date(currentDateTime));
        currentDateTime.setHours(currentDateTime.getHours() + 1);
    }

    // Add the last datetime value (11:59 PM)
    dateTimeRange.push(endDate);

    return dateTimeRange;
}

export function addMissingTimes(
    datetime: Date[],
    temperatures: (number | null)[],
    humidity: (number | null)[],
): { timestamp: Date; temperature: number | null; humidity: number | null }[] {
    const timeInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
    const result = [];

    for (let ii = 0; ii < datetime.length; ii++) {
        const currentTime = datetime[ii];

        // If it's not the first iteration, check for missing times and add null entries
        if (ii > 0) {
            const previousTime = datetime[ii - 1];
            const timeDifference = currentTime.getTime() - previousTime.getTime();

            if (timeDifference > timeInterval) {
                const missingIntervals = Math.floor(timeDifference / timeInterval);

                for (let jj = 1; jj < missingIntervals; jj++) {
                    const newTime = new Date(previousTime.getTime() + jj * timeInterval);

                    // Assign null values for temperature and humidity
                    result.push({ timestamp: newTime, temperature: null, humidity: null });
                }
            }
        }

        // Add the current data point
        result.push({
            timestamp: currentTime,
            temperature: temperatures[ii],
            humidity: humidity[ii],
        });
    }

    return result;
}


export function fillMissingHours(hourlyData: HourlyData) {
    const filledHourlyTemp: (number | null)[] = [];

    // Assuming the hours range from 0 to 23
    for (let hour = 0; hour < 24; hour++) {
        const hourKey = hour.toString();

        if (hourlyData[hourKey] !== undefined) {
            filledHourlyTemp[hour] = hourlyData[hourKey];
        }
    }

    return filledHourlyTemp;
}

export function generateDateTimeWithHourlyInterval(date: Date[], hourlyTempObj: HourlyData): Date[] {
    const result: Date[] = [];

    // Sort datetime array in ascending order
    const sortedDatetime = date.slice().sort((a, b) => a.getTime() - b.getTime());

    // Get the oldest date and the first key from hourlyTempObj
    const oldestDate = sortedDatetime[0];
    const firstHour = Object.keys(hourlyTempObj).map(Number).sort((a, b) => a - b)[0];

    // Iterate through datetime array and hourlyTempObj keys
    let currentDateTime = new Date(oldestDate);
    currentDateTime.setMinutes(0); // Start at minute 0 of each hour
    let currentHour = firstHour;

    while (currentDateTime <= sortedDatetime[sortedDatetime.length - 1] && hourlyTempObj.hasOwnProperty(currentHour)) {
        const tempValue = hourlyTempObj[currentHour];

        if (tempValue !== null) {
            result.push(new Date(currentDateTime));
        }

        // Increment currentDateTime by 1 hour
        currentDateTime.setHours(currentDateTime.getHours() + 1);

        // Get the next hourlyTempObj key
        currentHour = Object.keys(hourlyTempObj).map(Number).sort((a, b) => a - b).find(hour => hour > currentHour) || currentHour;
    }

    return result;
}

export function extendAvgTemperatureSeries(
    entries: HourlyData,
    start: number,
    numberOfDays: number,
): number[] {
    const result: HourlyData = {};

    let currentHour = start;
    for (let day = 0; day < numberOfDays; day++) {
        for (let hour = 0; hour <= 23; hour++) {
            const key = (day * 24 + hour).toString();
            result[key] = entries[currentHour.toString()];
            currentHour = (currentHour + 1) % 24; // Wrap around to 0 after reaching 23
        }
    }
    return Object.values(result) as number[];
}

// ##########################################
// ##########################################
// ##########################################

export const getTimeOnly = (date: Date): number => date.getHours() * 60 + date.getMinutes();

export const dataNullContainer = new Array(288).fill(null).map(() => ({
    temperature: null,
    humidity: null
}))

export function generateDatetime(date: string, times: string[]): Date[]{
    let dateTimeString: Date[] = []
    times.map((time: string) => {
        dateTimeString.push(new Date(`${date} ${time}`))
    });
    return dateTimeString;
}

export function generateDummyDatetimeArray(): Date[] {
    const dummyDatetimeArray: Date[] = [];
    for (let i = 0; i < 24 * 60; i += 5) {
        const dummyDate = new Date();
        dummyDate.setHours(Math.floor(i / 60));
        dummyDate.setMinutes(i % 60);
        dummyDatetimeArray.push(dummyDate);
    }
    return dummyDatetimeArray;
}

export function processDataEntries(data: any){
    const date = data.today_date;
    const realTemperature = data.today_entries.temp
    const realHumidity = data.today_entries.humid
    const times = data.today_entries.time;

    // Check if "12:00 AM" exists at both the beginning and the end
    if (times.length >= 2 && times.at(-1) === "12:00 AM") {
        // Remove the last occurrence of "12:00 AM"
        times.pop();
        realTemperature.pop();
        realHumidity.pop();
    }

    // Combine date and time to create a valid JavaScript Date object
    const realDatetime: Date[] = generateDatetime(date, times)

    // generate null array
    const temperatureContainer = dataNullContainer.map(entry => entry.temperature);
    const humidityContainer = dataNullContainer.map(entry => entry.humidity);

    // variabel ini digunakan untuk menyamakan jumlah data point setiap harinya walaupn ada yang kosong di tenaah
    // return 288 data point from today datetime
    // khusus ketika Series OFF
    const dummyDatetimeArray: Date[] = generateDummyDatetimeArray()

    dummyDatetimeArray.forEach((dummyDatetime, index) => {
        const dummyTime = getTimeOnly(dummyDatetime);
        const realIndex = realDatetime.findIndex((realDatetime) => {
            return getTimeOnly(realDatetime) === dummyTime;
        });

        // If a match is found, copy the temperature value; otherwise, set it to null
        if (realIndex !== -1) {
            temperatureContainer[index] = realTemperature[realIndex];
            humidityContainer[index] = realHumidity[realIndex];
        } else {
            temperatureContainer[index] = null;
            humidityContainer[index] = null;
        }
    });

    return {
        realTemperature, realHumidity, realDatetime,
        temperatureContainer, humidityContainer, dummyDatetimeArray
    }
}

// ##########################################
// ###### Search for min and max value ######
// ##########################################

export const createMinMaxRefs = () => ({
    min: Infinity,
    max: -Infinity,
});

export const propertyNames = [
    'lowTemp',
    'highTemp',
    'tempAvg',
    'humidAvg',
    'tempDiffSum'
];

export const generateMinMaxRefsObject = (propertyNames: string[]) => {
    const minMaxRefsObject: Record<string, { min: number; max: number }> = {};

    propertyNames.forEach(propertyName => {
        minMaxRefsObject[propertyName] = createMinMaxRefs();
    });

    return minMaxRefsObject;
};

export const combineMinMax = (minMaxObject: { min: number; max: number }) => ({
    min: minMaxObject.min,
    max: minMaxObject.max,
});

export enum UpdateType {
    Local,
    Overall
}

export const updateMinMax = (
    dataset: Datasets,
    updateType: UpdateType,
    global: any, local?: any,
) => {
    const updateMinMax = (property: string, value: number) => {
        if (updateType === UpdateType.Local) {
            local[property].min = global[property].min = Math.min(local[property].min, value);
            local[property].max = global[property].max = Math.max(local[property].max, value);
        } else {
            global[property].min = Math.min(global[property].min, value);
            global[property].max = Math.max(global[property].max, value);
        }
    };

    // dataset props follows the prop name on firestore
    updateMinMax('lowTemp', dataset.temp_low!);
    updateMinMax('highTemp', dataset.temp_high!);
    updateMinMax('tempAvg', dataset.average_temp!);
    updateMinMax('humidAvg', dataset.average_humid!);
    updateMinMax('tempDiffSum', dataset.temp_diff_sum!);
};
