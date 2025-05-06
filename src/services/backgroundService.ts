import { Platform, AppState, NativeEventEmitter, NativeModules } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import CallDetector from '../patches/CallDetectionWrapper';

// Import call detection modules based on platform - SAFELY
let BackgroundFetch: any = null;
let BackgroundTimer: any = null;
let CallDetectionManager: any = null;
let callDetectionEmitter: any = null;
let Permissions: any = null;

// Safely load platform-specific modules
if (Platform.OS === 'ios' || Platform.OS === 'android') {
  try {
    // Only import these modules if we're on a real device
    // Use dynamic imports to avoid dependency map issues
    import('react-native-background-fetch')
      .then(module => {
        BackgroundFetch = module.default;
        console.log('Successfully loaded BackgroundFetch');
      })
      .catch(error => {
        console.error('Failed to load BackgroundFetch:', error);
      });
    
    import('react-native-background-timer')
      .then(module => {
        BackgroundTimer = module.default;
        console.log('Successfully loaded BackgroundTimer');
      })
      .catch(error => {
        console.error('Failed to load BackgroundTimer:', error);
      });
    
    import('react-native-permissions')
      .then(module => {
        const { check, request, PERMISSIONS, RESULTS } = module;
        Permissions = { check, request, PERMISSIONS, RESULTS };
        console.log('Successfully loaded Permissions');
      })
      .catch(error => {
        console.error('Failed to load Permissions:', error);
      });
    
    // For native event emitter, we still need the native module
    if (Platform.OS === 'ios') {
      try {
        CallDetectionManager = NativeModules.CallDetectionManager;
        if (CallDetectionManager) {
          callDetectionEmitter = new NativeEventEmitter(CallDetectionManager);
          console.log('Successfully loaded iOS CallDetectionManager for events');
        }
      } catch (error) {
        console.error('Failed to load iOS CallDetectionManager:', error);
      }
    } else if (Platform.OS === 'android') {
      try {
        CallDetectionManager = NativeModules.CallDetectionModule;
        if (CallDetectionManager) {
          callDetectionEmitter = new NativeEventEmitter(CallDetectionManager);
          console.log('Successfully loaded Android CallDetectionModule for events');
        }
      } catch (error) {
        console.error('Failed to load Android CallDetectionModule:', error);
      }
    }
  } catch (error) {
    console.error('Error loading native modules:', error);
    // Continue without crashing
  }
}

// Service state
let isServiceRunning: boolean = false;
let callDetectorInstance: any = null;
let backgroundTaskId: number | null = null;
let appStateSubscription: any = null;

// Callback types
type CallStateCallback = (callState: string, phoneNumber: string) => void;
type ErrorCallback = (error: Error) => void;

/**
 * Initialize the background service for call monitoring
 */
export const initBackgroundService = async (): Promise<boolean> => {
  try {
    // Check if we're on a supported platform
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      console.warn('Call detection is not supported on this platform');
      return false;
    }
    
    // Check if required modules are available
    if (!CallDetectionManager || !BackgroundFetch || !BackgroundTimer) {
      console.warn('Required native modules not available, background service disabled');
      return false;
    }
    
    // Check if service is already running
    if (isServiceRunning) {
      console.log('Background service is already running');
      return true;
    }

    // Request necessary permissions
    await requestPermissions();

    // Configure background fetch for iOS
    if (Platform.OS === 'ios') {
      await configureBackgroundFetch();
    }

    // Start call detection
    await startCallDetection();

    // Set up app state change listener
    appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    isServiceRunning = true;
    console.log('Background service initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize background service:', error);
    return false;
  }
};

/**
 * Stop the background service
 */
export const stopBackgroundService = async (): Promise<boolean> => {
  try {
    // Stop call detection
    if (callDetectorInstance) {
      callDetectorInstance.dispose();
      callDetectorInstance = null;
    }

    // Stop background timer if running
    if (backgroundTaskId !== null && Platform.OS === 'android') {
      BackgroundTimer.clearTimeout(backgroundTaskId);
      backgroundTaskId = null;
    }

    // Remove app state listener
    if (appStateSubscription) {
      appStateSubscription.remove();
    }

    isServiceRunning = false;
    console.log('Background service stopped successfully');
    return true;
  } catch (error) {
    console.error('Failed to stop background service:', error);
    return false;
  }
};

/**
 * Request necessary permissions for call detection
 */
const requestPermissions = async (): Promise<void> => {
  try {
    // Permissions needed for call detection
    const permissions = Platform.select({
      ios: [
        Permissions.PERMISSIONS.IOS.MICROPHONE,
        Permissions.PERMISSIONS.IOS.SPEECH_RECOGNITION,
      ],
      android: [
        Permissions.PERMISSIONS.ANDROID.READ_PHONE_STATE,
        Permissions.PERMISSIONS.ANDROID.READ_CALL_LOG,
        Permissions.PERMISSIONS.ANDROID.RECORD_AUDIO,
      ],
      default: [],
    });

    if (!permissions) return;

    // Request each permission
    for (const permission of permissions) {
      const result = await Permissions.check(permission);
      if (result !== Permissions.RESULTS.GRANTED) {
        await Permissions.request(permission);
      }
    }
  } catch (error) {
    console.error('Error requesting permissions:', error);
    throw error;
  }
};

