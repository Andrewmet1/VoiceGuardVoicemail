/**
 * CallDetectionWrapper.ts
 * 
 * This is a wrapper around react-native-call-detection that handles the
 * BatchedBridge.registerCallableModule error in newer versions of React Native.
 */

import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

// Import the original module but don't use it directly
let CallDetectionOriginal: any = null;

// Define the interface for the CallDetector class
interface CallDetectorOptions {
  title?: string;
  text?: string;
  ios?: {
    appName?: string;
  };
}

class CallDetector {
  private detector: any = null;
  private callback: (callState: string, phoneNumber: string) => void;
  private errorCallback?: (error: Error) => void;
  private options: CallDetectorOptions;

  constructor(
    callback: (callState: string, phoneNumber: string) => void,
    errorCallback?: (error: Error) => void,
    options: CallDetectorOptions = {}
  ) {
    this.callback = callback;
    this.errorCallback = errorCallback;
    this.options = options;

    // Initialize the detector safely
    this.initializeDetector();
  }

  private async initializeDetector() {
    try {
      // Dynamically import the module to avoid the BatchedBridge error
      const module = await import('react-native-call-detection');
      CallDetectionOriginal = module.default;

      if (CallDetectionOriginal) {
        this.detector = new CallDetectionOriginal(
          this.callback,
          true, // loadPermissions
          this.options
        );
      } else {
        throw new Error('CallDetection module not found');
      }
    } catch (error) {
      console.error('Failed to initialize CallDetector:', error);
      if (this.errorCallback) {
        this.errorCallback(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  dispose() {
    try {
      if (this.detector) {
        this.detector.dispose();
        this.detector = null;
      }
    } catch (error) {
      console.error('Error disposing CallDetector:', error);
      if (this.errorCallback) {
        this.errorCallback(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  startListener() {
    try {
      if (this.detector) {
        this.detector.startListener();
      } else {
        throw new Error('CallDetector not initialized');
      }
    } catch (error) {
      console.error('Error starting CallDetector listener:', error);
      if (this.errorCallback) {
        this.errorCallback(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  stopListener() {
    try {
      if (this.detector) {
        this.detector.stopListener();
      } else {
        throw new Error('CallDetector not initialized');
      }
    } catch (error) {
      console.error('Error stopping CallDetector listener:', error);
      if (this.errorCallback) {
        this.errorCallback(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }
}

export default CallDetector;
