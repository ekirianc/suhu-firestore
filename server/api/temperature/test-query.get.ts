interface DataEntry {
    time: number;
    temp: string;
    humid: string;
}

export default defineEventHandler(async (event) => {
    const timeRange = getQuery(event).timeRange;

    const validTimeRange: string = typeof timeRange === 'string' ? timeRange : 'last';
    const validTimeRanges = ['3hours', '24hours', 'today', 'yesterday', '3days', 'all', 'last'];

    if (!validTimeRanges.includes(validTimeRange)) {
        return {
            statusCode: 400,
            message: 'Invalid timeRange parameter. Please provide a valid timeRange.',
        };
    }

    const response = await fetch('http://localhost:3000/data-generated.json');
    const responseData = await response.json();

    const filterDataBy3Hours = (data: DataEntry[]) => {
        const currentTime = Math.floor(Date.now() / 1000);
        return data.filter((entry) => entry.time > currentTime - 3 * 60 * 60);
    };

    const filterDataBy24Hours = (data: DataEntry[]) => {
        const currentTime = Math.floor(Date.now() / 1000);
        return data.filter((entry) => entry.time > currentTime - 24 * 60 * 60);
    };

    const filterDataByToday = (data: DataEntry[]) => {
        const startOfDay = new Date().setHours(0, 0, 0, 0) / 1000;
        return data.filter((entry) => entry.time > startOfDay);
    };

    const filterDataByYesterday = (data: DataEntry[]) => {
        const startOfDay = new Date().setHours(0, 0, 0, 0) / 1000;
        const startOfYesterday = startOfDay - 24 * 60 * 60;
        return data.filter((entry) => entry.time > startOfYesterday && entry.time < startOfDay);
    };

    const filterDataBy3Days = (data: DataEntry[]) => {
        const currentTime = Math.floor(Date.now() / 1000);
        return data.filter((entry) => entry.time > currentTime - 3 * 24 * 60 * 60);
    };

    const getDefaultData = (data: DataEntry[]) => {
        // Assuming "latest data" means the entry with the highest timestamp
        const latest = data.reduce((latest, entry) => (entry.time > latest.time ? entry : latest), data[0]);
        return [latest]
    };

    const getAllData = (data: DataEntry[]) => data;

    const filterFunctions = {
        '3hours': filterDataBy3Hours,
        '24hours': filterDataBy24Hours,
        'today': filterDataByToday,
        'yesterday': filterDataByYesterday,
        '3days': filterDataBy3Days,
        'all': getAllData,
        'last': getDefaultData
    };

    const filterData = (filterFunctions as Record<string, (data: DataEntry[]) => DataEntry[]>)[validTimeRange];
    const filteredData = filterData ? filterData(responseData.data) : [];

    // Extract the last temperature
    const lastTemperature = getDefaultData(responseData.data)

    return {
        statusCode: 200,
        message: 'Filtered data fetched successfully',
        latest: lastTemperature,
        count: filteredData.length,
        data: filteredData,
    };
});
