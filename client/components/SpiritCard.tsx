import React, { useState } from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import { Spirit } from '@/models/Spirit';

interface SpiritCardProps {
  visible: boolean;
  spiritData: Spirit;
  onClose: () => void;
}

const typeImages: { [key: string]: any } = {
  Fire: require('@/assets/images/typeIcons/fire.png'),
  Water: require('@/assets/images/typeIcons/water.png'),
  Rock: require('@/assets/images/typeIcons/rock.png'),
  Grass: require('@/assets/images/typeIcons/grass.png'),
  Psychic: require('@/assets/images/typeIcons/psychic.png'),
  Electric: require('@/assets/images/typeIcons/electric.png'),
  Fighting: require('@/assets/images/typeIcons/fighting.png'),
};

const typeBackgrounds: { [key: string]: any } = {
  Fire: require('@/assets/images/background/fire-background.jpeg'),
  Water: require('@/assets/images/background/water-background.jpeg'),
  Rock: require('@/assets/images/background/rock-background.jpeg'),
  Grass: require('@/assets/images/background/grass-background.jpeg'),
  Psychic: require('@/assets/images/background/psychic-background.jpeg'),
  Electric: require('@/assets/images/background/electric-background.jpeg'),
  Fighting: require('@/assets/images/background/fighting-background.jpeg'),
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
          <ImageBackground 
            source={typeBackgrounds[spiritData.primaryType]}
            resizeMode="cover"
            blurRadius={10}
            style={styles.spiritCard}>
              <View style={styles.overlay} />
            <View style={styles.cardHeader}>
              <Text style={styles.spiritName}>{spiritData.name}</Text>
              <Image
                source={typeImages[spiritData.primaryType]}
                style={styles.typeIcon}
              />
            </View>
            <View style={styles.cardBody}>
              {/* Generated Image */}
              <Image
                source={{
                  uri: showOriginal
                    ? spiritData.originalImageDownloadUrl
                    : spiritData.generatedImageDownloadUrl,
                }}
                style={styles.mainImage}
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

              <View style={styles.bannerContainer}>
                <Text style={styles.bannerText}>
                  Jelly Creature {'•'} HT: {spiritData.height}cm {'•'} WT: {spiritData.weight}kg
                </Text>
              </View>
            </View>
            <View style={styles.spiritMoves}>
              <View style={styles.spiritMovesRow}>
                <Text style={styles.spiritMovesTitle}>Punch</Text>
                <Text style={styles.spiritMovesTitle}>Special</Text>
              </View>
              <View style={styles.spiritMovesRow}>
                <Text style={styles.spiritMovesTitle}>Tag Team</Text>
                <Text style={styles.spiritMovesTitle}>Growl</Text>
              </View>
            </View>
            <Text style={styles.spiritDescription}>"{truncateDescription(spiritData.description)}" —Spiritologist</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.footerText}>© 2024 Spirit Snap — Created: date</Text>
            </View>
          </ImageBackground>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default SpiritCard;

const { width, height } = Dimensions.get('window');
// Determine the max size based on the screen size and aspect ratio
const aspectRatio = 5 / 7;
const cardWidth = Math.min(width, height * (7 / 5));
const cardHeight = cardWidth / aspectRatio;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
  },
  spiritCard: {
    width: cardWidth,
    height: cardHeight,
    borderColor: 'silver',
    borderRadius: 10,
    borderWidth: cardWidth * .035,
    alignItems: 'center',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject, // Ensures the overlay covers the entire card
    backgroundColor: 'rgba(255, 255, 255, 0.09)', // Semi-transparent white for a pale effect
  },
  cardHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spiritName: {
    fontSize: cardWidth * .045,
    color: 'white',
    textAlign: 'left',
    alignSelf: 'stretch',
    marginTop: cardWidth * .02,
    marginLeft: cardWidth * .03,
    fontFamily: 'LibreBaskerville-Bold',
  },
  typeIcon: {
    width: cardWidth * .07,
    height: cardWidth * .07,
    margin: cardWidth * .012,
    borderRadius: 25, // Makes the image circular
    borderWidth: cardWidth * .002,
    borderColor: '#fff',
    backgroundColor: 'black',
    resizeMode: 'contain', // Ensures the entire image is visible
    overflow: 'hidden', // Ensures circular shape without cropping issues
  },
  cardBody: {
    position: 'relative', // allows absolute positioning for the overlay
    flex: 1,
    width: '90%',
    alignItems: 'center',
  },
  mainImage: {
    flex: 1,
    alignSelf: 'stretch',
    borderWidth: cardWidth * .004,
    borderColor: 'white',
  },
  overlayContainer: {
    position: 'absolute',
    bottom: cardWidth * .06,
    right: cardWidth * .01,
    width: cardWidth * .16,
    height: cardWidth * .16,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: cardWidth * .004,
    borderColor: '#000',
  },
  overlayImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerContainer: {
    width: '100%',
    backgroundColor: '#CC5500',
    padding: cardWidth * .01,
    alignItems: 'center',
  },
  bannerText: {
    fontSize: cardWidth * .025,
    color: 'white',
    textAlign: 'left',
    fontFamily: 'LibreBaskerville-Regular',
  },
  spiritMoves: {
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: cardWidth * .02,
  },
  spiritMovesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: cardWidth * .01,
  },
  spiritMovesTitle: {
    fontSize: cardWidth * .035,
    color: 'white',
    textAlign: 'center',
    fontFamily: 'LibreBaskerville-Regular',
  },
  cardFooter: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: cardWidth * .006,
  },
  spiritDescription: {
    fontSize: cardWidth * .03,
    color: 'white',
    textAlign: 'center',
    padding: cardWidth * .02,
    fontFamily: 'LibreBaskerville-Italic',
  },
  footerText: {
    fontSize: cardWidth * .02,
    color: 'white',
  },
  closeButton: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    marginTop: 20,
    marginBottom: 10,
  },
});
