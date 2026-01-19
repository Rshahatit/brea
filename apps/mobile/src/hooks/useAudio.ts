import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { sendAudioChunk, endAudioInput } from '../lib/socket';
import { useBreaPStore } from '../stores/brea';

const SAMPLE_RATE = 16000;
const CHANNELS = 1;
const BIT_DEPTH = 16;
const RECORDING_OPTIONS = {
  android: {
    extension: '.wav',
    outputFormat: Audio.AndroidOutputFormat.DEFAULT,
    audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
    sampleRate: SAMPLE_RATE,
    numberOfChannels: CHANNELS,
    bitRate: SAMPLE_RATE * CHANNELS * BIT_DEPTH,
  },
  ios: {
    extension: '.wav',
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: SAMPLE_RATE,
    numberOfChannels: CHANNELS,
    bitRate: SAMPLE_RATE * CHANNELS * BIT_DEPTH,
    linearPCMBitDepth: BIT_DEPTH,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {},
};

// Jitter buffer for smooth audio playback
class JitterBuffer {
  private buffer: ArrayBuffer[] = [];
  private minBufferSize = 3; // Minimum chunks before starting playback
  private isPlaying = false;
  private onChunkReady: ((chunk: ArrayBuffer) => void) | null = null;

  addChunk(chunk: ArrayBuffer) {
    this.buffer.push(chunk);

    if (this.buffer.length >= this.minBufferSize && !this.isPlaying) {
      this.startPlayback();
    }
  }

  private startPlayback() {
    this.isPlaying = true;
    this.playNext();
  }

  private playNext() {
    if (this.buffer.length === 0) {
      this.isPlaying = false;
      return;
    }

    const chunk = this.buffer.shift()!;
    this.onChunkReady?.(chunk);

    // Schedule next chunk (approx timing based on sample rate)
    const chunkDuration = (chunk.byteLength / (SAMPLE_RATE * 2)) * 1000;
    setTimeout(() => this.playNext(), chunkDuration * 0.9);
  }

  setOnChunkReady(callback: (chunk: ArrayBuffer) => void) {
    this.onChunkReady = callback;
  }

  clear() {
    this.buffer = [];
    this.isPlaying = false;
  }
}

export function useAudio() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const jitterBufferRef = useRef(new JitterBuffer());

  const { setIsRecording: setStoreIsRecording, status } = useBreaPStore();

  // Request audio permissions
  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);

      if (granted) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      }

      return granted;
    } catch (error) {
      console.error('[Audio] Permission error:', error);
      return false;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      // Stop any existing recording
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
      }

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(RECORDING_OPTIONS);

      // Set up status update callback for streaming audio
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.metering !== undefined) {
          // Could use metering for VAD here
        }
      });

      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setStoreIsRecording(true);

      console.log('[Audio] Recording started');
    } catch (error) {
      console.error('[Audio] Recording error:', error);
    }
  }, [hasPermission, requestPermission, setStoreIsRecording]);

  // Stop recording and send audio
  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      if (uri) {
        // In a real implementation, we would:
        // 1. Read the file as PCM data
        // 2. Chunk it and send via sendAudioChunk
        // For now, signal end of input
        endAudioInput();
      }

      recordingRef.current = null;
      setIsRecording(false);
      setStoreIsRecording(false);

      console.log('[Audio] Recording stopped');
    } catch (error) {
      console.error('[Audio] Stop recording error:', error);
    }
  }, [setStoreIsRecording]);

  // Play received audio chunk
  const playAudioChunk = useCallback(async (chunk: ArrayBuffer) => {
    jitterBufferRef.current.addChunk(chunk);
  }, []);

  // Initialize jitter buffer callback
  useEffect(() => {
    jitterBufferRef.current.setOnChunkReady(async (chunk) => {
      try {
        // In a real implementation, we would create a sound from the PCM data
        // For now, this is a placeholder for the audio playback logic
        console.log('[Audio] Playing chunk:', chunk.byteLength, 'bytes');
      } catch (error) {
        console.error('[Audio] Playback error:', error);
      }
    });

    return () => {
      jitterBufferRef.current.clear();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  return {
    hasPermission,
    isRecording,
    requestPermission,
    startRecording,
    stopRecording,
    playAudioChunk,
  };
}
