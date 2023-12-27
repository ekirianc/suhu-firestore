import { defineStore } from 'pinia';
import { useFirestore } from 'vuefire'
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs, doc, QuerySnapshot, onSnapshot
} from 'firebase/firestore'
import {
  formatDistanceToNow
} from 'date-fns';

interface TemperatureEntry {
  date: string;
  datetime: Date[]
  temperatures: (number | null)[]
  humidity: (number | null)[]
  dataPointCount: number

  expandedTemperature: (number | null)[]
  expandedHumidity: (number | null)[]
  expandedDatetime: Date[]

  adjHourlyTemperature: []
  adjHourlyHumidity: []

  hourlyTemperatureValue: []
  hourlyHumidityValue: []

  hourlyTemperatureObject: []
  hourlyHumidityValueObject: []

}

export const useDataStore = defineStore('temperature', {
  state: () => ({
    lastTemperature: 0,
    lastHumidity: 0,
    lastHeatIndex: 0,
    lastEntryTime: '',
    relativeTime: '',
    todayHighTempData: 0,
    todayHighTempTime: 0,
    todayLowTempData: 0,
    todayLowTempTime: 0,
    dataEntries: [] as TemperatureEntry[],

    correlation_peak_low_temperature: 0,
    overall_hourly_average: [] as number[],
    adj_overall_hourly_average: [] as number[],
  }),
  actions: {
    async fetchDataFromFirestore() {
      try {
        const db = useFirestore();

        const qDaily = query(
            collection(db, 'temperature'),
            orderBy('date', 'desc'),
            limit(7)
        );
        const qOverall = query(collection(db, 'overall'));

        // const dailySnapshot = await getDocs(qDaily);
        // const overallSnapshot = await getDocs(qOverall);

        const overallListener = onSnapshot(qOverall, (snapshot: QuerySnapshot) => {
          const overallData = snapshot.docs[0].data();
          this.correlation_peak_low_temperature = overallData.correlation_peak_low_temperature
          this.overall_hourly_average = Object.values(overallData.overall_hourly_average);

          const originalOverallHourlyAverage = Object.values(overallData.overall_hourly_average);
          this.adj_overall_hourly_average = [...originalOverallHourlyAverage, originalOverallHourlyAverage[0]] as number[];
        });

        const dailyListener = onSnapshot(qDaily, (snapshot) => {
          if (!snapshot.empty) {

            // ====================================================
            // get last data
            const lastDocument = snapshot.docs[0];
            const tempArray = lastDocument.data().entries.temp;
            const humidArray = lastDocument.data().entries.humid;
            const heatIndexArray = lastDocument.data().entries.heat_index;
            const timeArray = lastDocument.data().entries.time;

            this.lastTemperature = tempArray[tempArray.length - 1];
            this.lastHumidity = humidArray[humidArray.length - 1];
            this.lastHeatIndex = heatIndexArray[heatIndexArray.length - 1];
            this.lastEntryTime = timeArray[timeArray.length - 1];

            // get last entry relative time
            const lastTimeEntry = timeArray[timeArray.length - 1];
            const dateTimeString = `${lastDocument.data().date} ${lastTimeEntry}`;
            const dateTime = new Date(dateTimeString);
            this.relativeTime = formatDistanceToNow(dateTime, { addSuffix: true, includeSeconds: true });

            // get today high and low
            this.todayHighTempData = lastDocument.data().peak_temp.value;
            this.todayHighTempTime = lastDocument.data().peak_temp.time;
            this.todayLowTempData = lastDocument.data().lowest_temp.value;
            this.todayLowTempTime = lastDocument.data().lowest_temp.time;

            // ============================================

            const getTimeOnly = (date: Date) => date.getHours() * 60 + date.getMinutes();
            // create null array of data
            const dataCNullContainer = new Array(288).fill(null).map(() => ({
              temperature: null,
              humidity: null
            }));

            // Populate temperatureEntries
            this.dataEntries = snapshot.docs.map((doc) => {
              const data = doc.data();
              const date = data.date;
              const realTemperature = data.entries.temp
              const realHumidity = data.entries.humid

              // Combine date and time to create a valid JavaScript Date object
              const realDatetime: Date[] = data.entries.time.map((time: string) => {
                const dateTimeString = `${date} ${time}`;
                return new Date(dateTimeString);
              });

              // // get null array of temperature
              const temperatureContainer = dataCNullContainer.map(entry => entry.temperature);
              const humidityContainer = dataCNullContainer.map(entry => entry.humidity);

              // variabel ini digunakan untuk menyamakan jumlah data point setiap harinya walaupn ada yang kosong di tenaah
              // return 288 data point from today datetime
              // khusus ketika Series OFF
              const dummyDatetimeArray = [];
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

              // assign first data instead avg value on index 0
              const adjHourlyTemp = [realTemperature[0], ...Object.values(data.hourly_temp)];
              const adjHourlyHumid = [realHumidity[0], ...Object.values(data.hourly_humid)];

              return {
                date: data.date,
                temperatures: realTemperature,
                humidity: realHumidity,
                datetime: realDatetime,
                dataPointCount: data.data_point_count,

                hourlyTemperatureValue: Object.values(data.hourly_temp),
                hourlyHumidityValue: Object.values(data.hourly_humid),

                hourlyTemperatureObject: data.hourly_temp,
                hourlyHumidityValueObject: data.hourly_humid,

                adjHourlyTemperature: adjHourlyTemp,
                adjHourlyHumidity: adjHourlyHumid,

                expandedTemperature: temperatureContainer,
                expandedHumidity: humidityContainer,
                expandedDatetime: dummyDatetimeArray
              } as TemperatureEntry;
            });

          }
        });

        // Use the initial snapshot to get the current data
        const dailySnapshot = await getDocs(qDaily);
        const overallSnapshot = await getDocs(qOverall);

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