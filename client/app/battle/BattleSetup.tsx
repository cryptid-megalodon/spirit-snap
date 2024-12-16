import { Image, Text, TouchableOpacity, StyleSheet, View} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useBattle } from '@/contexts/BattleContext';
import { useTeams } from '@/contexts/TeamContext';
import { useParams } from '@/contexts/ParamContext';
import { Team } from '@/models/Team';
import { Spirit } from '@/models/Spirit';
import SpiritCard from '@/components/SpiritCard';
import { useState } from 'react';

export default function BattleSetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { newBattle } = useBattle();
  const { getTeam } = useTeams();
  const { setParamKey, getParamValue, clearParam } = useParams();
  const [playerOneTeam, setPlayerOneTeam] = useState<Team | null>(null);
  const [playerTwoTeam, setPlayerTwoTeam] = useState<Team | null>(null);
  const [selectedSpirit, setSelectedSpirit] = useState<Spirit | null>(null);

  if (!user) {
    router.push('/login');
    return null;
  }

  useFocusEffect(() => {
    const player_one_team_id = getParamValue('playerOneTeamId');
    if (player_one_team_id) {
      const team = getTeam(player_one_team_id);
      if (team) {
        setPlayerOneTeam(team);
      }
    }
    const opponent_team_id = getParamValue('playerTwoTeamId');
    if (opponent_team_id) {
      const team = getTeam(opponent_team_id);
      if (team) {
        setPlayerTwoTeam(team);
      }
    }
  });

  const handleStartBattle = () => {
    if (!playerOneTeam || !playerTwoTeam) {
      return;
    }
    const battleId = newBattle(user.uid, "playerTwoUserId", playerOneTeam.id, playerTwoTeam.id);
    cleanUpState();
    console.log(`Battle created: ${battleId}`);
    router.replace(`/battle/${battleId}`);
  };

  const cleanUpState = () => {
    setPlayerOneTeam(null);
    setPlayerTwoTeam(null);
    clearParam('playerOneTeamId');
    clearParam('playerTwoTeamId');
  }

  const handleSelectPlayerTeam = () => {
    setParamKey('playerOneTeamId');
    router.push({
      pathname: '/teams',
      params: { mode: 'select' }
    });
  };

  const handleSelectOpponentTeam = () => {
    setParamKey('playerTwoTeamId');
    router.push({
      pathname: '/teams',
      params: { mode: 'select' }
    });
  };

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

  const renderTeam = (team: Team) => (
    <View style={styles.teamContainer}>
      <View style={styles.teamRow}>
        <View style={styles.teamInfo}>
          <View style={styles.teamHeader}>
            <Text style={styles.teamName}>{team.name || 'Unnamed Team'}</Text>
          </View>
          {renderTeamSpirits(team.spirits)}
        </View>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.teamSection}>
        <Text style={styles.sectionTitle}>Your Team</Text>
        {playerOneTeam ? (
          renderTeam(playerOneTeam)
        ) : (
          <Text style={styles.placeholderText}>Please select a team</Text>
        )}
        <TouchableOpacity style={styles.selectButton} onPress={handleSelectPlayerTeam}>
          <Text style={styles.buttonText}>Select Your Team</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.teamSection}>
        <Text style={styles.sectionTitle}>Opponent Team</Text>
        {playerTwoTeam ? (
          renderTeam(playerTwoTeam)
        ) : (
          <Text style={styles.placeholderText}>Please select a team</Text>
        )}
        <TouchableOpacity style={styles.selectButton} onPress={handleSelectOpponentTeam}>
          <Text style={styles.buttonText}>Select Opponent Team</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.createButton, (!playerOneTeam || !playerTwoTeam) && styles.disabledButton]} 
        onPress={handleStartBattle}
        disabled={!playerOneTeam || !playerTwoTeam}
      >
        <Text style={styles.buttonText}>Start Battle</Text>
      </TouchableOpacity>

      {selectedSpirit && (
        <SpiritCard
          visible={true}
          spiritData={selectedSpirit}
          onClose={() => setSelectedSpirit(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  teamSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  teamContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  spiritItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  placeholderText: {
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 10,
  },
  selectButton: {
    backgroundColor: '#444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  createButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
});