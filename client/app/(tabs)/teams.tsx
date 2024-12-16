import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { useState } from 'react'
import { useNavigation, useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router'
import { Team } from '@/models/Team'
import { Ionicons } from '@expo/vector-icons'
import { useTeams } from '@/contexts/TeamContext'
import { useParams } from '@/contexts/ParamContext'
import { NavigationProp } from '@react-navigation/native'
import { RootStackParamList } from '@/navigation/types'
import SpiritCard from '@/components/SpiritCard'


export default function TeamsScreen() {
  const navigator = useNavigation<NavigationProp<RootStackParamList>>()
  const { getTeams, setEditTeam, deleteTeam } = useTeams()
  const { setParamValue } = useParams()
  const [selectedSpirit, setSelectedSpirit] = useState<Team['spirits'][number] | null>(null)
  const { mode, teamRef } = useLocalSearchParams()
  const [ selectMode, setSelectMode ] = useState(mode === 'select')
  const router = useRouter()

  useFocusEffect(() => {
    if (mode === 'select') {
      setSelectMode(true)
    } else {
      setSelectMode(false)
    }
  })

  const handleTeamSelection = (team: Team) => {
    return () => {
      setParamValue(team.id)
      router.back()
    }
  }

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
            {!selectMode && (
              <>
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
              </>
            )}
            {selectMode && (
              <TouchableOpacity
                onPress={handleTeamSelection(item)}
                style={styles.iconButton}
              >
                <Ionicons name="checkmark-circle" size={24} color="green" />
              </TouchableOpacity>
            )}
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
      
      {!selectMode && (
        <TouchableOpacity
          style={styles.newTeamButton}
          onPress={() => {
            setEditTeam(null);
            navigator.navigate('collection', { openTeamEditor: true });
          }}
        >
          <Text style={styles.buttonText}>Create New Team</Text>
        </TouchableOpacity>
      )}

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