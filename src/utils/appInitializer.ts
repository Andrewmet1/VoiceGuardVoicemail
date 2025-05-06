/**
 * App Initialization Utilities
 * Handles early app initialization tasks like requesting permissions
 */

import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, PermissionStatus } from 'react-native-permissions';
import { NativeModules } from 'react-native';

// Import InCallManager safely with a fallback
let InCallManager: any = null;
try {
  InCallManager = require('react-native-incall-manager').default;
} catch (error) {
  console.warn('Failed to import InCallManager:', error);
}

/**
 * Request microphone permission proactively at app launch
 */
export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    console.log('Proactively requesting microphone permission...');
    
    // Check platform
    const permission = Platform.select({
      ios: PERMISSIONS.IOS.MICROPHONE,
      android: PERMISSIONS.ANDROID.RECORD_AUDIO,
      default: null,
    });
    
    if (!permission) {
      console.warn('Platform not supported for permission request');
      return false;
    }
    
    // Check current status first
    const status = await check(permission);
    console.log(`Current microphone permission status: ${status}`);
    
    // Handle different permission statuses
    switch (status) {
      case RESULTS.GRANTED:
        console.log('Microphone permission already granted');
        return true;
        
      case RESULTS.DENIED:
        // Request permission
        const result = await request(permission);
        console.log(`Microphone permission request result: ${result}`);
        return result === RESULTS.GRANTED;
        
      case RESULTS.BLOCKED:
        console.log('Microphone permission is blocked. User needs to enable it in settings.');
        return false;
        
      case RESULTS.UNAVAILABLE:
        console.log('Microphone permission is not available on this device');
        return false;
        
      case RESULTS.LIMITED:
        console.log('Microphone permission is granted but limited');
        return true;
        
      default:
        return false;
    }
  } catch (error) {
    console.error('Error requesting microphone permission:', error);
    return false;
  }
};

/**
 * Validate audio session state
 * This helps debug edge cases by checking if the audio session is properly configured
 */
export const validateAudioSession = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') return true;
  
  try {
    // First try using InCallManager if available
    if (InCallManager) {
      // Start InCallManager
      InCallManager.start({ media: 'audio' });
      InCallManager.setForceSpeakerphoneOn(true);
      
      // Wait to ensure audio session is fully configured
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check session state using a native module if available
      const audioSessionModule = NativeModules.RNAudioSession;
      if (audioSessionModule) {
        const sessionState = await audioSessionModule.getSessionState();
        console.log('Audio session state:', sessionState);
        return sessionState?.isActive === true;
      }
      
      // Fallback: If we can't check directly, assume it's working
      console.log('Audio session validation: No native module available to check state');
      return true;
    } else {
      console.log('Audio session validation: InCallManager not available');
      // Rely on AppDelegate configuration
      return true;
    }
  } catch (error) {
    console.error('Error validating audio session:', error);
    return false;
  }
};

/**
 * Initialize app
 * Call this at app launch to handle all initialization tasks
 */
export const initializeApp = async (): Promise<void> => {
  try {
    // Request microphone permission proactively
    await requestMicrophonePermission();
    
    // Validate audio session
    if (Platform.OS === 'ios') {
      const isValid = await validateAudioSession();
      console.log(`Audio session validation: ${isValid ? 'Passed' : 'Failed'}`);
      
      // Clean up InCallManager if we used it for validation
      if (InCallManager) {
        try {
          InCallManager.stop();
        } catch (error) {
          console.warn('Error stopping InCallManager:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error during app initialization:', error);
  }
};

export default {
  initializeApp,
  requestMicrophonePermission,
  validateAudioSession,
};
