import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from './SettingsContext';
import { analyzeVoice } from '../services/voiceAnalysisService';
import { getContactName } from '../utils/contactsHelper';
import RNFS from 'react-native-fs';
import { arrayBufferToBase64 } from '../utils/arrayBufferToBase64';
import { uuid } from '../utils/uuid';
import { addToBlockList } from '../utils/blockListHelper';

// Call record interface
export interface CallRecord {
  id: string;
  phoneNumber: string;
  callerName: string | null;
  timestamp: number;
  duration: number; // in seconds
  isAIDetected: boolean;
  isAI: boolean; // Added for new UI
  confidenceScore: number; // 0-1 where 1 is highest confidence of AI
  modelDetails?: {
    huggingface: {
      enabled: boolean;
      genuine: number | null;
      spoof: number | null;
    };
    voiceguard: {
      enabled: boolean;
      genuine: number | null;
      spoof: number | null;
    };
    ensemble: {
      genuine: number;
      spoof: number;
    };
  };
  message?: string;
  audioSamplePath?: string;
  isBlocked: boolean;
  notes?: string;
}

// Context interface
interface CallDetectionContextType {
  callHistory: CallRecord[];
  currentCall: CallRecord | null;
  isAnalyzing: boolean;
  addCallRecord: (record: Omit<CallRecord, 'id'>) => Promise<string>;
  updateCallRecord: (id: string, updates: Partial<CallRecord>) => Promise<void>;
  deleteCallRecord: (id: string) => Promise<void>;
  clearCallHistory: () => Promise<void>;
  analyzeIncomingCall: (phoneNumber: string, audioData: ArrayBuffer) => Promise<{
    isAI: boolean;
    confidenceScore: number;
    modelDetails: {
      huggingface: {
        enabled: boolean;
        genuine: number | null;
        spoof: number | null;
      };
      voiceguard: {
        enabled: boolean;
        genuine: number | null;
        spoof: number | null;
      };
      ensemble: {
        genuine: number;
        spoof: number;
      };
    };
    message: string | undefined;
  }>;
  analyzeCall: (phoneNumber: string) => Promise<{ isAIDetected: boolean; confidence: number }>;
}

// Create the context
const CallDetectionContext = createContext<CallDetectionContextType | null>(null);

