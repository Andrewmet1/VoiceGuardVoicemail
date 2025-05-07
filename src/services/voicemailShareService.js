/**
 * Voicemail Share Service
 * Handles voicemails shared from the iOS Share Extension
 */

import { NativeModules, Platform } from 'react-native';

const { VoicemailShareModule } = NativeModules;

/**
 * Check if there's a shared voicemail from the iOS Share Extension
 * @returns {Promise<string|null>} Path to the shared voicemail file, or null if none
 */
export const checkForSharedVoicemail = async () => {
  if (Platform.OS !== 'ios') {
    console.log('Share extension is only supported on iOS');
    return null;
  }
  
  try {
    const path = await VoicemailShareModule.getSharedVoicemailPath();
    return path;
  } catch (error) {
    console.error('Error checking for shared voicemail:', error);
    return null;
  }
};
