
import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import HPBar from '@/components/HPBar';
import { Spirit } from '@/models/Spirit';

interface SpiritBenchCardProps {
  spirit: Spirit;
}

const SpiritBenchCard: React.FC<SpiritBenchCardProps> = ({ spirit }) => {
  const displayType = (primaryType: string, secondaryType: string): string => {
    return secondaryType === 'None' ? primaryType : `${primaryType}/${secondaryType}`;
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: spirit.generatedImageDownloadUrl }} style={styles.image} resizeMode="cover" />
      
      <View style={styles.typeOverlay}>
        <Text style={styles.type}>{displayType(spirit.primaryType, spirit.secondaryType)}</Text>
      </View>

      <View style={styles.hpBarContainer}>
        <HPBar currentHP={spirit.currentHitPoints} maxHP={spirit.maxHitPoints} />
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const cardWidth = width / 3;
const cardHeight = cardWidth / 3;

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    height: cardHeight,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  typeOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    padding: 2,
  },
  type: {
    color: '#fff',
    fontSize: 10,
  },
  hpBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
});

export default SpiritBenchCard;
