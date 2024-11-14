import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, Image, View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { fetchSpirits } from '../firebaseUtils';
import { SpiritData } from '../types';

const CollectionScreen = () => {
  const [photos, setPhotos] = useState<SpiritData[]>([]);
  const [selectedImage, setSelectedImage] = useState<SpiritData | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  const openBaseballCardView = (spiritData: SpiritData) => {
    setSelectedImage(spiritData);
    setShowOriginal(false);
  };

  const closeBaseballCardView = () => {
    setSelectedImage(null);
  };

  const toggleImage = () => {
    setShowOriginal((prev) => !prev);
  };

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const getPhotos = async () => {
        try {
          const spirits = await fetchSpirits();
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

  const truncateDescription = (description: string, sentenceCount: number = 2): string => {
    const sentences = description.split('. ');
    return sentences.slice(0, sentenceCount).join('. ') + (sentences.length > sentenceCount ? '.' : '');
  };

  const displayType = (primaryType: string, secondaryType: string): string => {
    return secondaryType == "None" ? primaryType : primaryType + "/" + secondaryType
  }

  const renderPhoto = ({ item }: { item: SpiritData }) => (
    <TouchableOpacity onPress={() => openBaseballCardView(item)}>
      <Image source={{ uri: item.generatedImageDownloadUrl }} style={styles.image} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {photos.length > 0 ? (
        <FlatList
          data={[...photos].reverse()}
          renderItem={renderPhoto}
          keyExtractor={(item) => item.id}
          numColumns={3}
        />
      ) : (
        <Text>No photos available</Text>
      )}

{selectedImage && (
  <Modal visible={true} transparent={true} animationType="slide">
    <View style={styles.modalContainer}>
      <Text style={styles.name}>{selectedImage.name}</Text>

      {/* Main Image - shows either original or generated based on showOriginal */}
      <Image
        source={{ uri: showOriginal ? selectedImage.originalImageDownloadUrl : selectedImage.generatedImageDownloadUrl }}
        style={styles.fullImage}
      />

      <Text style={styles.description}>{truncateDescription(selectedImage.description)}</Text>
      <Text style={styles.type}>Type: {displayType(selectedImage.primaryType, selectedImage.secondaryType)}</Text>

      {/* Small Image in Bottom Right */}
      <TouchableOpacity onPress={toggleImage} style={styles.smallImageContainer}>
        <Image
          source={{ uri: showOriginal ? selectedImage.generatedImageDownloadUrl : selectedImage.originalImageDownloadUrl }}
          style={styles.smallImage}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={closeBaseballCardView} style={styles.closeButton}>
        <Text>Close</Text>
      </TouchableOpacity>
    </View>
  </Modal>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  fullImage: {
    width: 300,
    height: 300,
    borderRadius: 15,
    marginBottom: 20,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  type: {
    fontSize: 16,
    color: 'white',
    marginBottom: 20,
  },
  // Wraps the small image and positions it in the bottom right
  smallImageContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  smallImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  closeButton: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    marginTop: 20,
  },
});

export default CollectionScreen;
