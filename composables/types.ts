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
