import React, { useState } from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
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
          <View style={styles.spiritCard}>
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
          </View>
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
    borderColor: 'orange',
    borderRadius: 10,
    borderWidth: cardWidth * .035,
    backgroundColor: '#d3d3d3', // Inner container background color
    alignItems: 'center',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  cardHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spiritName: {
    fontSize: cardWidth * .045,
    color: '#000',
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
    borderColor: 'black',
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
    color: 'black',
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
    color: 'black',
    textAlign: 'center',
    padding: cardWidth * .02,
    fontFamily: 'LibreBaskerville-Italic',
  },
  footerText: {
    fontSize: cardWidth * .02,
    color: 'black',
  },
  closeButton: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    marginTop: 20,
    marginBottom: 10,
  },
});
