import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  GestureResponderEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useBreaPStore } from '../stores/brea';

interface Props {
  onPressIn: () => void;
  onPressOut: () => void;
  disabled?: boolean;
}

export function PushToTalkButton({ onPressIn, onPressOut, disabled }: Props) {
  const { status, isRecording } = useBreaPStore();
  const scale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      if (disabled) return;

      scale.value = withSpring(0.95, { damping: 15 });
      pulseOpacity.value = withRepeat(
        withTiming(0.5, { duration: 1000 }),
        -1,
        true
      );
      onPressIn();
    },
    [disabled, onPressIn, scale, pulseOpacity]
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      if (disabled) return;

      scale.value = withSpring(1, { damping: 15 });
      cancelAnimation(pulseOpacity);
      pulseOpacity.value = withTiming(0, { duration: 200 });
      onPressOut();
    },
    [disabled, onPressOut, scale, pulseOpacity]
  );

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: 1.3 }],
  }));

  const getStatusText = () => {
    switch (status) {
      case 'connecting':
        return 'Connecting...';
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'speaking':
        return 'Brea is speaking';
      case 'error':
        return 'Connection error';
      default:
        return 'Hold to talk';
    }
  };

  const getButtonColor = () => {
    if (disabled) return '#333333';
    if (isRecording) return '#DC2626';
    if (status === 'speaking') return '#3B82F6';
    return '#8B5CF6';
  };

  const getIcon = () => {
    if (status === 'processing') return 'ellipsis-horizontal';
    if (status === 'speaking') return 'volume-high';
    return 'mic';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>{getStatusText()}</Text>

      <View style={styles.buttonContainer}>
        {/* Pulse effect */}
        <Animated.View
          style={[
            styles.pulse,
            pulseStyle,
            { backgroundColor: getButtonColor() },
          ]}
        />

        {/* Main button */}
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || status === 'connecting' || status === 'processing'}
        >
          <Animated.View
            style={[
              styles.button,
              buttonStyle,
              { backgroundColor: getButtonColor() },
            ]}
          >
            <Ionicons name={getIcon()} size={32} color="#FFFFFF" />
          </Animated.View>
        </Pressable>
      </View>

      <Text style={styles.hint}>
        {status === 'speaking'
          ? "Wait for Brea to finish"
          : "Hold the button and speak"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  statusText: {
    color: '#A0A0A0',
    fontSize: 14,
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  buttonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  hint: {
    color: '#666666',
    fontSize: 12,
    marginTop: 16,
  },
});
