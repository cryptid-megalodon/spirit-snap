import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  FlatList,
  Image,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import SpiritCard from '../SpiritCard';
import { Spirit } from '../../models/Spirit';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useTeams } from '@/contexts/TeamContext';
import { Team } from '../../models/Team';
import { useSpiritContext } from '@/contexts/SpiritContext';

export default function CollectionScreen() {
  const searchParams = useLocalSearchParams();
  // Collection Screen can be in edit mode or view mode.
  const [openTeamEditor, setOpenTeamEditor] = useState<boolean>(searchParams.openTeamEditor === 'true');
  const [openSpiritCardView, setOpenSpiritCardView] = useState<boolean>(searchParams.openTeamEditor === 'false');
  const [spirits, setSpirits] = useState<Spirit[]>([]);
  const [selectedSpirit, setSelectedSpirit] = useState<Spirit | null>(null);
  const { getUserSpirits } = useSpiritContext();

  useFocusEffect(() => {
    setOpenTeamEditor(searchParams.openTeamEditor === 'true');
    setOpenSpiritCardView(searchParams.openTeamEditor === 'false');
  })

  // Load spirits in collection FlatList.
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const getPhotos = async () => {
        try {
          const spirits = await getUserSpirits();
          if (isActive) {
            setSpirits(spirits);
          }
        } catch (error) {
          console.error('Error retrieving photos:', error);
          if (isActive) {
            setSpirits([]);
          }
        }
      };

      getPhotos();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const handleSelection = (spirit: Spirit) => {
    // If the spirit is already selected, unselect it.
    if (spirit.id == selectedSpirit?.id) {
      setSelectedSpirit(null);
    } else {
      setSelectedSpirit(spirit);
    }
  }

  const renderSpirit = ({ item }: { item: Spirit }) => (
    <View style={item.id === selectedSpirit?.id && styles.editorSelect}>
      <TouchableOpacity
        onPress={() => { handleSelection(item) }
        }
      >
        <Image 
          source={{ uri: item.generatedImageDownloadUrl || undefined }} 
          style={[
            styles.spiritAvatar,
            item.id === selectedSpirit?.id && styles.editorSelect
          ]} 
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {spirits.length > 0 ? (
        <FlatList
          data={spirits}
          renderItem={renderSpirit}
          keyExtractor={(item) => item.id || ''}
          numColumns={3}
          style={styles.list}
        />
      ) : (
        <Text>No spirits available</Text>
      )}

      {openSpiritCardView && selectedSpirit && (
        <SpiritCard
          visible={true}
          spiritData={selectedSpirit}
          onClose={() => setSelectedSpirit(null)}
        />
      )}

      {openTeamEditor && (<TeamEditorCarousel setOpenTeamEditor={setOpenTeamEditor} selectedSpirit={selectedSpirit} />)}
    </View>
  );
}

interface TeamEditorCarouselProps {
  setOpenTeamEditor: (value: boolean) => void;
  selectedSpirit: Spirit | null;
}

