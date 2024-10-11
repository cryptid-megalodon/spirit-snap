import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, Image, View, Text, StyleSheet, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system'; // Import expo-file-system

const CollectionScreen = () => {
  const [photos, setPhotos] = useState<string[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
  
      const getPhotos = async () => {
        if (Platform.OS === 'web') {
          const storedPhotos = JSON.parse(localStorage.getItem('storedPhotos') || '[]');
          if (isActive) {
            setPhotos(storedPhotos);
          }
        } else {
          try {
            const photosFile = `${FileSystem.documentDirectory}photos.json`;
            const photosFileInfo = await FileSystem.getInfoAsync(photosFile);
  
            if (photosFileInfo.exists) {
              const storedPhotosJSON = await FileSystem.readAsStringAsync(photosFile);
              const storedPhotos = JSON.parse(storedPhotosJSON);
              if (isActive) {
                setPhotos(storedPhotos);
              }
            } else {
              if (isActive) {
                setPhotos([]);
              }
            }
          } catch (error) {
            console.error('Error retrieving photos:', error);
            if (isActive) {
              setPhotos([]);
            }
          }
        }
      };
  
      getPhotos();
  
      return () => {
        isActive = false;
      };
    }, [])
  );
  

  const renderPhoto = ({ item }: { item: string }) => (
    <Image source={{ uri: item }} style={styles.image} />
  );

  return (
    <View style={styles.container}>
      {photos.length > 0 ? (
        <FlatList
          data={photos}
          renderItem={renderPhoto}
          keyExtractor={(item, index) => index.toString()}
          numColumns={3} // Display 3 photos per row
        />
      ) : (
        <Text>No photos available</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 10,
  },
});

export default CollectionScreen;
