import React, { useState } from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Spirit } from '@/models/Spirit';

interface SpiritCardProps {
  visible: boolean;
  spiritData: Spirit;
  onClose: () => void;
}

const typeImages: { [key: string]: any } = {
  Art: require('@/assets/images/typeIcons/art-icon.webp'),
  Chaos: require('@/assets/images/typeIcons/chaos-icon.webp'),
  Dream: require('@/assets/images/typeIcons/dream-icon.webp'),
  Flame: require('@/assets/images/typeIcons/flame-icon.webp'),
  Frost: require('@/assets/images/typeIcons/frost-icon.webp'),
  Growth: require('@/assets/images/typeIcons/growth-icon.webp'),
  Harmony: require('@/assets/images/typeIcons/harmony-icon.webp'),
  Light: require('@/assets/images/typeIcons/light-icon.webp'),
  Rune: require('@/assets/images/typeIcons/rune-icon.webp'),
  Shadow: require('@/assets/images/typeIcons/shadow-icon.webp'),
  Sky: require('@/assets/images/typeIcons/sky-icon.webp'),
  Song: require('@/assets/images/typeIcons/song-icon.webp'),
  Spark: require('@/assets/images/typeIcons/spark-icon.webp'),
  Spirit: require('@/assets/images/typeIcons/spirit-icon.webp'),
  Steel: require('@/assets/images/typeIcons/steel-icon.webp'),
  Stone: require('@/assets/images/typeIcons/stone-icon.webp'),
  Thread: require('@/assets/images/typeIcons/thread-icon.webp'),
  Wave: require('@/assets/images/typeIcons/wave-icon.webp'),
};

const typeBackgrounds: { [key: string]: any } = {
  Art: require('@/assets/images/background/art-background.jpg'),
  Chaos: require('@/assets/images/background/chaos-background.jpg'),
  Dream: require('@/assets/images/background/dream-background.jpg'),
  Flame: require('@/assets/images/background/flame-background.jpg'),
  Frost: require('@/assets/images/background/frost-background.jpg'),
  Growth: require('@/assets/images/background/growth-background.jpg'),
  Harmony: require('@/assets/images/background/harmony-background.jpg'),
  Light: require('@/assets/images/background/light-background.jpg'),
  Rune: require('@/assets/images/background/rune-background.jpg'),
  Shadow: require('@/assets/images/background/shadow-background.jpg'),
  Sky: require('@/assets/images/background/sky-background.jpg'),
  Song: require('@/assets/images/background/song-background.jpg'),
  Spark: require('@/assets/images/background/spark-background.jpg'),
  Spirit: require('@/assets/images/background/spirit-background.jpg'),
  Steel: require('@/assets/images/background/steel-background.jpg'),
  Stone: require('@/assets/images/background/stone-background.jpg'),
  Thread: require('@/assets/images/background/thread-background.jpg'),
  Wave: require('@/assets/images/background/wave-background.jpg'),
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

            <LinearGradient
              colors={['#C0C0C0', '#FFFFFF', '#A9A9A9']} // Silver gradient colors
              start={{ x: 0, y: 0 }} // Top-left
              end={{ x: 1, y: 1 }} // Bottom-right
              style={styles.bannerContainer}>
              <Text style={styles.bannerText}>
                Jelly Creature {'•'} HT: {spiritData.height}cm {'•'} WT: {spiritData.weight}kg
              </Text>
            </LinearGradient>
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
            <Text style={styles.spiritDescription}>{spiritData.description}</Text>
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
    marginBottom: cardWidth * .01,
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
    width: '95%',
    backgroundColor: '#424949',
    padding: cardWidth * .01,
    alignItems: 'center',
    borderColor: 'black',
    borderWidth: cardWidth * .004,
  },
  bannerText: {
    fontSize: cardWidth * .025,
    color: 'black',
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
