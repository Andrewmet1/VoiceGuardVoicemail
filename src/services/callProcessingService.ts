import { Platform } from 'react-native';
import { analyzeVoice } from './voiceAnalysisService';
import { showCallAlert } from './notificationService';
import { getContactName } from '../utils/contactsHelper';
import { useCallDetection } from '../contexts/CallDetectionContext';
import { useSettings } from '../contexts/SettingsContext';

// Safely import native modules
let Contacts: any = null;
let audioRecorder: any = null;
let setupNotifications: any = null;

// Only load native modules if we're on a supported platform
if (Platform.OS === 'ios' || Platform.OS === 'android') {
  try {
    Contacts = require('react-native-contacts').default;
    const audioRecorderModule = require('./audioRecorderService');
    audioRecorder = audioRecorderModule.audioRecorder;
    
    const notificationModule = require('./notificationService');
    setupNotifications = notificationModule.setupNotifications;
  } catch (error) {
    console.error('Error loading native modules in callProcessingService:', error);
    // Continue without crashing
  }
}

// Import dynamically to avoid circular dependencies
let callDetectionContext: ReturnType<typeof useCallDetection> | null = null;
let settingsContext: ReturnType<typeof useSettings> | null = null;

/**
 * Set the call detection context
 */
export const setCallDetectionContext = (context: ReturnType<typeof useCallDetection>) => {
  callDetectionContext = context;
};

/**
 * Set the settings context
 */
export const setSettingsContext = (context: ReturnType<typeof useSettings>) => {
  settingsContext = context;
};

/**
 * Process an incoming call
 * @param phoneNumber - The phone number of the incoming call
 */
export const processIncomingCall = async (phoneNumber: string): Promise<void> => {
  try {
    console.log(`Processing incoming call from: ${phoneNumber}`);
    
    // Skip processing if contexts are not available
    if (!callDetectionContext || !settingsContext) {
      console.warn('Call detection or settings context not available');
      return;
    }
    
    const { settings } = settingsContext;
    
    // Check if background monitoring is enabled
    if (!settings.enableBackgroundMonitoring) {
      console.log('Background monitoring is disabled, skipping call processing');
      return;
    }
    
    // Check if required modules are available
    if (!Contacts || !audioRecorder) {
      console.warn('Required native modules not available, skipping call processing');
      return;
    }
    
    // Check if the number is in trusted contacts
    const isInContacts = await checkIfInContacts(phoneNumber);
    if (isInContacts) {
      console.log('Number is in contacts, skipping AI detection');
      return;
    }
    
    // Start recording the call for analysis
    await startCallRecording(phoneNumber);
    
  } catch (error) {
    console.error('Error processing incoming call:', error);
  }
};

/**
 * Check if a phone number is in the user's contacts
 */
const checkIfInContacts = async (phoneNumber: string): Promise<boolean> => {
  try {
    // Normalize the phone number for comparison
    const normalizedNumber = normalizePhoneNumber(phoneNumber);
    
    // Get all contacts
    const contacts = await Contacts.getAll();
    
    // Check if the number exists in any contact
    for (const contact of contacts) {
      if (contact.phoneNumbers) {
        for (const phone of contact.phoneNumbers) {
          const contactNumber = normalizePhoneNumber(phone.number);
          if (contactNumber === normalizedNumber) {
            return true;
          }
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking contacts:', error);
    return false;
  }
};

/**
 * Normalize a phone number for comparison
 */
const normalizePhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  return phoneNumber.replace(/\D/g, '');
};

/**
 * Start recording the call for analysis
 */
const startCallRecording = async (phoneNumber: string): Promise<void> => {
  try {
    if (!settingsContext) return;
    
    const { settings } = settingsContext;
    
    // Skip recording if disabled in settings
    if (!settings.recordCallsForAnalysis) {
      console.log('Call recording is disabled in settings');
      return;
    }
    
    console.log('Starting call recording for analysis');
    
    // Start recording
    await audioRecorder.start();
    
    // Set a timeout to stop recording after the minimum duration
    setTimeout(async () => {
      await stopCallRecordingAndAnalyze(phoneNumber);
    }, settings.minimumCallDuration * 1000);
    
  } catch (error) {
    console.error('Error starting call recording:', error);
  }
};

/**
 * Stop call recording and analyze the voice
 */
const stopCallRecordingAndAnalyze = async (phoneNumber: string): Promise<void> => {
  try {
    console.log('Stopping call recording and analyzing voice');
    
    // Stop recording
    const audioData = await audioRecorder.stop();
    
    if (!audioData) {
      console.log('No audio data recorded');
      return;
    }
    
    // Get caller name if available
    const callerName = await getContactName(phoneNumber);
    
    // Analyze the voice
    if (!settingsContext) return;
    
    const { settings } = settingsContext;
    const analysisResult = await analyzeVoice(audioData, settings.sensitivityLevel);
    
    console.log('Voice analysis result:', analysisResult);
    
    // Add call record to history
    if (callDetectionContext) {
      const callId = await callDetectionContext.addCallRecord({
        phoneNumber,
        callerName,
        timestamp: Date.now(),
        duration: settings.minimumCallDuration,
        isAIDetected: analysisResult.isAI,
        confidenceScore: analysisResult.confidenceScore,
        isBlocked: false
      });
      
      // Show notification if AI detected and notifications are enabled
      if (analysisResult.isAI && settings.notifyOnSuspiciousCalls) {
        showCallAlert(phoneNumber, callerName, analysisResult.confidenceScore);
      }
    }
    
  } catch (error) {
    console.error('Error stopping call recording and analyzing:', error);
  }
};

/**
 * Get call history
 */
export const getCallHistory = (): any[] => {
  if (!callDetectionContext) return [];
  return callDetectionContext.callHistory;
};

/**
 * Clear call history
 */
export const clearCallHistory = async (): Promise<void> => {
  if (!callDetectionContext) return;
  await callDetectionContext.clearCallHistory();
};
