import { initializeApp } from 'firebase/app';
import { setDoc, doc } from 'firebase/firestore';
import { useFirestore } from "vuefire";

const appConfig = useAppConfig()
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
}
const app = initializeApp(firebaseConfig);
const dbFirestore = useFirestore(); //  Firestore instance

export default defineEventHandler(async (event) => {
    const { temp, humid } = getQuery(event);
    const epochTime = Math.floor(Date.now() / 1000);

    try {
        const docRef = doc(dbFirestore, 'temperature', String(epochTime));
        await setDoc(docRef, {
            temp: temp,
            humid: humid,
            time: epochTime
        });
        console.log('Document written with ID: ', epochTime);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Data added successfully' }),
            epoch: epochTime
        };
    } catch (e) {
        console.error('Error adding document: ', e);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error adding data' })
        };
    }
});