/**
 * Configure background fetch for iOS
 */
const configureBackgroundFetch = async (): Promise<void> => {
  try {
    // Configure background fetch
    const status = await BackgroundFetch.configure(
      {
        minimumFetchInterval: 15, // minutes
        stopOnTerminate: false,
        startOnBoot: true,
        enableHeadless: true,
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
      },
      async (taskId: string) => {
        console.log('[BackgroundFetch] Task:', taskId);
        
        // Ensure call detection is running
        if (!callDetectorInstance) {
          await startCallDetection();
        }
        
        // Required: Signal completion of your task
        BackgroundFetch.finish(taskId);
      },
      (error: Error) => {
        console.error('[BackgroundFetch] Failed to configure:', error);
      }
    );
    
    console.log('[BackgroundFetch] configure status:', status);
  } catch (error) {
    console.error('Error configuring background fetch:', error);
    throw error;
  }
};

/**
 * Start call detection
 */
const startCallDetection = async (): Promise<void> => {
  try {
    if (callDetectorInstance) {
      // Already running
      return;
    }
    
    // Create a new call detector instance
    callDetectorInstance = new CallDetector(
      handleCallStateChange,
      (error: Error) => {
        console.error('Call detection error:', error);
      },
      {
        title: 'VoiceGuard Call Detection',
        text: 'Monitoring for incoming calls',
        ios: {
          appName: 'VoiceGuard'
        }
      }
    );
    
    // Start listening for call events
    callDetectorInstance.startListener();
    console.log('Call detection started');
  } catch (error) {
    console.error('Failed to start call detection:', error);
    throw error;
  }
};

/**
 * Handle call state changes
 */
const handleCallStateChange = (callState: string, phoneNumber: string = '') => {
  console.log(`Call state changed: ${callState}, Number: ${phoneNumber}`);
  
  // Import dynamically to avoid circular dependencies
  const { processIncomingCall } = require('./callProcessingService');
  
  switch (callState.toLowerCase()) {
    case 'incoming':
    case 'ringing':
      // Process incoming call
      processIncomingCall(phoneNumber);
      break;
      
    case 'disconnected':
    case 'ended':
      // Call ended, clean up any resources
      break;
      
    case 'connected':
    case 'offhook':
      // Call connected, start recording if enabled
      break;
      
    default:
      console.log(`Unhandled call state: ${callState}`);
  }
};

/**
 * Handle app state changes
 */
const handleAppStateChange = (nextAppState: string) => {
  console.log(`App state changed to: ${nextAppState}`);
  
  if (nextAppState === 'active') {
    // App came to foreground
    if (!callDetectorInstance) {
      startCallDetection();
    }
  } else if (nextAppState === 'background') {
    // App went to background
    // For Android, we need to ensure our service keeps running
    if (Platform.OS === 'android') {
      ensureBackgroundRunning();
    }
  }
};

/**
 * Ensure the service keeps running in the background (Android)
 */
const ensureBackgroundRunning = () => {
  if (Platform.OS !== 'android') return;
  
  // Use BackgroundTimer to keep the JS runtime alive
  if (backgroundTaskId === null) {
    backgroundTaskId = BackgroundTimer.setInterval(() => {
      console.log('Background heartbeat...');
      
      // Check if call detection is still running
      if (!callDetectorInstance) {
        startCallDetection();
      }
    }, 60000); // Check every minute
  }
};

/**
 * Check if the background service is running
 */
export const isBackgroundServiceRunning = (): boolean => {
  return isServiceRunning;
};

/**
 * Get battery optimization recommendations based on device
 */
export const getBatteryOptimizationRecommendations = async (): Promise<string[]> => {
  const recommendations: string[] = [];
  
  if (Platform.OS === 'android') {
    const manufacturer = await DeviceInfo.getManufacturer();
    const model = await DeviceInfo.getModel();
    
    // General recommendation for all Android devices
    recommendations.push('Disable battery optimization for VoiceGuard in Settings > Apps > VoiceGuard > Battery');
    
    // Manufacturer-specific recommendations
    if (manufacturer.toLowerCase().includes('xiaomi') || 
        manufacturer.toLowerCase().includes('redmi')) {
      recommendations.push('Enable Autostart for VoiceGuard in Security app');
      recommendations.push('Set "No restrictions" in Battery saver settings');
    } else if (manufacturer.toLowerCase().includes('huawei')) {
      recommendations.push('Add VoiceGuard to Protected apps in Battery settings');
      recommendations.push('Disable "Manage automatically" in App launch settings');
    } else if (manufacturer.toLowerCase().includes('samsung')) {
      recommendations.push('Disable "Put unused apps to sleep" for VoiceGuard');
      recommendations.push('Add VoiceGuard to "Unmonitored apps" in Device care');
    } else if (manufacturer.toLowerCase().includes('oneplus')) {
      recommendations.push('Disable "Advanced optimization" for VoiceGuard');
      recommendations.push('Enable "Auto-launch" for VoiceGuard');
    }
  }
  
  return recommendations;
};
