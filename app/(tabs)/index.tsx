import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Platform, Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { GestureHandlerRootView, PinchGestureHandler, PinchGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import axios from 'axios'; // To handle the API requests
import { db, storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, collection } from "firebase/firestore";


export default function Tab() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photos, setPhotos] = useState<string[]>([]); // Store multiple photos
  const [zoom, setZoom] = useState(0);
  const [cameraRef, setCameraRef] = useState(null);
  const cameraViewRef = useRef<CameraView | null>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  const handlePinchGesture = (event: PinchGestureHandlerGestureEvent) => {
    const scale = event.nativeEvent.scale;
    let newZoom = zoom + (scale - 1) / 30; // Adjust sensitivity of zoom. The larger the denominator, the less sensitive the gesture will be.
    newZoom = Math.min(Math.max(newZoom, 0), 1); // Clamp the value between 0 and 1
    setZoom(newZoom);
  };

  const takePicture = async () => {
    let generatedImageData: { [key: string]: any } = {};
    try {
      if (cameraViewRef.current) {
        const picture = await cameraViewRef.current.takePictureAsync({ base64: true });
        if (picture && picture.uri && picture.base64) {
          const timestamp = Date.now().toString();
          generatedImageData.image_timestamp = timestamp;

          // Filenames with the unique identifier
          const originalFilename = `${timestamp}-original.jpg`;
          const generatedFilename = `${timestamp}-generated.jpg`;

          // Save the original picture
          const savedOriginalUri = await saveOriginalPicture(picture.uri, originalFilename);
          let base64Image = "data:image/jpg;base64," + picture.base64;

          // Log individual properties for more specific details
          console.log('Photo URI:', picture.uri);
          console.log('Photo Width:', picture.width);
          console.log('Photo Height:', picture.height);
          generatedImageData.width = picture.width;
          generatedImageData.height = picture.height;

          // Step 1: Get the image caption from OpenAI
          const caption = await getImageCaption(base64Image);
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

          // Step 3: Save the generated image
          const savedGeneratedUri = await saveGeneratedImage(generatedImageUri, generatedFilename);

          // Update local state to include the new photos
          if (savedOriginalUri && savedGeneratedUri) {
            setPhotos((prevPhotos) => [...prevPhotos, savedOriginalUri, savedGeneratedUri]);

            // Upload the photos to Firebase Storage
            const origDownloadUrl = await uploadImageToFirebase(savedOriginalUri, originalFilename);
            const genDownloadUrl = await uploadImageToFirebase(savedGeneratedUri, generatedFilename);
            generatedImageData.originalImageDownloadUrl = origDownloadUrl;
            generatedImageData.generatedImageDownloadUrl = genDownloadUrl;
          }
        writeDocumentToFirestore("generatedImages", generatedImageData)
        } else {
          console.error('Error: Picture is undefined or missing URI.');
        }
      } else {
        console.error('Error: cameraViewRef.current is null.');
      }
    } catch (error) {
      console.error('Error taking picture: ', error);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <PinchGestureHandler
        onGestureEvent={handlePinchGesture}
      >
        <CameraView style={styles.camera} ref={cameraViewRef} zoom={zoom}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={takePicture}>
              <Text style={styles.text}>Take Picture</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </PinchGestureHandler>
    </GestureHandlerRootView>
  );
}

// Function to make API call to get caption for the image
const getImageCaption = async (base64Image: string) => {
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

// Returns base64 image URI.
const generateCartoonMonster = async (prompt: string) => {
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
          'X-Requested-With': 'XMLHttpRequest',  // Adding the X-Requested-With header
          Prefer: 'wait', // This tells the server to wait until the image is generated before responding
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

// Function to save the original picture
const saveOriginalPicture = async (pictureUri: string, filename: string) => {
  try {
    const filepath = `${FileSystem.documentDirectory}${filename}`;

    // Copy the picture to the file system
    await FileSystem.copyAsync({
      from: pictureUri,
      to: filepath,
    });

    await updateStoredPhotos(filepath);

    return filepath;

  } catch (error) {
    console.error('Error saving original picture:', error);
    return null;
  }
};

// Function to save generated image to the app cache
// TODO: We are using the term URI incorrectly, we need to fix that.
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

    await updateStoredPhotos(filepath);

    return filepath;

  } catch (error: any) {
    console.error('Error saving image to cache:', error);
    return null;
  }
};

const updateStoredPhotos = async (filepath: string) => {
  try {
    const photosFile = `${FileSystem.documentDirectory}photos.json`;
    let storedPhotos = [];
    const photosFileInfo = await FileSystem.getInfoAsync(photosFile);

    if (photosFileInfo.exists) {
      const storedPhotosJSON = await FileSystem.readAsStringAsync(photosFile);
      storedPhotos = JSON.parse(storedPhotosJSON);
    }

    storedPhotos.push(filepath);
    await FileSystem.writeAsStringAsync(photosFile, JSON.stringify(storedPhotos));

  } catch (error: any) {
    console.error('Error saving image to cache:', error);
    return null;
  }
};

const uploadImageToFirebase = async (imageUri: string, filename: string): Promise<string> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const storageRef = ref(storage, `images/${filename}`);
    await uploadBytes(storageRef, blob);

    // Fetch the download URL after upload
    const downloadUrl = await getDownloadURL(storageRef);
    console.log(`Uploaded ${filename} and got download URL: ${downloadUrl}`);
    return downloadUrl

  } catch (error) {
    console.error(`Error uploading ${filename} to Firebase Storage:`, error);
    throw error;
  }
};

// Function to write a document to Firestore
const writeDocumentToFirestore = async (collectionName: string, data: any): Promise<void> => {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    console.log(`Document written with ID: ${docRef.id}`);
  } catch (error) {
    console.error("Error writing document: ", error);
    throw error;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photo: {
    width: 100,
    height: 100,
    margin: 5,
  },
});