// Provider component
export const CallDetectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [currentCall, setCurrentCall] = useState<CallRecord | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { settings } = useSettings();

  // Load call history from storage
  useEffect(() => {
    const loadCallHistory = async () => {
      try {
        console.log('Loading call history from storage...');
        const storedHistory = await AsyncStorage.getItem('voiceGuardCallHistory');
        if (storedHistory) {
          setCallHistory(JSON.parse(storedHistory));
          console.log('Call history loaded successfully');
        } else {
          console.log('No call history found in storage');
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load call history:', error);
        // Continue with empty call history
        setCallHistory([]);
        setIsInitialized(true);
      }
    };

    loadCallHistory();
  }, []);

  // Save call history to storage whenever it changes
  useEffect(() => {
    if (!isInitialized) return;
    
    const saveCallHistory = async () => {
      try {
        await AsyncStorage.setItem('voiceGuardCallHistory', JSON.stringify(callHistory));
      } catch (error) {
        console.error('Failed to save call history:', error);
        // Continue without saving - app will still function
      }
    };

    saveCallHistory();
  }, [callHistory, isInitialized]);

  // Add a new call record
  const addCallRecord = useCallback(async (record: Omit<CallRecord, 'id'>): Promise<string> => {
    const id = uuid.v4();
    const newRecord: CallRecord = {
      ...record,
      id,
      timestamp: Date.now(),
      isBlocked: false // default to not blocked
    };

    setCallHistory(prev => [newRecord, ...prev]);
    
    try {
      await AsyncStorage.setItem('voiceGuardCallHistory', JSON.stringify([newRecord, ...callHistory]));
    } catch (storageError) {
      console.error('Failed to save call history:', storageError);
      // Continue without saving - app will still function
    }

    // If AI is detected with high confidence, add to blocked list
    if (record.isAIDetected && record.confidenceScore > 0.9) {
      try {
        const blocked = await addToBlockList(record.phoneNumber);
        if (blocked) {
          // Update the record to reflect blocked status
          newRecord.isBlocked = true;
          setCallHistory(prev => 
            prev.map(item => item.id === id ? {...item, isBlocked: true} : item)
          );
        }
      } catch (blockError) {
        console.error('Failed to add to block list:', blockError);
        // Continue without blocking
      }
    }

    return id;
  }, [callHistory]);

  // Update an existing call record
  const updateCallRecord = useCallback(async (id: string, updates: Partial<CallRecord>): Promise<void> => {
    setCallHistory(prevHistory => 
      prevHistory.map(record => 
        record.id === id ? { ...record, ...updates } : record
      )
    );
  }, []);

  // Delete a call record
  const deleteCallRecord = useCallback(async (id: string): Promise<void> => {
    setCallHistory(prevHistory => prevHistory.filter(record => record.id !== id));
  }, []);

  // Clear all call history
  const clearCallHistory = useCallback(async (): Promise<void> => {
    setCallHistory([]);
    await AsyncStorage.removeItem('voiceGuardCallHistory');
  }, []);

  // Analyze an incoming call's audio for AI voice detection
  const analyzeIncomingCall = useCallback(async (
    phoneNumber: string, 
    audioData: ArrayBuffer
  ): Promise<{
    isAI: boolean;
    confidenceScore: number;
    modelDetails: {
      huggingface: {
        enabled: boolean;
        genuine: number | null;
        spoof: number | null;
      };
      voiceguard: {
        enabled: boolean;
        genuine: number | null;
        spoof: number | null;
      };
      ensemble: {
        genuine: number;
        spoof: number;
      };
    };
    message: string | undefined;
  }> => {
    setIsAnalyzing(true);
    
    try {
      console.log(`Analyzing call from ${phoneNumber}...`);
      
      // Convert ArrayBuffer to Base64 for API
      const base64Audio = arrayBufferToBase64(audioData);
      
      // Save audio to temporary file
      let tempFilePath = '';
      try {
        tempFilePath = `${RNFS.TemporaryDirectoryPath}temp_${uuid.v4()}.wav`;
        await RNFS.writeFile(tempFilePath, base64Audio, 'base64');
      } catch (fileError) {
        console.error('Failed to write audio file:', fileError);
        throw new Error('Failed to process audio data');
      }
      
      // Analyze with VoiceGuard API
      let result;
      try {
        result = await analyzeVoice(tempFilePath);
      } catch (apiError) {
        console.error('API analysis failed:', apiError);
        // Clean up temp file if it exists
        if (tempFilePath && await RNFS.exists(tempFilePath)) {
          await RNFS.unlink(tempFilePath);
        }
        throw apiError;
      }
      
      // Clean up temp file
      if (await RNFS.exists(tempFilePath)) {
        await RNFS.unlink(tempFilePath);
      }
      
      // Create ensemble scores if not provided by API
      const ensemble = {
        genuine: result.modelDetails.huggingface?.genuine || 0,
        spoof: result.modelDetails.huggingface?.spoof || 0
      };
      
      // Add ensemble to result if not present
      if (!result.modelDetails.ensemble) {
        result.modelDetails = {
          ...result.modelDetails,
          ensemble
        };
      }
      
      console.log(`Analysis complete - AI detected: ${result.isAI}, confidence: ${result.confidenceScore}`);
      
      return {
        isAI: result.isAI,
        confidenceScore: result.confidenceScore,
        modelDetails: {
          huggingface: {
            enabled: !!result.modelDetails.huggingface,
            genuine: result.modelDetails.huggingface?.genuine || null,
            spoof: result.modelDetails.huggingface?.spoof || null
          },
          voiceguard: {
            enabled: !!result.modelDetails.voiceguard,
            genuine: result.modelDetails.voiceguard?.genuine || null,
            spoof: result.modelDetails.voiceguard?.spoof || null
          },
          ensemble: result.modelDetails.ensemble || ensemble
        },
        message: result.message
      };
    } catch (error) {
      console.error('Failed to analyze call:', error);
      // Return a fallback result instead of throwing
      return {
        isAI: false,
        confidenceScore: 0,
        modelDetails: {
          huggingface: {
            enabled: false,
            genuine: null,
            spoof: null
          },
          voiceguard: {
            enabled: false,
            genuine: null,
            spoof: null
          },
          ensemble: {
            genuine: 1,
            spoof: 0
          }
        },
        message: 'Analysis failed. Please try again.'
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const analyzeCall = useCallback(async (phoneNumber: string) => {
    setIsAnalyzing(true);
    try {
      // In a real app, this would analyze actual voice data
      // For demo, we'll simulate analysis with random results
      const isAIDetected = Math.random() > 0.7;
      const confidence = 0.85 + (Math.random() * 0.15);
      
      // Get contact name safely
      let callerName = null;
      try {
        callerName = await getContactName(phoneNumber);
      } catch (contactError) {
        console.error('Error getting contact name:', contactError);
        // Continue with null caller name
      }
      
      // Create a new call record
      const record: Omit<CallRecord, 'id'> = {
        phoneNumber,
        callerName,
        timestamp: Date.now(),
        duration: 0,
        isAIDetected,
        isAI: isAIDetected, // Added for new UI
        confidenceScore: confidence,
        isBlocked: false,
      };
      
      try {
        await addCallRecord(record);
      } catch (recordError) {
        console.error('Error adding call record:', recordError);
        // Continue without adding to history
      }
      
      return {
        isAIDetected,
        confidence,
      };
    } catch (error) {
      console.error('Error analyzing call:', error);
      // Return a fallback result instead of throwing
      return {
        isAIDetected: false,
        confidence: 0,
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, [addCallRecord]);

  // Context value
  const contextValue: CallDetectionContextType = {
    callHistory,
    currentCall,
    isAnalyzing,
    addCallRecord,
    updateCallRecord,
    deleteCallRecord,
    clearCallHistory,
    analyzeIncomingCall,
    analyzeCall,
  };

  return (
    <CallDetectionContext.Provider value={contextValue}>
      {children}
    </CallDetectionContext.Provider>
  );
};

// Custom hook to use the context
export const useCallDetection = (): CallDetectionContextType => {
  const context = useContext(CallDetectionContext);
  if (!context) {
    // Instead of throwing an error, return a safe fallback
    console.warn('useCallDetection must be used within a CallDetectionProvider');
    return {
      callHistory: [],
      currentCall: null,
      isAnalyzing: false,
      addCallRecord: async () => { 
        console.warn('CallDetection not available');
        return ''; // Return empty string to match Promise<string> return type
      },
      updateCallRecord: async () => { console.warn('CallDetection not available'); },
      deleteCallRecord: async () => { console.warn('CallDetection not available'); },
      clearCallHistory: async () => { console.warn('CallDetection not available'); },
      analyzeIncomingCall: async () => { 
        console.warn('CallDetection not available');
        // Return object matching the expected return type
        return {
          isAI: false,
          confidenceScore: 0,
          modelDetails: {
            huggingface: { enabled: false, genuine: null, spoof: null },
            voiceguard: { enabled: false, genuine: null, spoof: null },
            ensemble: { genuine: 0, spoof: 0 }
          },
          message: 'CallDetection not available'
        };
      },
      analyzeCall: async () => { 
        console.warn('CallDetection not available');
        // Return object matching the expected return type
        return {
          isAIDetected: false,
          confidence: 0,
        };
      },
    };
  }
  return context;
};
