/**
 * Web platform-specific implementations for VoiceGuard
 */

// Mock implementation of native modules for web
export const startBackgroundService = async (): Promise<boolean> => {
  console.log('Web platform: Background service started (mock)');
  return true;
};

export const stopBackgroundService = async (): Promise<boolean> => {
  console.log('Web platform: Background service stopped (mock)');
  return true;
};

// Mock implementation for call detection
export const registerCallListener = (callback: (phoneNumber: string, callerId: string) => void): void => {
  console.log('Web platform: Call listener registered (mock)');
  
  // Simulate incoming calls every 30 seconds for demo purposes
  setInterval(() => {
    const isAICall = Math.random() > 0.7; // 30% chance of AI call
    const phoneNumbers = [
      '(555) 123-4567',
      '(555) 987-6543',
      '(555) 234-5678',
      '(555) 876-5432'
    ];
    const callerIds = [
      'Unknown Caller',
      'John Smith',
      'Financial Services',
      'Tech Support',
      'Amazon Delivery'
    ];
    
    const randomPhoneNumber = phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)];
    const randomCallerId = isAICall ? 
      callerIds[0] : // Unknown caller for AI calls
      callerIds[Math.floor(Math.random() * callerIds.length)];
    
    callback(randomPhoneNumber, randomCallerId);
  }, 30000);
};

// Mock implementation for permissions
export const requestPermissions = async (): Promise<boolean> => {
  console.log('Web platform: Permissions requested (mock)');
  return true;
};

// Mock implementation for audio recording
export const startRecording = async (): Promise<boolean> => {
  console.log('Web platform: Recording started (mock)');
  
  // If browser supports MediaRecorder API, we could implement actual recording
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Web platform: Microphone access granted');
    } catch (error) {
      console.error('Web platform: Microphone access denied', error);
    }
  }
  
  return true;
};

export const stopRecording = async (): Promise<string> => {
  console.log('Web platform: Recording stopped (mock)');
  return 'mock-recording-path.wav';
};

// Web storage implementation
export const saveToStorage = async (key: string, value: any): Promise<void> => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
};

export const getFromStorage = async (key: string): Promise<any> => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error getting from storage:', error);
    return null;
  }
};

// Web notification implementation
export const showNotification = (title: string, body: string): void => {
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, { body });
      }
    });
  } else {
    // Fallback for browsers that don't support notifications
    alert(`${title}: ${body}`);
  }
};
