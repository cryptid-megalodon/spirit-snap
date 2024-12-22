import SpiritBattleCard from '@/components/SpiritBattleCard';
import SpiritBenchCard from '@/components/SpiritBenchCard';
import SpiritCard from '@/components/SpiritCard';
import { useBattle } from '@/contexts/BattleContext';
import { useTeams } from '@/contexts/TeamContext';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { View, Modal, StyleSheet, Dimensions, Text , Alert, Pressable, TouchableOpacity } from 'react-native';
import { Team } from '@/models/Team';
import { Battle } from '@/models/Battle';
import { Spirit } from '@/models/Spirit';

enum Position {
  TOP_BENCH_LEFT = 'Top-Bench-Left',
  TOP_BENCH_CENTER = 'Top-Bench-Center',
  TOP_BENCH_RIGHT = 'Top-Bench-Right',
  TOP_MIDDLE_LEFT = 'Top-Middle-Left',
  TOP_MIDDLE_RIGHT = 'Top-Middle-Right',
  TOP_FRONTLINE_CENTER = 'Top-Frontline-Center',
  BOTTOM_FRONTLINE_CENTER = 'Bottom-Frontline-Center',
  BOTTOM_MIDDLE_LEFT = 'Bottom-Middle-Left',
  BOTTOM_MIDDLE_RIGHT = 'Bottom-Middle-Right',
  BOTTOM_BENCH_LEFT = 'Bottom-Bench-Left',
  BOTTOM_BENCH_CENTER = 'Bottom-Bench-Center',
  BOTTOM_BENCH_RIGHT = 'Bottom-Bench-Right'
}

const ACTIVE_BENCH = [Position.BOTTOM_BENCH_LEFT, Position.BOTTOM_BENCH_CENTER, Position.BOTTOM_BENCH_RIGHT]

const initBattlePositionMap = (playerOneTeam: Spirit[], playerTwoTeam: Spirit[]): Map<Position, Spirit> => {
  return new Map<Position, Spirit>([
    [Position.TOP_BENCH_LEFT, playerTwoTeam[3]],
    [Position.TOP_BENCH_CENTER, playerTwoTeam[4]],
    [Position.TOP_BENCH_RIGHT, playerTwoTeam[5]],
    [Position.TOP_MIDDLE_LEFT, playerTwoTeam[1]],
    [Position.TOP_MIDDLE_RIGHT, playerTwoTeam[2]],
    [Position.TOP_FRONTLINE_CENTER, playerTwoTeam[0]],
    [Position.BOTTOM_FRONTLINE_CENTER, playerOneTeam[0]],
    [Position.BOTTOM_MIDDLE_LEFT, playerOneTeam[1]],
    [Position.BOTTOM_MIDDLE_RIGHT, playerOneTeam[2]],
    [Position.BOTTOM_BENCH_LEFT, playerOneTeam[3]],
    [Position.BOTTOM_BENCH_CENTER, playerOneTeam[4]],
    [Position.BOTTOM_BENCH_RIGHT, playerOneTeam[5]]
  ]);
}

