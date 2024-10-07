import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import axios from 'axios'; // To handle the API requests

const OPENAI_API_KEY = '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';
const REPLICATE_API_TOKEN = 'r8_TUj2UXpidi7ynm1g2TSIKV0dL4DPIww3c1om8';

export default function Tab() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photos, setPhotos] = useState<string[]>([]); // Store multiple photos
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

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
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
                  image_url: {url: base64Image},
                }
              ]
            },
          ],
          max_tokens: 300,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
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
            Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
            Prefer: 'wait', // This tells the server to wait until the image is generated before responding
          },
        }
      );
      const generatedImageUri = response.data.output[0];
      return generatedImageUri;
    } catch (error) {
      console.error('Error generating image:', error.response?.data || error.message);
      return null;
    }
  };

  // Function to save generated image to the app cache
  const saveGeneratedImage = async (imageUri: string) => {
    try {
      if (Platform.OS === 'web') {
        const storedPhotos = JSON.parse(localStorage.getItem('storedPhotos') || '[]');
        storedPhotos.push(imageUri);
        localStorage.setItem('storedPhotos', JSON.stringify(storedPhotos));
      }
    } catch (error) {
      console.error('Error saving image to cache:', error);
      return null;
    }
  };

  const takePicture = async () => {
    try {
      if (cameraViewRef.current) {
        const picture = await cameraViewRef.current.takePictureAsync({ base64: true });
        if (picture && picture.uri && picture.base64) {
          // Save photos in localStorage for web
          if (Platform.OS === 'web') {
            const storedPhotos = JSON.parse(localStorage.getItem('storedPhotos') || '[]');
            storedPhotos.push(picture.uri);
            localStorage.setItem('storedPhotos', JSON.stringify(storedPhotos));
          }

          // Step 1: Get the image caption from OpenAI
          const caption = await getImageCaption(picture.base64);
          if (!caption) {
            console.error('Error: Failed to generate caption');
            return;
          }

          // Step 2: Generate cartoon monster image using Replicate
          const generatedImageUri = await generateCartoonMonster(caption);
          if (!generatedImageUri) {
            console.error('Error: Failed to generate cartoon monster');
            return;
          }

          // Step 3: Save the generated image to cache
          saveGeneratedImage(generatedImageUri);
          const newPhotos = [...photos, picture.uri, generatedImageUri];
          setPhotos(newPhotos); // Save photos in state
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
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraViewRef}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={takePicture}>
            <Text style={styles.text}>Take Picture</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

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
});
