import React, { useState } from 'react';
import { View, Image, TouchableOpacity, Modal, Text, StyleSheet, Button } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function UserIcon() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const handlePress = () => {
    if (!user || user.isAnonymous) {
      router.push('/login');
    } else {
      setMenuVisible(true); // Show user menu for logged-in users
    }
  };

  const handleLogout = async () => {
    setMenuVisible(false);
    await logout();
    router.push('/login');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress}>
        {user && !user.isAnonymous && user.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.userIcon} />
        ) : (
          <View style={styles.anonymousIcon}>
            <Text style={styles.iconText}>?</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* User Menu */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>User Menu</Text>
          <Button title="Sign Out" onPress={handleLogout} />
          <Button title="Close" onPress={() => setMenuVisible(false)} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  anonymousIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'gray',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuTitle: {
    fontSize: 20,
    marginBottom: 10,
    color: 'white',
  },
});
