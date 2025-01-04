import SpiritBattleCard from '@/components/SpiritBattleCard';
import SpiritBenchCard from '@/components/SpiritBenchCard';
import SpiritCard from '@/components/SpiritCard';
import { useBattle } from '@/contexts/BattleContext';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Modal, StyleSheet, Dimensions, Text , Alert, Pressable, TouchableOpacity } from 'react-native';
import { Battle, Position, BOTTOM_BENCH, BENCH_POSITIONS } from '@/models/Battle';
import { Spirit } from '@/models/Spirit';
import { ActionType } from '@/models/Action';

export default function BattleScreen() {
  const { currentBattleContext, setCurrentBattle, submitAction } = useBattle();
  const params = useLocalSearchParams();

  const battleId = params.battleId as string;
  if (!battleId) {
    throw new Error('battleId was set');
  }
  const [attackModalVisible, setAttackModalVisible] = useState(false);
  const [nextTurnModalVisible, setNextTurnModalVisible] = useState(false);
  const [swapMode, setSwapMode] = useState(false);
  const [spiritCardModal, setSpiritCardModal] = useState<Spirit | null>(null);
  const [swapPositionId, setSwapPositionId] = useState<Position | undefined>(undefined);

  useEffect(() => {
    setCurrentBattle(battleId);
  }, [battleId]);

  if (!currentBattleContext) {
    return <View><Text>Loading battle...</Text></View>;
  }
  const positionMap = currentBattleContext.positionMap;

  const handleSelectMove = (moveId: string) => {
    submitAction(battleId, {
      type: ActionType.MOVE,
      fields: {
        attackerPosition: Position.BOTTOM_FRONTLINE_CENTER,
        targetPosition: Position.TOP_FRONTLINE_CENTER,
        moveId: moveId,
      }
    });
    setAttackModalVisible(false);
  };

  const clearSwapMode = () => {
    setSwapMode(false);
    setSwapPositionId(undefined);
  };

  const handleSwapClick = (spirit: Spirit, positionId: Position) => {
    if (swapPositionId === undefined) {
      if (BOTTOM_BENCH.includes(positionId)) {
        // Handle first swap click.
        setSwapPositionId(positionId);
        return;
      }
    } else {
      // Handle second swap click.
      if (swapPositionId === positionId) {
        // Undo swap selection.
        setSwapPositionId(undefined);
        return;
      } else {
        // Execute swap.
        if (BOTTOM_BENCH.includes(positionId)) {
          // You can't swap a bench spirit with another bench spirit.
          return;
        }
        submitAction(battleId, {
          type: ActionType.SWAP,
          fields: {
            SwapInPosition: positionId,
            SwapOutPosition: swapPositionId,
          }
        });
        clearSwapMode();
        return;
      }
    }
  };

  const handleSpiritClick = (spirit: Spirit, positionId: Position) => {
    if (swapMode) {
      handleSwapClick(spirit, positionId);
    } else if (positionId === Position.BOTTOM_FRONTLINE_CENTER) {
      // Select Attack Click
      setAttackModalVisible(true);
    } else {
      // Inspect Spirit Click
      setSpiritCardModal(spirit);
      return;
    }
  };

  const rotateField = () => {
    submitAction(battleId, {
      type: ActionType.ROTATE,
      fields: {},
    });
  }

  function ClickableSpirit({ positionId }: { positionId: Position }) {
    if (!currentBattleContext) {
      return <View />;
    }
    const spirit = currentBattleContext.positionMap.get(positionId) ?? {} as Spirit;
    return (
      <Pressable
        onPress={() => handleSpiritClick(spirit, positionId)}
        style={swapPositionId === positionId ? styles.swapSelected : {}}
      >
        {BENCH_POSITIONS.includes(positionId) ? <SpiritBenchCard spirit={spirit} /> : <SpiritBattleCard spirit={spirit} />}
      </Pressable>
    );
  }

  // Spirit move modal.
  interface SpiritMoveModalProps {
    visible: boolean,
  };
  const SpiritMoveModal: React.FC<SpiritMoveModalProps> = ({ visible }: SpiritMoveModalProps) => {
    return (
      <Modal visible={visible} transparent={true} animationType="fade">
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
            <Pressable style={[styles.actionButton, { backgroundColor: 'red' }]} onPress={() => setAttackModalVisible(false)}>
              <Text style={styles.actionButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.benchContainer}>
        <ClickableSpirit positionId={Position.TOP_BENCH_LEFT} />
        <ClickableSpirit positionId={Position.TOP_BENCH_CENTER} />
        <ClickableSpirit positionId={Position.TOP_BENCH_RIGHT} />
      </View>

      <View style={styles.middleRowContainer}>
        <ClickableSpirit positionId={Position.TOP_MIDDLE_LEFT} />
        <ClickableSpirit positionId={Position.TOP_MIDDLE_RIGHT} />
      </View>

      <View style={styles.centerArenaContainer}>
        <View style={styles.centerArenaButtonColumn}>
            <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert("Surrendering!")}>
                <Text style={styles.actionButtonText}>Surrender</Text>
            </TouchableOpacity>
        </View>
        <View style={styles.centerArenaFrontlineColumn}>
          <ClickableSpirit positionId={Position.TOP_FRONTLINE_CENTER} />
          <ClickableSpirit positionId={Position.BOTTOM_FRONTLINE_CENTER} />
        </View>
        <View style={styles.centerArenaButtonColumn}>
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
        <ClickableSpirit positionId={Position.BOTTOM_MIDDLE_LEFT} />
        <Pressable style={styles.rotateButton} onPress={rotateField}>
          <Text>R</Text>
        </Pressable>
        <ClickableSpirit positionId={Position.BOTTOM_MIDDLE_RIGHT} />
      </View>

      <View style={styles.benchContainer}>
        <ClickableSpirit positionId={Position.BOTTOM_BENCH_LEFT} />
        <ClickableSpirit positionId={Position.BOTTOM_BENCH_CENTER} />
        <ClickableSpirit positionId={Position.BOTTOM_BENCH_RIGHT} />
      </View>

      <SpiritMoveModal visible={attackModalVisible} />
      {/* Spirit Card Modal */}
      { spiritCardModal &&
        <SpiritCard
          visible={true}
          spiritData={spiritCardModal}
          onClose={() => setSpiritCardModal(null)}
        />
      }
      {/* Next Turn Modal */}
      { nextTurnModalVisible &&
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.menu}>
              <Text style={styles.menuTitle}>{currentBattleContext.currentTurnUserId}'s Turn</Text>
              <Pressable 
                style={[styles.actionButton, { backgroundColor: 'white', marginTop: 20 }]} 
                onPress={() => setNextTurnModalVisible(false)}
              >
                <Text style={[styles.actionButtonText, { color: '#007AFF' }]}>Start Turn</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
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
  centerArenaContainer: {
    flex: 2, // 1/2 of the screen height
    flexDirection: 'row',
  },
  centerArenaFrontlineColumn: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  centerArenaButtonColumn: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  rotateButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
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