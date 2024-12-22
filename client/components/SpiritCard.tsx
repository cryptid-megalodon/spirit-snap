import React, { useState } from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Spirit } from '@/models/Spirit';

interface SpiritCardProps {
  visible: boolean;
  spiritData: Spirit;
  onClose: () => void;
}

const typeImages: { [key: string]: any } = {
  Fire: require('@/assets/images/fire.png'),
  Water: require('@/assets/images/water.png'),
  Rock: require('@/assets/images/rock.png'),
  Grass: require('@/assets/images/grass.png'),
  Psychic: require('@/assets/images/psychic.png'),
  Electric: require('@/assets/images/electric.png'),
  Fighting: require('@/assets/images/fighting.png'),
};

const SpiritCard: React.FC<SpiritCardProps> = ({ visible, spiritData, onClose }) => {
  const [showOriginal, setShowOriginal] = useState(false);

  const toggleImage = () => {
    setShowOriginal((prev) => !prev);
  };

  const truncateDescription = (description: string, sentenceCount: number = 1): string => {
    const sentences = description.split('. ');
    return (
      sentences.slice(0, sentenceCount).join('. ') +
      (sentences.length > sentenceCount ? '.' : '')
    );
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.outerContainer}>
          <View style={styles.innerContainer}>
            <Image
              source={typeImages[spiritData.primaryType]}
              style={styles.typeIcon}
            />
            <Text style={styles.name}>{spiritData.name}</Text>

            <View style={styles.imageContainer}>
              {/* Generated Image */}
              <Image
                source={{
                  uri: showOriginal
                    ? spiritData.originalImageDownloadUrl
                    : spiritData.generatedImageDownloadUrl,
                }}
                style={styles.fullImage}
              />

              {/* Overlay for Original Image */}
              <TouchableOpacity onPress={toggleImage} style={styles.overlayContainer}>
                <Image
                  source={{
                    uri: showOriginal
                      ? spiritData.generatedImageDownloadUrl
                      : spiritData.originalImageDownloadUrl,
                  }}
                  style={styles.overlayImage}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.bannerContainer}>
              <Text style={styles.bannerText}>
                {truncateDescription(spiritData.description)} {'•'} HT: {spiritData.height}cm {'•'} WT: {spiritData.weight}kg
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SpiritCard;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
  },
  outerContainer: {
    maxWidth: '100%', // Ensure it doesn't exceed the screen width
    maxHeight: '97%', // Constrain height to avoid overlapping the top or bottom
    padding: 15,
    backgroundColor: 'orange',
    borderRadius: 10, // Rounded edges for the outer container
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  innerContainer: {
    width: '100%',
    maxHeight: '100%',
    backgroundColor: '#d3d3d3', // Inner container background color
    borderRadius: 0, // Square edges for the inner container
    alignItems: 'center',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  typeIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 35,
    height: 35,
    borderRadius: 25, // Makes the image circular
    borderWidth: 2,
    borderColor: '#fff', // Optional border for better visibility
    resizeMode: 'contain', // Ensures the entire image is visible
    overflow: 'hidden', // Ensures circular shape without cropping issues
  },
  imageContainer: {
    position: 'relative', // Allows absolute positioning for the overlay
    width: '100%',
    aspectRatio: 1,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '90%', // Slightly smaller than the container
    aspectRatio: 1, // Maintain square dimensions
    resizeMode: 'cover',
    backgroundColor: '#fff', // Optional background for better contrast
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#8B4000',
  },
  overlayContainer: {
    position: 'absolute',
    bottom: 5, // Spacing from the bottom
    right: 5, // Spacing from the right
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2, // Thin border
    borderColor: '#000', // Black border color
  },
  overlayImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'left',
    alignSelf: 'stretch',
    marginBottom: 5,
    marginTop: 10,
    marginLeft: 10,
  },
  bannerContainer: {
    width: '100%',
    backgroundColor: '#CC5500', // Banner background color
    padding: 10,
    borderRadius: 0,
    marginTop: -25, // Slight overlap with the image
    alignItems: 'center', // Center the text horizontally
  },
  bannerText: {
    fontSize: 14,
    color: 'white', // Black text
    textAlign: 'left',
  },
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
    marginBottom: 10,
  },
});
