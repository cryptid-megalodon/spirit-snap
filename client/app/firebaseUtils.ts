import { getFirestore, collection, getDocs, getDoc, doc, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';


// todo put this in env before pushing to github
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_MEASUREMENT_ID
};

export const fetchImages = async () => {
    // Initialize Firebase app
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const storage = getStorage(app);

    const imagesCollection = collection(db, 'generatedImages');
    const q = query(imagesCollection, orderBy('imageTimestamp', 'asc'));
    const querySnapshot = await getDocs(q);

    const imageUrls = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
            try {
                const imageData = doc.data();
                const filePath = imageData.generatedImageDownloadUrl;
                const imageRef = ref(storage, filePath);
                return await getDownloadURL(imageRef);
            }
            catch (error) {
                console.log(error);
            }
        })
    );
    return imageUrls;
}