export default function BattleScreen() {
  const { getBattle } = useBattle();
  const { getTeam } = useTeams();
  const params = useLocalSearchParams();

  const battleId = params.battleId as string;
  if (!battleId) {
    throw new Error('battleId was set');
  }
  const battle = getBattle(battleId);
  if (!battle) {
    throw new Error('Battle not found');
  }

  const teamOne = getTeam(battle.playerOneTeamId)
  if (!teamOne) {
    throw new Error('Player One Team not found');
  }

  const teamTwo = getTeam(battle.playerTwoTeamId)
  if (!teamTwo) {
    throw new Error('Player Two Team not found');
  }

  const [modalVisible, setModalVisible] = useState(false);
  const [playerOneTeam, setPlayerOneTeam] = useState<Team>(teamOne);
  const [playerTwoTeam, setPlayerTwoTeam] = useState<Team>(teamTwo);
  const [currentBattle, setCurrentBattle] = useState<Battle>(battle);
  const [swapMode, setSwapMode] = useState(false);
  const [spiritCardModal, setSpiritCardModal] = useState<Spirit | null>(null);
  const [swapPositionId, setSwapPositionId] = useState<Position | undefined>(undefined);
  const [battlePositionsMap, setBattlePositionsMap] = useState<Map<Position, Spirit>>(initBattlePositionMap(teamOne.spirits, teamTwo.spirits));

  const handleSelectMove = (move: string) => {
    console.log(`Selected move: ${move}`);
    setModalVisible(false);
  };

  const clearSwapMode = () => {
    setSwapMode(false);
    setSwapPositionId(undefined);
  };

  const handleSpiritClick = (spirit: Spirit, positionId: Position) => {
    if (swapMode) {
      if (swapPositionId === undefined) {
        // if (positionId in ACTIVE_BENCH) {
        //   // Select first swap selection if valid selection.
        //   setSwapPositionId(positionId);
        // }
        setSwapPositionId(positionId);
        return;
      } else {
        // Handle second swap click.
        if (swapPositionId === positionId) {
          // Undo swap selection.
          setSwapPositionId(undefined);
          return;
        } else {
          // Execute swap.
          const spiritToSwap = battlePositionsMap.get(swapPositionId) ?? {} as Spirit;
          const spiritToSwapWith = battlePositionsMap.get(positionId) ?? {} as Spirit;
          const newBattlePositionsMap = new Map(battlePositionsMap);
          newBattlePositionsMap.set(swapPositionId, spiritToSwapWith);
          newBattlePositionsMap.set(positionId, spiritToSwap);
          setBattlePositionsMap(newBattlePositionsMap);
          clearSwapMode();
          return;
        }
      }
    }
    setSpiritCardModal(spirit);
    return;
  };

  return (
    <View style={styles.container}>
      <View style={styles.benchContainer}>
        <SpiritBenchCard spirit={battlePositionsMap.get(Position.TOP_BENCH_LEFT) ?? {} as Spirit} />
        <SpiritBenchCard spirit={battlePositionsMap.get(Position.TOP_BENCH_CENTER) ?? {} as Spirit} />
        <SpiritBenchCard spirit={battlePositionsMap.get(Position.TOP_BENCH_RIGHT) ?? {} as Spirit} />
      </View>

      <View style={styles.middleRowContainer}>
        <SpiritBattleCard spirit={battlePositionsMap.get(Position.TOP_MIDDLE_LEFT) ?? {} as Spirit} />
        <SpiritBattleCard spirit={battlePositionsMap.get(Position.TOP_MIDDLE_RIGHT) ?? {} as Spirit} />
      </View>

      <View style={styles.frontLineContainer}>
        <View style={styles.middleRowButtonColumn}>
            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Surrendering!")}>
                <Text style={styles.actionButtonText}>Surrender</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.middleRowFrontLine}>
          <SpiritBattleCard spirit={battlePositionsMap.get(Position.TOP_FRONTLINE_CENTER) ?? {} as Spirit} />
            <Pressable onPress={() => setModalVisible(true)}>
              <SpiritBattleCard spirit={battlePositionsMap.get(Position.BOTTOM_FRONTLINE_CENTER) ?? {} as Spirit} />
            </Pressable>
        </View>
        <View style={styles.middleRowButtonColumn}>
          { swapMode ? (
            <Pressable style={[styles.actionButton, { backgroundColor: 'red' }]} onPress={clearSwapMode}>
              <Text style={styles.actionButtonText}>Cancel</Text>
            </Pressable>
          ) : (
            <TouchableOpacity style={styles.actionButton} onPress={() => setSwapMode(true)}>
              <Text style={styles.actionButtonText}>Swap</Text>
            </TouchableOpacity>
          ) }
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Pressable onPress={() => handleSpiritClick(battlePositionsMap.get(Position.BOTTOM_MIDDLE_LEFT) ?? {} as Spirit, Position.BOTTOM_MIDDLE_LEFT)} style={swapPositionId === Position.BOTTOM_MIDDLE_LEFT ? styles.swapSelected : {}}>
          <SpiritBattleCard spirit={battlePositionsMap.get(Position.BOTTOM_MIDDLE_LEFT) ?? {} as Spirit} />
        </Pressable>
        <Pressable onPress={() => handleSpiritClick(battlePositionsMap.get(Position.BOTTOM_MIDDLE_RIGHT) ?? {} as Spirit, Position.BOTTOM_MIDDLE_RIGHT)} style={swapPositionId === Position.BOTTOM_MIDDLE_RIGHT ? styles.swapSelected : {}}>
          <SpiritBattleCard spirit={battlePositionsMap.get(Position.BOTTOM_MIDDLE_RIGHT) ?? {} as Spirit} />
        </Pressable>
      </View>

      <View style={styles.benchContainer}>
        <Pressable onPress={() => handleSpiritClick(battlePositionsMap.get(Position.BOTTOM_BENCH_LEFT) ?? {} as Spirit, Position.BOTTOM_BENCH_LEFT)} style={swapPositionId === Position.BOTTOM_BENCH_LEFT ? styles.swapSelected : {}}>
          <SpiritBenchCard spirit={battlePositionsMap.get(Position.BOTTOM_BENCH_LEFT) ?? {} as Spirit} />
        </Pressable>
        <Pressable onPress={() => handleSpiritClick(battlePositionsMap.get(Position.BOTTOM_BENCH_CENTER) ?? {} as Spirit, Position.BOTTOM_BENCH_CENTER)} style={swapPositionId === Position.BOTTOM_BENCH_CENTER ? styles.swapSelected : {}}>
          <SpiritBenchCard spirit={battlePositionsMap.get(Position.BOTTOM_BENCH_CENTER) ?? {} as Spirit} />
        </Pressable>
        <Pressable onPress={() => handleSpiritClick(battlePositionsMap.get(Position.BOTTOM_BENCH_RIGHT) ?? {} as Spirit, Position.BOTTOM_BENCH_RIGHT)} style={swapPositionId === Position.BOTTOM_BENCH_RIGHT ? styles.swapSelected : {}}>
          <SpiritBenchCard spirit={battlePositionsMap.get(Position.BOTTOM_BENCH_RIGHT) ?? {} as Spirit} />
        </Pressable>
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

      {/* Spirit Card Modal */}
      { spiritCardModal &&
        <SpiritCard
          visible={true}
          spiritData={spiritCardModal}
          onClose={() => setSpiritCardModal(null)}
        />
      }
    </View>
  );
};

const { width, height } = Dimensions.get('window');
const portraitSize = width / 2.5; // Adjust this ratio to control the portrait size

const styles = StyleSheet.create({
  swapSelected: {
    borderColor: 'green',
    borderWidth: 2,
  },
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
  benchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  middleRowContainer: {
    flex: 1, // 1/4 of the screen height
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  frontLineContainer: {
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