import {defineStore} from 'pinia';
import {useFirestore} from 'vuefire'
import {collection, doc, getDocs, limit, onSnapshot, orderBy, query} from 'firebase/firestore'
import {eachDayOfInterval, format, formatDistanceToNow, isSameDay} from 'date-fns';
import {
  combineMinMax,
  fillMissingHours,
  generateMinMaxRefsObject, propertyNames,
  updateMinMax,
  UpdateType,
} from "~/composables/utils";
import type {Datasets} from "~/composables/types";

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

    overall_datasets: [] as Datasets[],

    overall_min_max: generateMinMaxRefsObject(propertyNames)

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
            this.overall_hourly_average_by_entries = Object.values(overallData.overall_hourly_average.by_entries)

            const originalOverallHourlyAverage = Object.values(overallData.overall_hourly_average.by_entries);
            this.overall_hourly_average_adj = [...originalOverallHourlyAverage, originalOverallHourlyAverage[0]] as number[];
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
              const { is_valid, highest_temp, lowest_temp, sum, deviation, correlation_high_low, today_total_data, average } = overallDaily[formattedDate]
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
            const lastDocument = snapshot.docs[0];
            const tempArray = lastDocument.data().today_entries.temp;
            const humidArray = lastDocument.data().today_entries.humid;
            const heatIndexArray = lastDocument.data().today_entries.heat_index;
            const timeArray = lastDocument.data().today_entries.time;

            this.last_temperature = tempArray[tempArray.length - 1];
            this.last_humidity = humidArray[humidArray.length - 1];
            this.last_heat_index = heatIndexArray[heatIndexArray.length - 1];
            this.last_entry_time = timeArray[timeArray.length - 1]; // HH:mm

            // get last entry relative time
            const lastTimeEntry = timeArray[timeArray.length - 1];
            const dateTimeString = `${lastDocument.data().today_date} ${lastTimeEntry}`;
            const dateTime = new Date(dateTimeString);
            this.relative_time = formatDistanceToNow(dateTime, { addSuffix: true, includeSeconds: true });
            this.last_datetime = dateTime;

            // get today high and low
            this.today_high_temp_data = lastDocument.data().today_highest_temp.value;
            this.today_high_temp_time = lastDocument.data().today_highest_temp.time;
            this.today_low_temp_data = lastDocument.data().today_lowest_temp.value;
            this.today_low_temp_time = lastDocument.data().today_lowest_temp.time;

            this.today_data_point_count = lastDocument.data().today_data_point_count;

            // ============================================

            const getTimeOnly = (date: Date) => date.getHours() * 60 + date.getMinutes();

            const dataCNullContainer = new Array(288).fill(null).map(() => ({
              temperature: null,
              humidity: null
            }));

            this.data_entries = snapshot.docs.map((doc) => {
              const data = doc.data();
              const date = data.today_date;
              const realTemperature = data.today_entries.temp
              const realHumidity = data.today_entries.humid

              // Extract time array
              let times = data.today_entries.time;

              // Check if "12:00 AM" exists at both the beginning and the end
              if (times.length >= 2 && times[times.length - 1] === "12:00 AM") {
                // Remove the last occurrence of "12:00 AM"
                times.pop();
                realTemperature.pop();
                realHumidity.pop();
              }

              // Combine date and time to create a valid JavaScript Date object
              const realDatetime: Date[] = data.today_entries.time.map((time: string) => {
                const dateTimeString = `${date} ${time}`;
                return new Date(dateTimeString);
              });

              // generate null array of temperature
              const temperatureContainer = dataCNullContainer.map(entry => entry.temperature);
              const humidityContainer = dataCNullContainer.map(entry => entry.humidity);

              // variabel ini digunakan untuk menyamakan jumlah data point setiap harinya walaupn ada yang kosong di tenaah
              // return 288 data point from today datetime
              // khusus ketika Series OFF
              const dummyDatetimeArray: Date[] = [];
              for (let i = 0; i < 24 * 60; i += 5) {
                const dummyDate = new Date();
                dummyDate.setHours(Math.floor(i / 60));
                dummyDate.setMinutes(i % 60);
                dummyDatetimeArray.push(dummyDate);
              }


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

              const filledHourlyTemp = fillMissingHours(data.today_hourly.temp);
              const filledHourlyHumid = fillMissingHours(data.today_hourly.humid);

              // assign first data instead avg value on index 0
              const adjHourlyTemp = [realTemperature[0], ...filledHourlyTemp];
              const adjHourlyHumid = [realHumidity[0], ...filledHourlyHumid];

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
    timeRange: "1"
  }),
  actions: {
    setSeriesToggle(toggle: boolean){
      this.seriesToggle = toggle
    },
  }
})