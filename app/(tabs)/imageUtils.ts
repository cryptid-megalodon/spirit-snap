// imageUtils.ts

import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { db, storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, collection } from "firebase/firestore";

// Main endpoint into processing user images.
type ImageData = {
  width: number;
  height: number;
  base64Image: string;
  uri: string;
};
export const processImage = async (image: ImageData) => {
  let generatedImageData: { [key: string]: any } = {};
  const timestamp = Date.now().toString();
  generatedImageData.image_timestamp = timestamp;

  const originalFilename = `${timestamp}-original.jpg`;
  const generatedFilename = `${timestamp}-generated.jpg`;

  console.log('Photo base64:', image.base64Image.slice(0, 100));
  console.log('Photo Width:', image.width);
  console.log('Photo Height:', image.height);
  generatedImageData.width = image.width;
  generatedImageData.height = image.height;

  // Step 1: Get the image caption from OpenAI
  const caption = await getImageCaption(image.base64Image);
  if (!caption) {
    console.error('Error: Failed to generate caption');
    return;
  }
  console.log('Caption:', caption)
  generatedImageData.caption = caption;

  // Step 2: Generate cartoon monster image using Replicate
  const generatedImageUri = await generateCartoonMonster(caption);
  if (!generatedImageUri) {
    console.error('Error: Failed to generate cartoon monster');
    return;
  }
  console.log('Finished generating image.')

  // Step 3: Upload results to Firebase Storage
  const origDownloadUrl = await uploadImageToFirebase(image.uri, originalFilename);
  const genImageUri = await saveGeneratedImage(generatedImageUri, generatedFilename)
  const genDownloadUrl = await uploadImageToFirebase(genImageUri, generatedFilename);
  generatedImageData.originalImageDownloadUrl = origDownloadUrl;
  generatedImageData.generatedImageDownloadUrl = genDownloadUrl;
  await writeDocumentToFirestore("generatedImages", generatedImageData); 
}

// Function to save generated image to the app cache
const saveGeneratedImage = async (imageUri: string, filename: string) => {
  try {
    const filepath = `${FileSystem.documentDirectory}${filename}`;

    // Check if imageUri is a data URI and extract the base64 data
    let base64Data = imageUri;
    if (imageUri.startsWith('data:')) {
      base64Data = imageUri.split('base64,')[1];
    } else {
      // If it's not a data URI, handle accordingly
      throw new Error('Invalid image data format');
    }

    // Write the base64 data to a file
    await FileSystem.writeAsStringAsync(filepath, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return filepath;

  } catch (error: any) {
    console.error('Error saving image to cache:', error);
    throw error;
  }
};

// Function to make API call to get caption for the image
export const getImageCaption = async (base64Image: string) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Write a prompt for an image generation model that captures the content of this image as a cartoon monster. Imagine creative traits and features about the monster that modify the creatures appearance in the prompt. The image should have a vibrant anime art style.`,
              },
              {
                type: 'image_url',
                image_url: { url: base64Image },
              }
            ]
          },
        ],
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const caption = response.data.choices[0].message.content;
    return caption;
  } catch (error) {
    console.error('Error fetching image caption:', error);
    return null;
  }
};

// Function to generate cartoon monster image using Replicate
export const generateCartoonMonster = async (prompt: string) => {
  try {
    const response = await axios.post(
      'https://cors-anywhere.herokuapp.com/https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',
      {
        input: {
          prompt: prompt,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          Prefer: 'wait',
        },
      }
    );
    const generatedImageUri = response.data.output[0];
    return generatedImageUri;
  } catch (error: any) {
    console.error('Error generating image:', error.response?.data || error.message);
    return null;
  }
};

// Function to upload image to Firebase Storage
export const uploadImageToFirebase = async (imageUri: string, filename: string): Promise<string> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const storageRef = ref(storage, `images/${filename}`);
    await uploadBytes(storageRef, blob);

    // Fetch the download URL after upload
    const downloadUrl = await getDownloadURL(storageRef);
    console.log(`Uploaded ${filename} and got download URL: ${downloadUrl}`);
    return downloadUrl;

  } catch (error) {
    console.error(`Error uploading ${filename} to Firebase Storage:`, error);
    throw error;
  }
};

// Function to write a document to Firestore
export const writeDocumentToFirestore = async (collectionName: string, data: any): Promise<void> => {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    console.log(`Document written with ID: ${docRef.id}`);
  } catch (error) {
    console.error("Error writing document: ", error);
    throw error;
  }
};
