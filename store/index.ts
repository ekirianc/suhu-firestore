import { defineStore } from 'pinia';
import { useFirestore } from 'vuefire'
import {
    collection,
    query,
    orderBy,
    limit,
    getDocs
} from 'firebase/firestore'
import {formatDistanceToNow, format} from "date-fns";

interface TemperatureEntry {
    date: string;
    datetime: Date[];
    temperatures: (number | null)[];
    humidity: (number | null)[];
    time: string
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
        minuteDatetimes: [] as Date[],

    }),
    actions: {
        async fetchDataFromFirestore(docLimit: number) {
            try {
                const db = useFirestore();
                const q = query(
                    collection(db, 'temperature'),
                    orderBy('date', 'desc'),
                    limit(docLimit)
                );

                const snapshot = await getDocs(q);

                if (!snapshot.empty) {

                    // ====================================================
                    // get last data
                    const lastDocument = snapshot.docs[0];
                    const tempArray = lastDocument.data().entries.temp;
                    const humidArray = lastDocument.data().entries.humid;
                    const heatIndexArray = lastDocument.data().entries.heat_index;
                    const timeArray = lastDocument.data().entries.time;

                    // Set other state properties
                    this.lastTemperature = tempArray[tempArray.length - 1];
                    this.lastHumidity = humidArray[humidArray.length - 1];
                    this.lastHeatIndex = heatIndexArray[heatIndexArray.length - 1];
                    this.lastEntryTime = timeArray[timeArray.length - 1];

                    // get last entry relative time
                    const lastTimeEntry = timeArray[timeArray.length - 1];
                    const dateTimeString = `${lastDocument.data().date} ${lastTimeEntry}`;
                    const dateTime = new Date(dateTimeString);

                    this.relativeTime = formatDistanceToNow(dateTime, { addSuffix: true, includeSeconds: true });

                    this.todayHighTempData = lastDocument.data().peak_temp.value;
                    this.todayHighTempTime = lastDocument.data().peak_temp.time;
                    this.todayLowTempData = lastDocument.data().lowest_temp.value;
                    this.todayLowTempTime = lastDocument.data().lowest_temp.time;

                    // Iterate through each document to generate datetime array
                    snapshot.docs.forEach((doc) => {
                        const data = doc.data();
                        const date = data.date;

                        // Generate datetime array for each minute of the day
                        const datetimeArray = Array.from({length: 24 * 60}, (_, index) => {
                            const hours = Math.floor(index / 60);
                            const minutes = index % 60;
                            const dateTimeString = `${date} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                            return new Date(dateTimeString);
                        });

                        // Store the datetime array in the new field
                        this.minuteDatetimes.push(...datetimeArray);
                    });

                    // Populate temperatureEntries
                    this.dataEntries = snapshot.docs.map((doc) => {
                        const data = doc.data();
                        const date = data.date;

                        // Combine date and time to create a valid JavaScript Date object
                        const datetimeArray = data.entries.time.map((time: string) => {
                            const dateTimeString = `${date} ${time}`;
                            return new Date(dateTimeString);
                        });

                        return {
                            date: data.date,
                            temperatures: data.entries.temp,
                            humidity: data.entries.humid,
                            datetime: datetimeArray,
                        } as TemperatureEntry;
                    });
                }
            } catch (error) {
                console.error('Error filling missing minutes:', error);
                // Handle the error, e.g., set default values or show a user-friendly message
            }
        }
    },
});

// Function to generate datetime values for every minute of a given date
function generateMinuteDatetimes(dateString: string): Date[] {
    const date = new Date(dateString);
    const minuteDatetimes: Date[] = [];

    // Generate datetime values for every minute of the given date
    for (let minute = 0; minute < 24 * 60; minute++) {
        const minuteDatetime = new Date(date.getTime() + minute * 60 * 1000);
        minuteDatetimes.push(minuteDatetime);
    }

    return minuteDatetimes;
}