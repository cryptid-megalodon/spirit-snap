import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

export default function BattleScreen() {
  const { battleId } = useLocalSearchParams();

  return <Text>Battle Id: {battleId}</Text>;
}