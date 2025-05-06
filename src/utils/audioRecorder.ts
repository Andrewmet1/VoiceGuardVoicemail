/**
 * Simple Audio Recorder Utility
 * Uses react-native-audio-recorder-player for audio recording and playback
 */

import { Platform, NativeModules } from 'react-native';
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  AVEncodingOption
} from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import { requestPermission, PermissionType } from './permissionsHandler';

// Import InCallManager safely with a fallback
let InCallManager: any = null;
try {
  InCallManager = require('react-native-incall-manager').default;
} catch (error) {
  console.warn('Failed to import InCallManager:', error);
}

// Audio recording states
export enum RecordingState {
  READY = 'ready',
  RECORDING = 'recording',
  RECORDED = 'recorded',
  PLAYING = 'playing',
  ERROR = 'error',
}

// Interface for recording options
export interface RecordingOptions {
  onRecordingProgress?: (time: number) => void;
  onRecordingComplete?: (path: string) => void;
  onRecordingError?: (error: Error) => void;
}

// Interface for audio session state
interface AudioSessionState {
  isActive?: boolean;
  category?: string;
  mode?: string;
  options?: number;
}

class AudioRecorder {
  private recorder: AudioRecorderPlayer;
  private recordingPath: string = '';
  private recordingFilename: string = '';
  private recordingState: RecordingState = RecordingState.READY;
  private options: RecordingOptions = {};
  private recordingAttempts: number = 0;
  private maxRecordingAttempts: number = 3;

  constructor() {
    this.recorder = new AudioRecorderPlayer();
    this.recorder.setSubscriptionDuration(0.1); // Update every 100ms
    console.log('AudioRecorder initialized');
  }