function TeamEditorCarousel({ setOpenTeamEditor, selectedSpirit }: TeamEditorCarouselProps) {
  const { getEditTeam, addOrUpdateTeam } = useTeams();
  const navigation = useNavigation();

  const [editTeam, setEditTeam] = useState<Team>(getEditTeam());
  const [showNameModal, setShowNameModal] = useState(false);
  const [error, setError] = useState('');
  const [shelfSlots, setShelfSlots] = useState<Array<Spirit | null>>([]);

  // Updates the team used to render the carousel if it changed.
  useEffect(() => {
    setEditTeam(getEditTeam());
  }, [getEditTeam]);

  useEffect(() => {
    // Pad shelf slots with nulls to make it a 6-slot shelf.
    setShelfSlots(editTeam.spirits.length < 6 ? editTeam.spirits.concat(Array(6 - editTeam.spirits.length).fill(null)) : editTeam.spirits);
  }, [editTeam]);

  useEffect(() => {
    return () => {
      setShowNameModal(false);
    };
  }, []);

  const saveTeam = async () => {
    const filledSpirits = editTeam.spirits.filter(spirit => spirit !== null);
    if (filledSpirits.length === 0) {
      setError('Team must have at least one spirit!');
      return;
    }
    
    if (!editTeam.name.trim()) {
      setError('Please enter a team name');
      return;
    }

    try {
      await addOrUpdateTeam(editTeam);
    } catch (error) {
      console.error('Error saving team:', error);
      setError('Failed to save team');
      return;
    }
    setShowNameModal(false);
    setError('');
    navigation.goBack();
  };

  const handleEditShelfSlot = (index: number): void => {
    const slotSpirit = shelfSlots[index];
    if (!selectedSpirit) {
      // No spirit selected - only handle removal
      if (slotSpirit) {
        // Remove spirit and shuffle remaining spirits left
        const updatedSpirits = editTeam.spirits.filter((spirit) => spirit !== slotSpirit);
        setEditTeam({
          ...editTeam,
          spirits: updatedSpirits
        });
      }
      return;
    }

    // Check if selected spirit is already on team
    const existingIndex = editTeam.spirits.findIndex(spirit => spirit?.id === selectedSpirit.id);
    const updatedSpirits = [...editTeam.spirits];

    if (existingIndex !== -1) {
      // Spirit is already on team
      if (slotSpirit) {
        // Swap positions if target slot has a spirit
        [updatedSpirits[existingIndex], updatedSpirits[index]] = [updatedSpirits[index], updatedSpirits[existingIndex]];
      } else {
        // Move to back if target slot is empty
        updatedSpirits.splice(existingIndex, 1);
        updatedSpirits.push(selectedSpirit);
      }
    } else {
      // Spirit is not on team yet
      if (slotSpirit !== null) {
        // Replace existing spirit
        updatedSpirits[index] = selectedSpirit;
      } else {
        // Add to end of team
        updatedSpirits.push(selectedSpirit);
        console.log('Updated spirits:', updatedSpirits);
      }
    }
    setEditTeam({
      ...editTeam,
      spirits: updatedSpirits
    });
  };

  const renderCarouselSlot = (slotSpirit: Spirit | null, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.carouselSlot}
      onPress={ () => handleEditShelfSlot(index) }
    >
      {slotSpirit ? (
        <Image
          source={{ uri: slotSpirit.generatedImageDownloadUrl || undefined }}
          style={styles.carouselImage}
        />
      ) : (
        <Text style={styles.emptySlotText}>Empty</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View >
      <View style={styles.carouselContainer}>
        <View style={styles.carousel}>
          {shelfSlots.map((selectedSpirit, index) => renderCarouselSlot(selectedSpirit, index))}
        </View>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => setShowNameModal(true)}
        >
          <Text style={styles.saveButtonText}>Save Team</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showNameModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Enter team name"
              value={editTeam.name}
              onChangeText={(newName) => setEditTeam({
                ...editTeam,
                name: newName
              })}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowNameModal(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveModalButton]}
                onPress={saveTeam}
              >
                <Text style={styles.saveModalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    flex: 1,
    marginBottom: 150,
  },
  spiritAvatar: {
    margin: 5,
    width: 125,
    height: 125,
    borderRadius: 10,
  },
  editorSelect: {
    backgroundColor: 'lightgreen',
  },
  carouselContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  carousel: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  carouselSlot: {
    width: 50,
    height: 50,
    backgroundColor: '#eee',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  carouselImage: {
    width: 45,
    height: 45,
    borderRadius: 6,
  },
  emptySlotText: {
    fontSize: 12,
    color: '#999',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '80%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    padding: 10,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  saveModalButton: {
    backgroundColor: '#007AFF',
  },
  saveModalButtonText: {
    color: '#fff',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

