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
    backgroundColor?: string,
    showLine?: boolean
}

interface HourlyDatasets {
    [hour: number]: number | null;
}
export function expandHourlyData(hourly_data: number[]){
    // expand hpurly data to 288 data point with null in between
    const expandedData: HourlyDatasets = {};

    for (let hour = 0; hour < 24; hour++) {
        const existingValue = hourly_data[hour];
        const startIndex = hour * 12;

        for (let i = 0; i < 12; i++) {
            expandedData[startIndex + i] = i === 0 ? existingValue : null;
        }
    }
    const lastData = hourly_data[24];
    const keys = Object.keys(expandedData);
    const secondLastIndex = keys.length - 2;
    const numericKeys = keys.map(key => Number(key));
    expandedData[numericKeys[secondLastIndex]] = lastData;

    const expandedDataArray: (number | null)[] = Object.values(expandedData);

    return expandedDataArray
}

export function expandHourlyDataOnSeries(hourly_data: number[]): (number | null)[] {
    const expandedData: (number | null)[] = [];

    for (let hour = 0; hour < 24; hour++) {
        const existingValue = hourly_data[hour];

        for (let i = 0; i < 12; i++) {
            expandedData.push(i === 0 ? existingValue : null);
        }
    }

    return expandedData;
}

export function reduceDatetimeToHourly(dates: Date[]): Date[] {
    if (dates.length === 0) {
        return [];
    }

    const result: Date[] = [dates[0]]; // Start with the first date

    for (let i = 1; i < dates.length; i++) {
        const current = dates[i];
        const previous = result[result.length - 1];

        // Check if the difference between the current and previous date is at least 1 hour
        if (Math.abs(current.getTime() - previous.getTime()) >= 3600000) {
            result.push(current);
        }
    }

    return result;
}

export function formattedDate(docDate: string){
    // format date to DD MMM
    const date = new Date(docDate)
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    return  day + ' ' + month;
}

export function generateDateTimeRange(): Date[] {
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