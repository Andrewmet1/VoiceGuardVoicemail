import { Platform, NativeModules } from 'react-native';
import Sound from 'react-native-sound';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { getFilePath } from '../utils/fileSystem';

// Audio recorder interface
interface AudioRecorder {
  start: () => Promise<boolean>;
  stop: () => Promise<ArrayBuffer | null>;
  isRecording: () => boolean;
  getLastRecordingPath: () => string | null;
}

// Audio recorder implementation
class AudioRecorderImpl implements AudioRecorder {
  private isRecordingFlag: boolean = false;
  private recordingPath: string | null = null;
  private recordingTimeout: NodeJS.Timeout | null = null;
  private maxRecordingDuration: number = 15000; // 15 seconds max

  /**
   * Start recording audio
   */
  async start(): Promise<boolean> {
    try {
      // Check if already recording
      if (this.isRecordingFlag) {
        console.log('Already recording');
        return true;
      }

      // Request microphone permission if needed
      const permissionResult = await this.requestMicrophonePermission();
      if (!permissionResult) {
        console.error('Microphone permission denied');
        return false;
      }

      // Generate recording path
      this.recordingPath = await getFilePath(`recording_${Date.now()}.aac`);

      // Start recording based on platform
      if (Platform.OS === 'ios') {
        // iOS implementation
        await NativeModules.AudioRecorderManager.startRecording({
          path: this.recordingPath,
          sampleRate: 16000,
          channels: 1,
          bitRate: 64000,
          audioEncoding: 'aac'
        });
      } else {
        // Android implementation
        await NativeModules.AudioRecorderModule.startRecording(
          this.recordingPath,
          {
            sampleRate: 16000,
            channels: 1,
            bitRate: 64000,
            audioEncoding: 'aac'
          }
        );
      }

      this.isRecordingFlag = true;
      console.log('Recording started at:', this.recordingPath);

      // Set a safety timeout to stop recording after max duration
      this.recordingTimeout = setTimeout(() => {
        if (this.isRecordingFlag) {
          console.log('Max recording duration reached, stopping automatically');
          this.stop();
        }
      }, this.maxRecordingDuration);

      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      this.isRecordingFlag = false;
      this.recordingPath = null;
      return false;
    }
  }

  /**
   * Stop recording and return the audio data
   */
  async stop(): Promise<ArrayBuffer | null> {
    try {
      // Check if recording
      if (!this.isRecordingFlag) {
        console.log('Not recording');
        return null;
      }

      // Clear timeout if set
      if (this.recordingTimeout) {
        clearTimeout(this.recordingTimeout);
        this.recordingTimeout = null;
      }

      // Stop recording based on platform
      if (Platform.OS === 'ios') {
        await NativeModules.AudioRecorderManager.stopRecording();
      } else {
        await NativeModules.AudioRecorderModule.stopRecording();
      }

      this.isRecordingFlag = false;
      console.log('Recording stopped');

      // Read the recorded file as ArrayBuffer
      if (this.recordingPath) {
        const audioData = await this.readAudioFile(this.recordingPath);
        return audioData;
      }

      return null;
    } catch (error) {
      console.error('Error stopping recording:', error);
      this.isRecordingFlag = false;
      return null;
    }
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.isRecordingFlag;
  }

  /**
   * Get the path of the last recording
   */
  getLastRecordingPath(): string | null {
    return this.recordingPath;
  }

  /**
   * Request microphone permission
   */
  private async requestMicrophonePermission(): Promise<boolean> {
    try {
      const permission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.MICROPHONE
        : PERMISSIONS.ANDROID.RECORD_AUDIO;

      const result = await check(permission);

      if (result !== RESULTS.GRANTED) {
        const requestResult = await request(permission);
        return requestResult === RESULTS.GRANTED;
      }

      return true;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return false;
    }
  }

  /**
   * Read audio file as ArrayBuffer
   */
  private async readAudioFile(filePath: string): Promise<ArrayBuffer | null> {
    return new Promise((resolve, reject) => {
      try {
        // Use react-native-fs to read the file
        const RNFS = require('react-native-fs');
        
        RNFS.readFile(filePath, 'base64')
          .then((base64Data: string) => {
            // Convert base64 to ArrayBuffer
            const binaryString = atob(base64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            resolve(bytes.buffer);
          })
          .catch((error: any) => {
            console.error('Error reading audio file:', error);
            resolve(null);
          });
      } catch (error) {
        console.error('Error in readAudioFile:', error);
        resolve(null);
      }
    });
  }
}

// Export singleton instance
export const audioRecorder: AudioRecorder = new AudioRecorderImpl();

/**
 * Play an audio file
 * @param filePath - Path to the audio file
 * @returns Promise that resolves when playback is complete
 */
export const playAudio = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Initialize sound
    const sound = new Sound(filePath, '', (error) => {
      if (error) {
        console.error('Error loading sound:', error);
        reject(error);
        return;
      }
      
      // Start playback
      sound.play((success) => {
        if (success) {
          console.log('Sound played successfully');
          resolve();
        } else {
          console.error('Error playing sound');
          reject(new Error('Playback failed'));
        }
        
        // Release resources
        sound.release();
      });
    });
  });
};
