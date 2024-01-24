import {Datasets} from "~/composables/types";

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

export const updateMinMaxRefs = (local: any, global: any, dataset: Datasets) => {
    const updateMinMax = (property: string, value: number) => {
        local[property].min = global[property].min = Math.min(local[property].min, value);
        local[property].max = global[property].max = Math.max(local[property].max, value);
    };

    updateMinMax('lowTemp', dataset.temp_low!);
    updateMinMax('highTemp', dataset.temp_high!);
    updateMinMax('tempAvg', dataset.average_temp!);
    updateMinMax('humidAvg', dataset.average_humid!);
    updateMinMax('tempDiffSum', dataset.temp_diff_sum!);
};
