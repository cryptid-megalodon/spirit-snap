import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { Link, useNavigation } from 'expo-router'
import { Team } from '../../models/Team'
import { Ionicons } from '@expo/vector-icons'
import { useTeams } from '@/contexts/TeamContext'
import { NavigationProp } from '@react-navigation/native'
import { RootStackParamList } from '../../navigation/types'


export default function TeamsScreen() {
  const navigator = useNavigation<NavigationProp<RootStackParamList>>()
  const { getTeams, setEditTeam } = useTeams()

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
              <Text>{spirits[index].name}</Text>
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
        <Text style={styles.teamName}>{item.name || 'Unnamed Team'}</Text>
        {renderTeamSpirits(item.spirits)}
      </View>
      <TouchableOpacity
        onPress={() => {
          setEditTeam(item.id);
          navigator.navigate('collection', { openTeamEditor: true });
        }}
      >
        <Ionicons name="pencil" size={24} color="black" />
      </TouchableOpacity>
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
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
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
})