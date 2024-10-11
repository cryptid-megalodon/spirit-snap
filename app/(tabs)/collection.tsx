import React, { useEffect, useState } from 'react';
import { FlatList, Image, View, Text, StyleSheet, Platform } from 'react-native';

const CollectionScreen = () => {
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Retrieve photos from localStorage on web
      const storedPhotos = JSON.parse(localStorage.getItem('storedPhotos') || '[]');
      setPhotos(storedPhotos);
    } else {
      // TODO: Retrieve phots when running from mobile.

    }
  }, []);

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
