import { getFirestore, collection, getDocs, getDoc, doc, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import { SpiritData } from '../utils/types';

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_MEASUREMENT_ID
};

export const fetchSpirits = async (): Promise<SpiritData[]> => {
    // Initialize Firebase app
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const storage = getStorage(app);

    const imagesCollection = collection(db, 'generatedImages');
    const q = query(imagesCollection, orderBy('imageTimestamp', 'asc'));
    const querySnapshot = await getDocs(q);

    const spirits = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
            try {
                const data = doc.data();
                const filePath = data.generatedImageDownloadUrl;
                const originalFilePath = data.originalImageDownloadUrl;

                // Retrieve download URLs for both the generated and original images
                const generatedImageUrl = await getDownloadURL(ref(storage, filePath));
                const originalImageUrl = await getDownloadURL(ref(storage, originalFilePath));

                return {
                    id: doc.id,
                    name: data.name,
                    description: data.description,
                    primaryType: data.primaryType,
                    secondaryType: data.secondaryType,
                    generatedImageDownloadUrl: generatedImageUrl,
                    originalImageDownloadUrl: originalImageUrl
                };
            }
            catch (error) {
                console.log(error);
            }
        })
    );
    return spirits.filter((spirit): spirit is SpiritData => spirit !== undefined);
}