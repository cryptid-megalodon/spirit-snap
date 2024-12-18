import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import HPBar from '@/components/HPBar';
import { Spirit } from '@/models/Spirit';

interface BattleSpiritCardProps {
  spirit: Spirit;
}

const BattleSpiritCard: React.FC<BattleSpiritCardProps> = ({ spirit }) => {
  const displayType = (primaryType: string, secondaryType: string): string => {
    return secondaryType === 'None' ? primaryType : `${primaryType}/${secondaryType}`;
  };
  console.log('Spirit:', spirit);

  return (
    <View style={styles.container}>
      {/* Top Text Bar */}
      <View style={styles.textBar}>
        <Text style={styles.name}>{spirit.name}</Text>
        <Text style={styles.type}>{displayType(spirit.primaryType, spirit.secondaryType)}</Text>
      </View>

      {/* Image */}
      <Image source={{ uri: spirit.generatedImageDownloadUrl }} style={styles.image} resizeMode="cover" />

      {/* HP Bar at the Bottom */}
      <View style={styles.hpBarContainer}>
        <HPBar currentHP={100} maxHP={100} />
      </View>
    </View>
  );
};

// Dynamic styles to make it square
const { width } = Dimensions.get('window');
const size = width * 0.4; // 40% of screen width for demonstration

const styles = StyleSheet.create({
  container: {
    width: size,
    height: size,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E', // Dark background
  },
  textBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
  },
  name: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  type: {
    color: '#fff',
    fontSize: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  hpBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
});

export default BattleSpiritCard;