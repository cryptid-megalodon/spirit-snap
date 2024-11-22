import { collection, getDocs, getDoc, doc, query, orderBy } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { SpiritData } from '../utils/types';
import { db, storage } from '../firebase';


export const fetchSpirits = async (userId: string): Promise<SpiritData[]> => {
    const imagesCollection = collection(db, `users/${userId}/spirits`);
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