import React, { useState } from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Spirit } from '@/models/Spirit';

interface SpiritCardProps {
  visible: boolean;
  spiritData: Spirit;
  onClose: () => void;
}

const SpiritCard: React.FC<SpiritCardProps> = ({ visible, spiritData, onClose }) => {
  const [showOriginal, setShowOriginal] = useState(false);

  const toggleImage = () => {
    setShowOriginal((prev) => !prev);
  };

  const truncateDescription = (description: string, sentenceCount: number = 2): string => {
    const sentences = description.split('. ');
    return (
      sentences.slice(0, sentenceCount).join('. ') +
      (sentences.length > sentenceCount ? '.' : '')
    );
  };

  const displayType = (primaryType: string, secondaryType: string): string => {
    return secondaryType === 'None' ? primaryType : `${primaryType}/${secondaryType}`;
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <Text style={styles.name}>{spiritData.name}</Text>

        {/* Main Image - shows either original or generated based on showOriginal */}
        <Image
          source={{
            uri: showOriginal
              ? spiritData.originalImageDownloadUrl
              : spiritData.generatedImageDownloadUrl,
          }}
          style={styles.fullImage}
        />

        <Text style={styles.description}>
          {truncateDescription(spiritData.description)}
        </Text>
        <Text style={styles.type}>
          Type: {displayType(spiritData.primaryType, spiritData.secondaryType)}
        </Text>

        {/* Small Image in Bottom Right */}
        <TouchableOpacity onPress={toggleImage} style={styles.smallImageContainer}>
          <Image
            source={{
              uri: showOriginal
                ? spiritData.generatedImageDownloadUrl
                : spiritData.originalImageDownloadUrl,
            }}
            style={styles.smallImage}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text>Close</Text>
        </TouchableOpacity>
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
