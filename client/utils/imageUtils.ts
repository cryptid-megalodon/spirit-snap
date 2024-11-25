// imageUtils.ts

import axios from 'axios';

import { useAuth } from '../contexts/AuthContext';

// Main endpoint into processing user images.
// Function to make API call to process the camera image using the backend server.
export const processImageBackendCall = async (base64Image: string, userId: string) => {
  const url = process.env.EXPO_PUBLIC_BACKEND_SERVER_URL;
  if (url == undefined) {
    throw Error("API URL is not set.")
  }
  const { user } = useAuth();
  if (user == null) {
      throw new Error("User not logged in");
  }
  const idToken = await user.getIdToken();
  const endpoint = url + "/ProcessImage";
  console.log("Process Image Endpoint:", endpoint)
  try {
    const response = await axios.post(
      endpoint,
      {
        'base64Image': base64Image,
        'userId': userId
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      }
    );
    console.log("ProcessImage Response Status:", response.status);
    return null;
  } catch (error) {
    console.error('Error fetching image caption:', error);
    return null;
  }
};
