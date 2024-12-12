import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { Link, useNavigation } from 'expo-router'
import { Team } from '../../models/Team'
import { Ionicons } from '@expo/vector-icons'
import { useTeams } from '@/contexts/TeamContext'
import { NavigationProp } from '@react-navigation/native'
import { RootStackParamList } from '../../navigation/types'
import SpiritCard from '@/app/SpiritCard'
import { useState } from 'react'


export default function TeamsScreen() {
  const navigator = useNavigation<NavigationProp<RootStackParamList>>()
  const { getTeams, setEditTeam, deleteTeam } = useTeams()
  const [selectedSpirit, setSelectedSpirit] = useState<Team['spirits'][number] | null>(null)

  console.log('getTeams:', getTeams())
  const renderTeamSpirits = (spirits: Team['spirits']) => {
    return (
      <View style={styles.spiritsContainer}>
        {Array(6).fill(null).map((_, index) => (
          <View
            key={index}
            style={styles.spiritSlot}
          >
            {spirits && spirits[index] ? (
              <TouchableOpacity
                onPress={() => setSelectedSpirit(spirits[index])}
                style={{ width: '100%', height: '100%' }}
              >
                <Image
                  source={{ uri: spirits[index].generatedImageDownloadUrl || undefined }}
                  style={{ width: '100%', height: '100%', borderRadius: 8 }}
                />
              </TouchableOpacity>
            ) : (
              <Text>Empty</Text>
            )}
          </View>
        ))}
      </View>
    )
  }

  const renderTeamItem = ({ item }: { item: Team }) => (
    <View style={styles.teamRow}>
      <View style={styles.teamInfo}>
        <View style={styles.teamHeader}>
          <Text style={styles.teamName}>{item.name || 'Unnamed Team'}</Text>
          <View style={styles.teamActions}>
            <TouchableOpacity
              onPress={() => {
                setEditTeam(item.id);
                navigator.navigate('collection', { openTeamEditor: true });
              }}
              style={styles.iconButton}
            >
              <Ionicons name="pencil" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deleteTeam(item.id)}
              style={styles.iconButton}
            >
              <Ionicons name="trash" size={24} color="red" />
            </TouchableOpacity>
          </View>
        </View>
        {renderTeamSpirits(item.spirits)}
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={getTeams()}
        renderItem={renderTeamItem}
        keyExtractor={(item) => item.id || 'new'}
        style={styles.list}
      />
      
      <TouchableOpacity
        style={styles.newTeamButton}
        onPress={() => {
          setEditTeam(null);
          navigator.navigate('collection', { openTeamEditor: true });
        }
      }
      >
        <Text style={styles.buttonText}>Create New Team</Text>
      </TouchableOpacity>

      {selectedSpirit && (
        <SpiritCard
          visible={true}
          spiritData={selectedSpirit}
          onClose={() => setSelectedSpirit(null)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  newTeamButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  teamRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    alignItems: 'center',
  },
  teamInfo: {
    flex: 1,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamActions: {
    flexDirection: 'row',
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  spiritsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  spiritSlot: {
    width: 48,
    height: 48,
    backgroundColor: '#EEEEEE',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 8,
  },
})