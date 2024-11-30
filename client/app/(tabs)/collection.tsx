import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  FlatList,
  Image,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { User } from 'firebase/auth';
import SpiritCard from '../SpiritCard';
import { Spirit } from '../../models/Spirit';


export default function CollectionScreen() {
  const [photos, setPhotos] = useState<Spirit[]>([]);
  const [selectedImage, setSelectedImage] = useState<Spirit | null>(null);
  const { user } = useAuth();

  const openSpiritCardView = (spiritData: Spirit) => {
    setSelectedImage(spiritData);
  };

  const closeSpiritCardView = () => {
    setSelectedImage(null);
  };

  useFocusEffect(
    React.useCallback(() => {
      if (!user) return;
      let isActive = true;

      const getPhotos = async () => {
        try {
          const spirits = await fetchSpirits(user);
          if (isActive) {
            setPhotos(spirits);
          }
        } catch (error) {
          console.error('Error retrieving photos:', error);
          if (isActive) {
            setPhotos([]);
          }
        }
      };

      getPhotos();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const renderPhoto = ({ item }: { item: Spirit }) => (
    <TouchableOpacity onPress={() => openSpiritCardView(item)}>
      <Image source={{ uri: item.generatedImageDownloadUrl }} style={styles.image} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {photos.length > 0 ? (
        <FlatList
          data={photos}
          renderItem={renderPhoto}
          keyExtractor={(item) => item.id}
          numColumns={3}
        />
      ) : (
        <Text>No photos available</Text>
      )}

      {selectedImage && (
        <SpiritCard
          visible={true}
          spiritData={selectedImage}
          onClose={closeSpiritCardView}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Your existing styles
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 10,
  },
  // Remove modal-specific styles from here
});

// Include fetchSpirits function as it is
async function fetchSpirits(user: User): Promise<Spirit[]> {
  const url = process.env.EXPO_PUBLIC_BACKEND_SERVER_URL;
  if (url == undefined) {
    throw Error('API URL is not set.');
  }
  if (user == null) {
    throw new Error('User not logged in');
  }
  console.log('FetchSpirits User:', user);
  const idToken = await user.getIdToken();
  const endpoint = url + '/FetchSpirits';
  console.log('FetchSpirits Endpoint:', endpoint);
  try {
    const response = await axios.get(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });
    const spiritsData = response.data as Spirit[];
    console.log('Non-filtered FetchSpirits Spirits Data:', spiritsData);
    var filtered_spirits = spiritsData.filter(
      (spirit) =>
        spirit.id !== '' &&
        spirit.name !== '' &&
        spirit.description !== '' &&
        spirit.primaryType !== '' &&
        spirit.secondaryType !== '' &&
        spirit.originalImageDownloadUrl !== '' &&
        spirit.generatedImageDownloadUrl !== ''
    );
    return filtered_spirits;
  } catch (error) {
    console.error('Error fetching spirts:', error);
    return [];
  }
}
