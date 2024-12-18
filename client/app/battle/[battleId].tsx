import SpiritBattleCard from '@/components/SpiritBattleCard';
import { useBattle } from '@/contexts/BattleContext';
import { useTeams } from '@/contexts/TeamContext';
import { useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Modal, StyleSheet, Dimensions, Text , Alert, Pressable, TouchableOpacity } from 'react-native';
import { Team } from '@/models/Team';
import { Battle } from '@/models/Battle';

export default function BattleScreen() {
  const params = useLocalSearchParams();
  const battleId = params.battleId as string;
  const [modalVisible, setModalVisible] = useState(false);
  const [playerOneTeam, setPlayerOneTeam] = useState<Team>({} as Team);
  const [playerTwoTeam, setPlayerTwoTeam] = useState<Team>({} as Team);
  const [currentBattle, setCurrentBattle] = useState<Battle>({} as Battle);
  const { getBattle } = useBattle();
  const { getTeam } = useTeams();

  useEffect(() => {
    if (!battleId) {
      return;
    }
    console.log(`In Battle: ${battleId}`);
    const battle = getBattle(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }
    const teamOne = getTeam(battle.playerOneTeamId)
    if (!teamOne) {
      throw new Error('Player One Team not found');
    }
    const shallowCopyTeamOne = { ...teamOne };
    setPlayerOneTeam(shallowCopyTeamOne)
    const teamTwo = getTeam(battle.playerTwoTeamId)
    if (!teamTwo) {
      throw new Error('Player Two Team not found');
    }
    const shallowCopyTeamTwo = { ...teamTwo };
    setPlayerTwoTeam(shallowCopyTeamTwo)
    setCurrentBattle(battle);
  }, []);

  const handleSelectMove = (move: string) => {
    console.log(`Selected move: ${move}`);
    setModalVisible(false);
  };
  console.log("p1 spirit 1:", playerOneTeam.spirits[0])

  return (
    <View style={styles.container}>
      {/* Top Row */}
      <View style={styles.topRow}>
        <SpiritBattleCard spirit={playerTwoTeam.spirits[1]} />
        <SpiritBattleCard spirit={playerTwoTeam.spirits[2]} />
      </View>

      {/* Middle Row */}
      <View style={styles.middleRow}>
        <View style={styles.middleRowButtonColumn}>
            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Surrendering!")}>
                <Text style={styles.actionButtonText}>Surrender</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.middleRowFrontLine}>
            <SpiritBattleCard spirit={playerTwoTeam.spirits[0]} />
            <Pressable onPress={() => setModalVisible(true)}>
              <SpiritBattleCard spirit={playerOneTeam.spirits[0]} />
            </Pressable>
        </View>
        <View style={styles.middleRowButtonColumn}>
            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Items!")}>
                <Text style={styles.actionButtonText}>Items</Text>
            </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Row */}
      <View style={styles.bottomRow}>
        <SpiritBattleCard spirit={playerOneTeam.spirits[1]} />
        <SpiritBattleCard spirit={playerOneTeam.spirits[2]} />
      </View>

      {/* Fighting Move Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.menu}>
            <Text style={styles.menuTitle}>Select a Move</Text>
            <View style={styles.menuItems}>
              <View style={styles.menuColumn}>
                <Pressable style={styles.actionButton} onPress={() => handleSelectMove('Punch')}>
                  <Text style={styles.actionButtonText}>Punch</Text>
                </Pressable>
                <Pressable style={styles.actionButton} onPress={() => handleSelectMove('Kick')}>
                  <Text style={styles.actionButtonText}>Kick</Text>
                </Pressable>
              </View>
              <View style={styles.menuColumn}>
                <Pressable style={styles.actionButton} onPress={() => handleSelectMove('Special')}>
                  <Text style={styles.actionButtonText}>Special</Text>
                </Pressable>
                <Pressable style={styles.actionButton} onPress={() => handleSelectMove('Support')}>
                  <Text style={styles.actionButtonText}>Support</Text>
                </Pressable>
              </View>
            </View>
            <Pressable style={[styles.actionButton, { backgroundColor: 'red' }]} onPress={() => setModalVisible(false)}>
              <Text style={styles.actionButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const { width, height } = Dimensions.get('window');
const portraitSize = width / 2.5; // Adjust this ratio to control the portrait size

const styles = StyleSheet.create({
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topRow: {
    flex: 1, // 1/4 of the screen height
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  middleRow: {
    flex: 2, // 1/2 of the screen height
    flexDirection: 'row',
  },
  middleRowFrontLine: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  middleRowButtonColumn: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bottomRow: {
    flex: 1, // 1/4 of the screen height
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  portrait: {
    width: portraitSize,
    height: portraitSize, // Ensure the portraits are square
    borderRadius: 8,
    backgroundColor: '#ddd', // Placeholder background
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Transparent background
  },
  menu: {
    width: 300,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  menuItems: {
    padding: 10,
    justifyContent: 'space-evenly',
    flexDirection: 'row',
  },
  menuColumn: {
    margin: 5,
    flex: 1,
    justifyContent: 'space-evenly',
    flexDirection: 'column',
  },
  attackButton: {
    backgroundColor: '#007AFF'
  },
  cancelButton: {
    backgroundColor: 'lightred'
  }
});
