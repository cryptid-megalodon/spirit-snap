import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface HPBarProps {
  currentHP: number;
  maxHP: number;
}

const HPBar: React.FC<HPBarProps> = ({ currentHP, maxHP }) => {
  const hpPercentage = Math.max((currentHP / maxHP) * 100, 0); // Ensure it doesn't go below 0%

  return (
    <View style={styles.container}>
      {/* Background Bar */}
      <View style={styles.hpBarBackground}>
        {/* Foreground Bar */}
        <View style={[styles.hpBarFill, { width: `${hpPercentage}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    marginTop: 5,
  },
  hpBarBackground: {
    width: '100%',
    height: 12,
    backgroundColor: '#ddd', // Light gray background
    borderRadius: 6,
    overflow: 'hidden',
  },
  hpBarFill: {
    height: '100%',
    backgroundColor: '#4caf50', // Green for HP
  },
  hpText: {
    marginTop: 2,
    fontSize: 12,
    color: '#333',
  },
});

export default HPBar;