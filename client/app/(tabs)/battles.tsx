
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useBattle } from '../../contexts/BattleContext';
import { useAuth } from '../../contexts/AuthContext';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useState } from 'react';
import { useWindowDimensions } from 'react-native';

export default function BattlesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  if (!user) {
    // Must be logged in to see battles.
    router.push('/login');
    return null;
  }
  const { battles, newBattle } = useBattle();
  const layout = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'battles', title: 'Battles' },
  ]);

  const BattlesTab = () => (
    <View style={styles.container}>
      {battles.map((battle) => (
        <Link
          key={battle.id}
          href={{
            pathname: "/battle/[battleId]",
            params: { battleId: battle.id }
          }}
          asChild
        >
          <Pressable style={styles.battleItem}>
            <Text>Battle #{battle.id}</Text>
          </Pressable>
        </Link>
      ))}
    </View>
  );

  const renderScene = SceneMap({
    battles: BattlesTab,
  });

  const handleCreateBattle = () => {
    const battleId = newBattle(user.uid, "test11");
    console.log(`Battle created: ${battleId}`);
    router.push(`/battle/${battleId}`);
  };

  return (
    <View style={styles.container}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={props => (
          <TabBar
            {...props}
            style={styles.tabBar}
            indicatorStyle={styles.indicator}
            tabStyle={styles.tabLabel}
          />
        )}
      />
      <Pressable style={styles.createButton} onPress={handleCreateBattle}>
        <Text style={styles.buttonText}>Create Battle</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabBar: {
    backgroundColor: '#fff',
  },
  indicator: {
    backgroundColor: '#000',
  },
  tabLabel: {
    backgroundColor: '#555',
  },
  battleItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
