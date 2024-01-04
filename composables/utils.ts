export interface ChartDataset {
    label?: string
    data?: (number | null)[]
    borderColor?: string
    borderWidth?: number
    radius?: number
    yAxisID?: string
    spanGaps?: boolean
    segment?: object
    borderDash?: number[],
    backgroundColor?: string | object,
    showLine?: boolean,
    fill?: boolean,
}
export interface HourlyData {
    [hour: string]: number | null;
}

export function expandHourlyData(hourly_data: number[]){
    // takes data from overall_hourly_average (24 data count) and adjusted (25 data count)
    // expand hpurly data to 288 data point with null in between
    const expandedData: HourlyData = {};

    for (let hour = 0; hour < 24; hour++) {
        const existingValue = hourly_data[hour];
        const startIndex = hour * 12;

        for (let i = 0; i < 12; i++) {
            expandedData[startIndex + i] = i === 0 ? existingValue : null;
        }
    }

    // duplicate first entry to last
    // jika tidak dilakukan, akan ada jarak dari jam 11 ke 12 di Series OFF
    // 287 karena dimulai dari 0
    // [24] will return undefined if series ON. jadi tidak akan terjadi overlap dengan hari selajutnya
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
    dataset: Date[],
    temperatures: (number | null)[],
    humidity: (number | null)[],
): { timestamp: Date; temperature: number | null; humidity: number | null }[] {
    const timeInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
    const result = [];

    for (let i = 1; i < dataset.length; i++) {
        const previousTime = dataset[i - 1];
        const currentTime = dataset[i];

        // Calculate the time difference between two entries in milliseconds
        const timeDifference = currentTime.getTime() - previousTime.getTime();

        // If the time difference is greater than the interval, add missing times
        if (timeDifference > timeInterval) {
            const missingIntervals = Math.floor(timeDifference / timeInterval);

            for (let j = 1; j <= missingIntervals; j++) {
                const newTime = new Date(previousTime.getTime() + j * timeInterval);

                // Assign null values for temperature and humidity
                result.push({ timestamp: newTime, temperature: null, humidity: null });
            }
        }

        // Add the existing data point
        result.push({
            timestamp: currentTime,
            temperature: temperatures[i] ?? null, // Use the nullish coalescing operator to handle null or undefined
            humidity: humidity[i] ?? null,
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