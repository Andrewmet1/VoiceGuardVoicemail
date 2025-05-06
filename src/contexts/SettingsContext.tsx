import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the settings interface
export interface Settings {
  enableBackgroundMonitoring: boolean;
  notifyOnSuspiciousCalls: boolean;
  recordCallsForAnalysis: boolean;
  sensitivityLevel: 'low' | 'medium' | 'high';
  batteryOptimization: boolean;
  minimumCallDuration: number; // in seconds
  trustedContacts: string[]; // array of contact IDs
  userEmail: string;
  onboardingCompleted: boolean;
  useLocalProcessing: boolean;
  enableDebugMode: boolean;
}

// Default settings
const defaultSettings: Settings = {
  enableBackgroundMonitoring: true,
  notifyOnSuspiciousCalls: true,
  recordCallsForAnalysis: true,
  sensitivityLevel: 'medium',
  batteryOptimization: true,
  minimumCallDuration: 5, // 5 seconds
  trustedContacts: [],
  userEmail: '',
  onboardingCompleted: false,
  useLocalProcessing: true,
  enableDebugMode: false,
};

// Create the context
const SettingsContext = createContext<{
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  isLoading: boolean;
}>({
  settings: defaultSettings,
  updateSettings: async () => {},
  resetSettings: async () => {},
  isLoading: true,
});

// Provider component
export const SettingsProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem('voiceGuardSettings');
        if (storedSettings) {
          setSettings(prev => ({
            ...prev,
            ...JSON.parse(storedSettings),
          }));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Update settings
  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await AsyncStorage.setItem('voiceGuardSettings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  // Reset settings to default
  const resetSettings = async () => {
    try {
      setSettings(defaultSettings);
      await AsyncStorage.setItem('voiceGuardSettings', JSON.stringify(defaultSettings));
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  };

  if (isLoading) {
    return null; // or a loading indicator
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use the context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