  /**
   * Get the path for saving recordings
   */
  private getRecordingPath(): string {
    const fileName = `voiceguard_recording_${Date.now()}`;
    this.recordingFilename = fileName;
    
    let path = '';
    if (Platform.OS === 'ios') {
      // On iOS, use the temporary directory which has fewer restrictions
      path = `${RNFS.TemporaryDirectoryPath}/${fileName}.m4a`;
    } else {
      path = `${RNFS.ExternalDirectoryPath}/${fileName}.mp3`;
    }
    
    console.log(`Generated recording path: ${path}`);
    return path;
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(filePath: string): Promise<void> {
    try {
      const directory = filePath.substring(0, filePath.lastIndexOf('/'));
      const exists = await RNFS.exists(directory);
      
      if (!exists) {
        console.log(`Creating directory: ${directory}`);
        await RNFS.mkdir(directory);
      }
      
      // Test write permissions by creating a test file
      const testPath = `${directory}/test_${Date.now()}.txt`;
      await RNFS.writeFile(testPath, 'test', 'utf8');
      console.log(`Successfully wrote test file to ${testPath}`);
      
      // Clean up test file
      await RNFS.unlink(testPath);
    } catch (error) {
      console.error('Error ensuring directory exists or is writable:', error);
      throw new Error(`Directory is not writable: ${error}`);
    }
  }

  /**
   * Request microphone permission
   */
  async requestPermission(): Promise<boolean> {
    const result = await requestPermission(PermissionType.MICROPHONE);
    console.log('Microphone permission result:', result);
    return result;
  }

  /**
   * Configure audio session for recording
   */
  private async configureAudioSession(): Promise<void> {
    if (Platform.OS === 'ios') {
      try {
        // Check if InCallManager is available and has the required methods
        if (InCallManager && typeof InCallManager.start === 'function' && typeof InCallManager.setForceSpeakerphoneOn === 'function') {
          // Use InCallManager to properly configure audio session
          console.log('Configuring audio session with InCallManager');
          
          try {
            InCallManager.start({ media: 'audio' });
            InCallManager.setForceSpeakerphoneOn(true);
            
            // Wait to ensure audio session is fully configured
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log('Audio session configured successfully with InCallManager');
          } catch (inCallError) {
            console.warn('Error using InCallManager, falling back to native AVAudioSession:', inCallError);
            // Fall through to use the native module
          }
        } else {
          console.log('InCallManager not available or missing methods, using native AVAudioSession');
        }
        
        // Always try to use our native module as a backup or additional configuration
        const audioSessionModule = NativeModules.RNAudioSession;
        if (audioSessionModule && typeof audioSessionModule.configureSession === 'function') {
          try {
            // Use our native module to configure the session
            const sessionState = await audioSessionModule.configureSession({
              category: 'playAndRecord',
              mode: 'default',
              options: ['defaultToSpeaker', 'allowBluetooth', 'mixWithOthers']
            });
            
            console.log('Audio session configured with native module:', sessionState);
          } catch (nativeError) {
            console.warn('Error configuring audio session with native module:', nativeError);
            // Continue anyway, as AppDelegate might have configured it
          }
        }
        
        // Validate audio session state if possible
        if (audioSessionModule && typeof audioSessionModule.getSessionState === 'function') {
          try {
            const sessionState = await audioSessionModule.getSessionState() as AudioSessionState;
            console.log('Audio session state after configuration:', sessionState);
            if (sessionState && sessionState.isActive === false) {
              console.warn('Audio session is not active after configuration');
            }
          } catch (validationError) {
            console.warn('Could not validate audio session state:', validationError);
          }
        }
        
        // Still add a delay to ensure the audio session is ready
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error configuring audio session:', error);
        console.log('Continuing with recording attempt despite audio session configuration error');
        // Don't throw an error here, try to record anyway
      }
    }
  }

  /**
   * Start recording audio
   */
  async startRecording(options: RecordingOptions = {}): Promise<boolean> {
    try {
      console.log('Starting recording...');
      
      // Store options
      this.options = options;
      
      // Check if already recording
      if (this.recordingState === RecordingState.RECORDING) {
        console.warn('Already recording');
        return false;
      }
      
      // Reset recording attempts if this is a new recording session
      if (this.recordingState === RecordingState.READY) {
        this.recordingAttempts = 0;
      }
      
      // Check if we've exceeded max attempts
      if (this.recordingAttempts >= this.maxRecordingAttempts) {
        throw new Error(`Failed to start recording after ${this.maxRecordingAttempts} attempts. Please restart the app and try again.`);
      }
      
      // Increment attempt counter
      this.recordingAttempts++;
      
      // Request microphone permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.error('Microphone permission denied');
        this.handleError(new Error('Microphone permission denied'));
        return false;
      }
      
      // Add stronger wait after permission is granted
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Configure audio session before recording
      await this.configureAudioSession();
      
      // Set up recording path
      this.recordingPath = this.getRecordingPath();
      console.log('Recording to path:', this.recordingPath);
      
      // Ensure directory exists and is writable
      await this.ensureDirectoryExists(this.recordingPath);
      
      // Delete existing file if it exists
      if (await RNFS.exists(this.recordingPath)) {
        console.log('Deleting existing file');
        await RNFS.unlink(this.recordingPath);
      }
      
      // Configure audio settings - simplified for iOS to avoid conflicts with AVAudioSession
      const audioSet = Platform.select({
        ios: {
          AVFormatIDKeyIOS: AVEncodingOption.aac,
          AVSampleRateKeyIOS: 44100, // Match the sample rate in AppDelegate
          AVNumberOfChannelsKeyIOS: 1,
          AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        },
        android: {
          AudioSourceAndroid: AudioSourceAndroidType.MIC,
          OutputFormatAndroid: 2, // AAC_ADTS
          AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
          AudioEncodingBitRateAndroid: 128000,
          AudioSamplingRateAndroid: 44100,
        },
      });
      
      console.log('Using audio settings:', audioSet);
      
      try {
        // Start recording
        console.log('Calling startRecorder...');
        
        let uri;
        if (Platform.OS === 'ios') {
          // On iOS, use ONLY the filename, not the full path
          const fileNameWithExt = `${this.recordingFilename}.m4a`;
          console.log('iOS: Using filename only for recording:', fileNameWithExt);
          uri = await this.recorder.startRecorder(fileNameWithExt, audioSet);
        } else {
          // On Android, use the full path
          uri = await this.recorder.startRecorder(this.recordingPath, audioSet);
        }
        
        console.log('Recording started successfully with URI:', uri);
        
        // Update the path with the returned URI if it's different
        if (uri && uri !== this.recordingPath) {
          console.log('Updating recording path to returned URI');
          this.recordingPath = uri;
        }
        
        this.recordingState = RecordingState.RECORDING;
        
        // Add recording progress listener
        this.recorder.addRecordBackListener((e) => {
          if (this.options.onRecordingProgress) {
            this.options.onRecordingProgress(e.currentPosition);
          }
        });
        
        return true;
      } catch (recorderError) {
        console.error('Error in startRecorder:', recorderError);
        
        // If this is not our last attempt, try again with a different approach
        if (this.recordingAttempts < this.maxRecordingAttempts) {
          console.log(`Attempt ${this.recordingAttempts} failed, trying again with different settings...`);
          
          // Wait a moment before trying again
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Try with a different file path on next attempt
          if (Platform.OS === 'ios' && this.recordingAttempts === 2) {
            // On second attempt, try with Documents directory
            this.recordingPath = `${RNFS.DocumentDirectoryPath}/recording_${Date.now()}.m4a`;
            this.recordingFilename = this.recordingPath.split('/').pop()!.replace('.m4a', '');
          } else if (Platform.OS === 'ios' && this.recordingAttempts === 3) {
            // On third attempt, try with Caches directory
            this.recordingPath = `${RNFS.CachesDirectoryPath}/recording_${Date.now()}.m4a`;
            this.recordingFilename = this.recordingPath.split('/').pop()!.replace('.m4a', '');
          }
          
          return this.startRecording(options);
        }
        
        throw new Error(`Failed to initialize recorder: ${recorderError instanceof Error ? recorderError.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      this.handleError(error instanceof Error ? error : new Error(`Unknown error starting recording: ${error}`));
      return false;
    }
  }

  /**
   * Stop recording audio
   */
  async stopRecording(): Promise<string | null> {
    try {
      console.log('Stopping recording...');
      
      // Check if recording
      if (this.recordingState !== RecordingState.RECORDING) {
        console.warn('Not currently recording');
        return null;
      }
      
      // Remove recording listener
      this.recorder.removeRecordBackListener();
      
      // Stop recording
      const result = await this.recorder.stopRecorder();
      console.log('Recorder stopped with result:', result);
      
      // Stop InCallManager if we're on iOS and it's available with the stop method
      if (Platform.OS === 'ios' && InCallManager && typeof InCallManager.stop === 'function') {
        try {
          InCallManager.stop();
        } catch (error) {
          console.warn('Error stopping InCallManager:', error);
        }
      }
      
      // Check if file exists
      const fileExists = await RNFS.exists(this.recordingPath);
      console.log(`File exists at ${this.recordingPath}: ${fileExists}`);
      
      if (!fileExists) {
        // Try to find the file using the result from stopRecorder
        if (result && typeof result === 'string' && result !== this.recordingPath) {
          const altExists = await RNFS.exists(result);
          console.log(`Alternative file exists at ${result}: ${altExists}`);
          
          if (altExists) {
            this.recordingPath = result;
          } else {
            throw new Error('Recording file not found at any path');
          }
        } else {
          throw new Error('Recording file not found');
        }
      }
      
      // Get file stats
      const stats = await RNFS.stat(this.recordingPath);
      console.log('Recording stats:', stats);
      
      if (stats.size === 0) {
        throw new Error('Recording file is empty');
      }
      
      // Update state
      this.recordingState = RecordingState.RECORDED;
      
      // Notify completion
      if (this.options.onRecordingComplete) {
        this.options.onRecordingComplete(this.recordingPath);
      }
      
      return this.recordingPath;
    } catch (error) {
      console.error('Error stopping recording:', error);
      this.handleError(error instanceof Error ? error : new Error(`Unknown error stopping recording: ${error}`));
      return null;
    }
  }

  /**
   * Play the recorded audio
   */
  playRecording(onComplete?: () => void): void {
    try {
      if (!this.recordingPath) {
        throw new Error('No recording available to play');
      }
      
      console.log('Attempting to play recording:', this.recordingPath);
      
      // Check if file exists
      RNFS.exists(this.recordingPath).then(exists => {
        if (!exists) {
          throw new Error('Recording file not found');
        }
        
        this.recordingState = RecordingState.PLAYING;
        
        // Use startPlayer from AudioRecorderPlayer
        this.recorder.startPlayer(this.recordingPath).then(() => {
          console.log('Playback started');
          
          // Add playback listener
          this.recorder.addPlayBackListener((e) => {
            // Check if playback is complete
            if (e.currentPosition >= e.duration && e.duration > 0) {
              console.log('Playback complete');
              this.recorder.removePlayBackListener();
              this.recordingState = RecordingState.RECORDED;
              
              if (onComplete) {
                onComplete();
              }
            }
          });
        }).catch(error => {
          console.error('Error playing recording:', error);
          this.handleError(new Error(`Failed to play recording: ${error}`));
        });
      }).catch(error => {
        console.error('Error checking file existence:', error);
        this.handleError(new Error(`Failed to check file: ${error}`));
      });
    } catch (error) {
      console.error('Error playing recording:', error);
      this.handleError(error instanceof Error ? error : new Error(`Unknown error playing recording: ${error}`));
    }
  }

  /**
   * Get the current recording state
   */
  getState(): RecordingState {
    return this.recordingState;
  }

  /**
   * Get the current recording path
   */
  getRecordingFilePath(): string {
    return this.recordingPath;
  }

  /**
   * Reset the recorder
   */
  reset(): void {
    console.log('Resetting recorder');
    
    if (this.recordingState === RecordingState.RECORDING) {
      this.recorder.stopRecorder();
      this.recorder.removeRecordBackListener();
      
      // Stop InCallManager if we're on iOS and it's available
      if (Platform.OS === 'ios' && InCallManager && typeof InCallManager.stop === 'function') {
        try {
          InCallManager.stop();
        } catch (error) {
          console.warn('Error stopping InCallManager:', error);
        }
      }
    }
    
    this.recordingState = RecordingState.READY;
    this.recordingAttempts = 0;
  }

  /**
   * Handle recording errors
   */
  private handleError(error: Error): void {
    console.error('AudioRecorder error:', error);
    
    const previousState = this.recordingState;
    this.recordingState = RecordingState.ERROR;
    
    // Clean up if we were recording
    if (previousState === RecordingState.RECORDING) {
      this.recorder.removeRecordBackListener();
      
      // Stop InCallManager if we're on iOS and it's available
      if (Platform.OS === 'ios' && InCallManager && typeof InCallManager.stop === 'function') {
        try {
          InCallManager.stop();
        } catch (error) {
          console.warn('Error stopping InCallManager:', error);
        }
      }
    }
    
    if (this.options.onRecordingError) {
      this.options.onRecordingError(error);
    }
  }
}

// Export a singleton instance
export default new AudioRecorder();
