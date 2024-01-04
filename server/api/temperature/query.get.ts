import { initializeApp } from 'firebase/app';
import {
    getFirestore, collection, getDocs,
    query, where, DocumentData, Firestore, orderBy, limit
} from 'firebase/firestore';

const appConfig = useAppConfig()
const firebaseConfig = appConfig.config // https://nuxt.com/docs/guide/directory-structure/app-config
const app = initializeApp(firebaseConfig);
const dbFirestore: Firestore = getFirestore(); // Explicitly define Firestore type

interface SensorData {
    temp: string;
    humid: string;
    time: number;
}


// Function to get epoch time for the last N hours
const getEpochTimeForLastNHours = (hours: number): { start: number; end: number } => {
    const end = new Date().getTime() / 1000;
    const start = end - hours * 60 * 60;

    return {
        start,
        end,
    };
};

// Function to get epoch time for today
const getEpochTimeForToday = (): { start: number; end: number } => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    return {
        start: startOfDay.getTime() / 1000,
        end: endOfDay.getTime() / 1000,
    };
};

// Function to get epoch time for yesterday
const getEpochTimeForYesterday = (): { start: number; end: number } => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return {
        start: startOfDay.getTime() / 1000,
        end: endOfDay.getTime() / 1000,
    };
};

// Function to get epoch time for the last N days
const getEpochTimeForLastNDays = (days: number): { start: number; end: number } => {
    const end = new Date().getTime() / 1000;
    const start = end - days * 24 * 60 * 60;

    return {
        start,
        end,
    };
};

export default defineEventHandler(async (event) => {
    const timeRange = getQuery(event).timeRange;

    const validTimeRange: string = typeof timeRange === 'string' ? timeRange : 'last';
    const validTimeRanges = ['3hours', '24hours', 'today', 'yesterday', '3days', 'last'];

    if (!validTimeRanges.includes(validTimeRange)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid time range provided' }),
        };
    }

    let start, end;
    // Set start and end time based on the specified time range
    switch (timeRange) {
        case '3hours':
            ({ start, end } = getEpochTimeForLastNHours(3));
            break;
        case '24hours':
            ({ start, end } = getEpochTimeForLastNHours(24));
            break;
        case 'today':
            ({ start, end } = getEpochTimeForToday());
            break;
        case 'yesterday':
            ({ start, end } = getEpochTimeForYesterday());
            break;
        case '3days':
            ({ start, end } = getEpochTimeForLastNDays(3));
            break;
        case 'last':
        default:
            start = end = 0;
    }

    try {
        // Query Firestore and process documents
        const qRangeData = query(collection(dbFirestore, 'temperature'),
            where('time', '>=', start),
            where('time', '<', end)
        );

        const qLastestData = query(collection(dbFirestore, 'temperature'),
            orderBy('time', 'desc'),
            limit(1)
        )

        let queryToExecute;
        if (start === 0 || end === 0) {
            // If start or end are 0, execute qLastestData
            queryToExecute = qLastestData;
        } else {
            // Otherwise, execute qRangeData
            queryToExecute = qRangeData;
        }

        const querySnapshot = await getDocs(queryToExecute);

        // Process the retrieved documents
        const documents: SensorData[] = [];
        let latestData: SensorData | null = null; // Variable to store the latest data

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            documents.push({
                temp: data.temp,
                humid: data.humid,
                time: data.time,
            });

            // Update latestData with the data from the latest document
            if (!latestData || data.time > latestData.time) {
                latestData = {
                    temp: data.temp,
                    humid: data.humid,
                    time: data.time,
                };
            }
        });

        return {
            statusCode: 200,
            message: 'Last data fetched successfully',
            latest: latestData,
            count: documents.length,
            data: documents,
        };
    } catch (e: any) {
        console.error('Error:', e);

        if (e.code === 'permission-denied') {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: 'Permission denied' }),
            };
        } else if (e.code === 'not-found') {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Document not found' }),
            };
        } else {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'Internal server error' }),
            };
        }
    }
});
