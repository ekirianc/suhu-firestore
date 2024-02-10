export interface Datasets {
    // data generated in store/index
    date: Date;
    is_valid: boolean;
    high_low: number[][];
    temp_high: number | null;
    temp_low: number | null;
    temp_diff_sum: number | null;
    temp_deviation: number | null;
    humid_deviation: number | null;
    correlation_high_low: number | null;
    today_total_data: number | null;
    average_temp: number | null;
    average_humid: number | null;
}

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

export interface CalendarDays{
    dataset?: object
    datetime: Date
}

// ############################################
// ############################################

interface TemperatureData {
    time: string[];
    heat_index: number[];
    temp: number[];
    humid: number[];
}

export interface HourlyData { [hour: string]: number; }
interface TodayLowestTemp { value: number; time: string; }
interface TodayHighestTemp { value: number; time: string; }
interface TodayTotal { humid: number; temp: number; }
interface TodayData { humid: number; temp: number; }

interface TodayHourly {
    humid: HourlyData;
    temp_diff: HourlyData;
    average: HourlyData;
    temp: HourlyData;
}

interface TodayStatistics {
    humid_deviation: number;
    correlation_peak_low: number;
    temp_diff_sum: number;
    temp_deviation: number;
}

export interface WeatherData {
    today_average: TodayData;
    today_is_valid: boolean;
    today_data_point_count: number;
    today_lowest_temp: TodayLowestTemp;
    today_highest_temp: TodayHighestTemp;
    today_entries: TemperatureData;
    today_total: TodayTotal;
    today_hourly: TodayHourly;
    today_statistics: TodayStatistics;
    today_date: string;
}
