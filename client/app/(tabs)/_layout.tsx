import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import { View, StyleSheet} from 'react-native';
import UserIcon from '../../components/UserIcon';

export default function TabLayout() {
  return (
    <View style={styles.container}>
    <Tabs screenOptions={{ tabBarActiveTintColor: 'blue' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Capture',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="camera" color={color} />,
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: 'Collection',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="book" color={color} />,
          href: {
            pathname: "/collection",
            params: {
              openTeamEditor: "false",
            }
          }
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          title: 'Teams',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="star" color={color} />,
        }}
      />
      <Tabs.Screen
        name="battles"
        options={{
          title: 'Battles',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="sword-cross" color={color} />,
        }}
      />
    </Tabs>
    <UserIcon />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  userIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10, // Ensure it appears above the tabs
  },
});