import { defineStore } from 'pinia';
import { useFirestore } from 'vuefire'
import { collection, query, orderBy, limit, getDocs, onSnapshot, doc } from 'firebase/firestore'
import { format, formatDistanceToNow } from 'date-fns';
import { fillMissingHours } from "~/composables/utils";
import {object} from "firebase-functions/lib/v1/providers/storage";

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

interface overallDatasets {
  date: Date,
  is_valid: boolean,
  high_low: number[][],
  temp_high: number | null;
  temp_low: number | null;
  temp_diff_sum: number | null;
  temp_deviation: number | null;
  humid_deviation: number | null;
  correlation_high_low: number | null;
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

    overall_datasets: [] as overallDatasets[],

    dataChanges: 0,
    isDataLoaded: false,
    isLoading: true,
    // errorMessage: '',
  }),
  actions: {
    async fetchDataFromFirestore() {
      try {
        const db = useFirestore();

        const qDaily = query(
            collection(db, 'dailyRecords'),
            orderBy('today_date', 'desc'),
            limit(FETCH_LIMIT)
        );

        const qOverallData = doc(db, 'overall', 'data')
        const overallDataListener = onSnapshot(qOverallData, (snapshot) => {
          const overallData = snapshot.data();
          if (overallData){
            this.correlation_high_low_temp = overallData.correlation_high_low_temp
            this.overall_hourly_average_by_entries = Object.values(overallData.overall_hourly_average.by_entries)

            const originalOverallHourlyAverage = Object.values(overallData.overall_hourly_average.by_entries);
            this.overall_hourly_average_adj = [...originalOverallHourlyAverage, originalOverallHourlyAverage[0]] as number[];
            this.isDataLoaded = true;
          }
        });

        const qOverallDaily = doc(db, 'overall', 'daily')
        const overallDailyListener = onSnapshot(qOverallDaily, (snapshot) => {
          const overallDaily = snapshot.data()

          if (overallDaily) {
            const dates = Object.keys(overallDaily);

            const sortedDate = dates.map(date => new Date(date));
            sortedDate.sort((a, b) => a.getTime() - b.getTime());

            this.overall_datasets = sortedDate.map(date => {
              const formattedDate = format(date, 'yyyy-MM-dd');
              const { is_valid, highest_temp, lowest_temp, sum, deviation, correlation_high_low } = overallDaily[formattedDate]
              return  {
                date,
                is_valid,
                high_low: is_valid ? [highest_temp, lowest_temp] : [],
                temp_high: is_valid ? highest_temp : null,
                temp_low: is_valid ? lowest_temp : null,
                temp_diff_sum: is_valid ? sum.temp_diff_sum : null,
                temp_deviation: is_valid ? deviation.temp : null,
                humid_deviation: is_valid ? deviation.humid : null,
                correlation_high_low
              }
            })

            // console.log(this.overall_datasets.map(data=> data.high_low))
          } else {
            console.error('Document not found or empty.');
          }
        })

        const dailyListener = onSnapshot(qDaily, (snapshot) => {
          if (!snapshot.empty) {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                this.dataChanges += 1
                // console.log('Document added:', change.doc.data().today_date);
              }

              if (change.type === 'modified') {
                this.dataChanges += 1
                // console.log('Document modified:', change.doc.data().today_date);

              }

              if (change.type === 'removed') {
                this.dataChanges += 1
                // console.log('Document added:', change.doc.data().today_date);
              }
            });
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
        const dailySnapshot = await getDocs(qDaily);
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