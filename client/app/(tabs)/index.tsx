import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import { Button, Modal, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView, PinchGestureHandler, PinchGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { useAuth } from '@/contexts/AuthContext';
import { useSpiritContext } from '@/contexts/SpiritContext';

export default function Tab() {
  const [permission, requestPermission] = useCameraPermissions();
  const [zoom, setZoom] = useState(0);
  const cameraViewRef = useRef<CameraView | null>(null);
  const { user, loading } = useAuth();
  const { createSpirit } = useSpiritContext();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  if (loading) {
    return (
      <View>
        <Text>Loading.</Text>
      </View>
    )
  }
  if (!user) {
    return (
      <View>
        <Text>Please log in.</Text>
      </View>
    )
  }

  const handlePinchGesture = (event: PinchGestureHandlerGestureEvent) => {
    const scale = event.nativeEvent.scale;
    let newZoom = zoom + (scale - 1) / 30; // Adjust sensitivity of zoom. The larger the denominator, the less sensitive the gesture will be.
    newZoom = Math.min(Math.max(newZoom, 0), 1); // Clamp the value between 0 and 1
    setZoom(newZoom);
  };

  const takePicture = async () => {
    try {
      if (cameraViewRef.current) {
        const picture = await cameraViewRef.current.takePictureAsync({ base64: true });
        if (picture && picture.uri && picture.base64) {
          const base64Image = "data:image/jpg;base64," + picture.base64;

          setIsProcessing(true); // Show loading modal
          await createSpirit(base64Image);
          setIsProcessing(false); // Hide loading modal
        } else {
          console.error('Error: Picture is undefined or missing URI.');
        }
      } else {
        console.error('Error: cameraViewRef.current is null.');
      }
    } catch (error) {
      console.error('Error taking picture: ', error);
    }
  };
  return (
    <GestureHandlerRootView style={styles.container}>

      <Modal
        transparent
        animationType="fade"
        visible={isProcessing}
        onRequestClose={() => setIsProcessing(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.modalText}>Loading...</Text>
          </View>
        </View>
      </Modal>
      <PinchGestureHandler
        onGestureEvent={handlePinchGesture}
      >
        <CameraView style={styles.camera} ref={cameraViewRef} zoom={zoom}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={takePicture}>
              <Text style={styles.text}>Take Picture</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </PinchGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photo: {
    width: 100,
    height: 100,
    margin: 5,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 200,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 10,
  },
  modalText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
});
