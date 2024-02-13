import {defineStore} from 'pinia';
import {useFirestore} from 'vuefire'
import {collection, doc, getDocs, limit, onSnapshot, orderBy, query} from 'firebase/firestore'
import {eachDayOfInterval, format, formatDistanceToNow, isSameDay} from 'date-fns';
import {
  combineMinMax,
  fillMissingHours,
  generateMinMaxRefsObject, processDataEntries, propertyNames,
  updateMinMax,
  UpdateType,
} from "~/composables/utils";
import type {Datasets, HourlyData} from "~/types";

const FETCH_LIMIT = 7

interface DailyEntry {
  date: string
  datetime: Date[]
  temperatures: (number | null)[]
  humidity: (number | null)[]
  data_point_count: number

  expanded_temperature: (number | null)[]
  expanded_humidity: (number | null)[]
  expanded_datetime: Date[]

  hourly_temperature: {
    filled: []
    adjusted: []
    object: {}
  }
  hourly_humidity: {
    filled: []
    adjusted: []
  }
}

export const useDataStore = defineStore('temperature', {
  state: () => ({
    last_temperature: 0,
    last_humidity: 0,
    last_heat_index: 0,
    last_entry_time: '',
    relative_time: '',
    last_datetime: new Date(),
    today_high_temp_data: 0,
    today_high_temp_time: 0,
    today_low_temp_data: 0,
    today_low_temp_time: 0,
    today_data_point_count: 0,
    data_entries: [] as DailyEntry[],

    correlation_high_low_temp: 0,
    overall_hourly_average_by_entries: [] as number[],
    overall_hourly_average_adj: [] as number[],

    overall_hourly_average_by_entries_obj: {} as HourlyData,

    sum_of_overall_hourly_average_by_entries: 0,

    overall_datasets: [] as Datasets[],
    overall_min_max: generateMinMaxRefsObject(propertyNames),
    overall_temp_average: 0,
    overall_humid_average: 0,
    overall_high_temp_average: 0,
    overall_low_temp_average: 0,
    overall_hourly_temp_diff_average: 0,

    activeRoute: '',
    isFullscreen: false,
    isSelectedDataValid: false
  }),
  actions: {
    async fetchDataFromFirestore() {
      try {
        const db = useFirestore();

        // ####################################
        // ### Overall Data (avg, high-low) ###
        // ####################################

        const qOverallData = doc(db, 'overall', 'data')
        onSnapshot(qOverallData, (snapshot) => {
          const overallData = snapshot.data();
          if (overallData){
            this.correlation_high_low_temp = overallData.correlation_high_low_temp

            const originalOverallHourlyAverage: number[] = Object.values(overallData.overall_hourly_average.by_entries)
            this.overall_hourly_average_by_entries = originalOverallHourlyAverage
            this.overall_hourly_average_by_entries_obj = overallData.overall_hourly_average.by_entries

            this.overall_hourly_average_adj = [...originalOverallHourlyAverage, originalOverallHourlyAverage[0]] as number[];

            this.sum_of_overall_hourly_average_by_entries = overallData.overall_hourly_average.sum_by_entries

            this.overall_temp_average = overallData.overall_average.temp
            this.overall_humid_average = overallData.overall_average.humid

            this.overall_high_temp_average = overallData.overall_average.high_temp
            this.overall_low_temp_average = overallData.overall_average.low_temp

            this.overall_hourly_temp_diff_average = overallData.overall_average.hourly_temp_diff
          }
        });

        // #######################################################
        // ##### Overall Daily [ARRAY] (high, low, sum, ...) #####
        // #######################################################

        const qOverallDaily = doc(db, 'overall', 'daily')
        onSnapshot(qOverallDaily, (snapshot) => {
          const overallDaily = snapshot.data()

          if (overallDaily) {
            const dates = Object.keys(overallDaily);

            const sortedDate = dates.map(date => new Date(date));
            sortedDate.sort((a, b) => a.getTime() - b.getTime());

            this.overall_datasets = sortedDate.map(date => {
              const formattedDate = format(date, 'yyyy-MM-dd');
              const {
                is_valid,
                highest_temp, lowest_temp,
                sum, deviation, average,
                correlation_high_low,
                today_total_data,
                accumulated_hourly_temp_diff_sum,
              } = overallDaily[formattedDate]
              const averageTemp = is_valid ? parseFloat(average.temp.toFixed(2)) : null;
              const averageHumid = is_valid ? parseFloat(average.humid.toFixed(2)) : null;

              return  {
                date,
                is_valid,
                high_low: is_valid ? [highest_temp, lowest_temp] : [],
                temp_high: is_valid ? highest_temp : null,
                temp_low: is_valid ? lowest_temp : null,
                temp_diff_sum: is_valid ? parseFloat(sum.temp_diff_sum.toFixed(2)) : null,
                temp_deviation: is_valid ? deviation.temp : null,
                humid_deviation: is_valid ? deviation.humid : null,
                today_total_data,
                correlation_high_low,
                accumulated_hourly_temp_diff_sum,
                average_temp: averageTemp,
                average_humid: averageHumid,
              }
            })

            // #################### get overall min max ####################

            const overallMinMax = this.overall_min_max
            const overallDatasets = this.overall_datasets

            const start = overallDatasets[0]?.date;
            const end = overallDatasets.slice(-1)[0]?.date;
            const allDate = eachDayOfInterval({start, end});

            allDate.forEach((date) => {
              const dataset = overallDatasets.find((ds) => isSameDay(ds.date, date));

              if (dataset?.is_valid) {
                // set propery from composables/utils propertyNames
                updateMinMax(dataset, UpdateType.Overall, overallMinMax);

                // Get all property names of generateMinMaxRefsObject
                const propertyNames = Object.keys(overallMinMax);

                // Combine min max for each property
                propertyNames.forEach(propertyName => combineMinMax(overallMinMax[propertyName as keyof typeof overallMinMax]));
              }
            })

          } else {
            console.error('Document not found or empty.');
          }
        })

        // ############################################
        // ############# Daily Data Entry #############
        // ############################################

        const qDaily = query(
            collection(db, 'dailyRecords'),
            orderBy('today_date', 'desc'),
            limit(FETCH_LIMIT)
        );
        onSnapshot(qDaily, (snapshot) => {
          if (!snapshot.empty) {
            // ====================================================
            // get last data
            const lastDocument = snapshot.docs[0].data();
            const tempArray = lastDocument.today_entries.temp;
            const humidArray = lastDocument.today_entries.humid;
            const heatIndexArray = lastDocument.today_entries.heat_index;
            const timeArray = lastDocument.today_entries.time;

            this.last_temperature = tempArray.at(-1);
            this.last_humidity = humidArray.at(-1);
            this.last_heat_index = heatIndexArray.at(-1);
            this.last_entry_time = timeArray.at(-1); // HH:mm

            // get last entry relative time
            const lastTimeEntry = timeArray.at(-1);
            const dateTimeString = `${lastDocument.today_date} ${lastTimeEntry}`;
            const dateTime = new Date(dateTimeString);
            this.relative_time = formatDistanceToNow(dateTime, { addSuffix: true, includeSeconds: true });
            this.last_datetime = dateTime;

            // get today high and low
            this.today_high_temp_data = lastDocument.today_highest_temp.value;
            this.today_high_temp_time = lastDocument.today_highest_temp.time;
            this.today_low_temp_data = lastDocument.today_lowest_temp.value;
            this.today_low_temp_time = lastDocument.today_lowest_temp.time;

            this.today_data_point_count = lastDocument.today_data_point_count;

            // ============================================

            this.data_entries = snapshot.docs.map((doc) => {
              const data = doc.data();
              const {
                realTemperature, realHumidity, realDatetime,
                temperatureContainer, humidityContainer, dummyDatetimeArray
              } = processDataEntries(data)

              const filledHourlyTemp = fillMissingHours(data.today_hourly.temp);
              const filledHourlyHumid = fillMissingHours(data.today_hourly.humid);

              const temp = { ...data.today_hourly.temp };
              const humid = { ...data.today_hourly.humid };

              // Extracting the keys of the 'temp' object
              const keys = Object.keys(temp);
              keys.sort((a, b) => Number(a) - Number(b));
              const firstKey = keys[0];
              const keyBeforeFirst = String(Number(firstKey) - 1);

              let adjHourlyTemp: any[] = []
              let adjHourlyHumid: any[] = []

              if (firstKey === '0'){
                // if hourly temp start at 0, add realtemp to begining
                adjHourlyTemp = [realTemperature[0], ...filledHourlyTemp];
                adjHourlyHumid = [realHumidity[0], ...filledHourlyHumid];
              } else {
                temp[keyBeforeFirst] = realTemperature[0]
                humid[keyBeforeFirst] = realHumidity[0]
                adjHourlyTemp = fillMissingHours(temp)
                adjHourlyHumid = fillMissingHours(humid)
                // shift values to +1 keys
                for (let i = adjHourlyTemp.length - 1; i >= 0; i--) {
                  adjHourlyTemp[i + 1] = adjHourlyTemp[i];
                  adjHourlyHumid[i + 1] = adjHourlyHumid[i];
                }
              }

              return {
                date: data.today_date,
                temperatures: realTemperature,
                humidity: realHumidity,
                datetime: realDatetime,
                data_point_count: data.today_data_point_count,
                hourly_temperature: {
                  filled: filledHourlyTemp,
                  adjusted: adjHourlyTemp,
                  object: data.today_hourly.temp
                },
                hourly_humidity: {
                  filled: filledHourlyHumid,
                  adjusted: adjHourlyHumid
                },
                expanded_temperature: temperatureContainer,
                expanded_humidity: humidityContainer,
                expanded_datetime: dummyDatetimeArray
              } as DailyEntry;
            });

          }
        });

        // Use the initial snapshot to get the current data
        await getDocs(qDaily);
        // const overallSnapshot = await getDocs(qOverallData);

      } catch (error) {
        console.error(error);
      }
    }
  },
});

export const usePreferences = defineStore("preferences", {
  state: () => ({
    seriesToggle: false,
    timeRange: "1",

    percentageToggle: false,
  }),
  actions: {
    setSeriesToggle(toggle: boolean){
      this.seriesToggle = toggle
    },
    setPercentageToggle(toggle: boolean){
      this.percentageToggle = toggle
    },
  }
})