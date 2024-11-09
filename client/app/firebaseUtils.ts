import { getFirestore, collection, getDocs, getDoc, doc, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';


// todo put this in env before pushing to github
const firebaseConfig = {
    apiKey: "AIzaSyB-0Vit-xjkIPoK-tE9H8_H2sSfKn4RQ4g",
    authDomain: "spirit-snap.firebaseapp.com",
    projectId: "spirit-snap",
    storageBucket: "spirit-snap.appspot.com",
    messagingSenderId: "128476670109",
    appId: "1:128476670109:web:01160de124b4329692cc74",
    measurementId: "G-2R3722WB0C"
};

export const fetchImages = async () => {
    // Initialize Firebase app
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const storage = getStorage(app);

    const imagesCollection = collection(db, 'generatedImages');
    const q = query(imagesCollection, orderBy('image_timestamp', 'asc'));
    const querySnapshot = await getDocs(q);

    const imageUrls = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
            const imageData = doc.data();
            const filePath = imageData.generatedImageDownloadUrl;
            try {
                const imageRef = ref(storage, filePath);
                const url = await getDownloadURL(imageRef);
                return url;
            }
            catch (error) {
            }
        })
    );
    return imageUrls;
}