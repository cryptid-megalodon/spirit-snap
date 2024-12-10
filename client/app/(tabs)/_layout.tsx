import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
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
    </Tabs>
  );
}