import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import CustomIcon from '../components/CustomIcon';
import { openSettings } from 'react-native-permissions';
import RNFS from 'react-native-fs';
import { analyzeVoice } from '../services/voiceAnalysisService';
import { useCallDetection } from '../contexts/CallDetectionContext';
import audioRecorder, { RecordingState } from '../utils/audioRecorder';

type CallScanScreenRouteProp = RouteProp<RootStackParamList, 'CallScan'>;
type CallScanScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CallScan'>;

// Analysis states
enum AnalysisState {
  READY = 'ready',
  RECORDING = 'recording',
  ANALYZING = 'analyzing',
  COMPLETE = 'complete',
}

const CallScanScreen: React.FC = () => {
  const navigation = useNavigation<CallScanScreenNavigationProp>();
  const route = useRoute<CallScanScreenRouteProp>();
  const { phoneNumber: routePhoneNumber } = route.params || {};

  // State
  const [phoneNumber, setPhoneNumber] = useState<string>(routePhoneNumber || '');
  const [analysisState, setAnalysisState] = useState<AnalysisState>(AnalysisState.READY);
  const [recordingTime, setRecordingTime] = useState<string>('00:00');
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Refs
  const audioFilePath = useRef<string>('');
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTime = useRef<number>(0);

  // Context
  const { addCallRecord } = useCallDetection();

  // Check permission on mount
  useEffect(() => {
    const checkMicPermission = async () => {
      const granted = await audioRecorder.requestPermission();
      setPermissionGranted(granted);
    };

    checkMicPermission();

    // Cleanup on unmount
    return () => {
      if (analysisState === AnalysisState.RECORDING) {
        audioRecorder.reset();
      }
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [analysisState]);

  // Format milliseconds to MM:SS
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Start recording
  const startRecording = async () => {
    if (!permissionGranted) {
      Alert.alert(
        'Microphone Permission Required',
        'VoiceGuard needs microphone access to analyze voice patterns.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => openSettings() }
        ]
      );
      return;
    }

    try {
      setAnalysisState(AnalysisState.RECORDING);
      setIsRecording(true);

      // Start recording with progress tracking
      const success = await audioRecorder.startRecording({
        onRecordingProgress: (time) => {
          setRecordingTime(formatTime(time));
        },
        onRecordingError: (error) => {
          console.error('Recording error:', error);
          Alert.alert('Recording Error', error.message);
          setAnalysisState(AnalysisState.READY);
          setIsRecording(false);
        }
      });

      if (!success) {
        throw new Error('Failed to start recording');
      }

      // Store the path for later use
      audioFilePath.current = audioRecorder.getRecordingFilePath();
      recordingStartTime.current = Date.now();

      console.log('Recording started successfully');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
      setAnalysisState(AnalysisState.READY);
      setIsRecording(false);
    }
  };

  // Stop recording and analyze
  const stopRecordingAndAnalyze = async () => {
    try {
      // Stop recording
      const filePath = await audioRecorder.stopRecording();

      if (!filePath) {
        throw new Error('No recording file path returned');
      }

      audioFilePath.current = filePath;

      // Update state
      setAnalysisState(AnalysisState.ANALYZING);
      setIsRecording(false);

      // Check if file exists
      const fileExists = await RNFS.exists(audioFilePath.current);
      if (!fileExists) {
        throw new Error('Recording file not found');
      }

      // Analyze voice
      const analyzeRecording = async (audioPath: string) => {
        try {
          console.log('Starting analysis for:', audioPath);
          setIsAnalyzing(true);
          const result = await analyzeVoice(audioPath);
          console.log('✅ Voice analysis result:', JSON.stringify(result, null, 2));

          setResult(result);
          setAnalysisState(AnalysisState.COMPLETE);

          // Calculate recording duration in seconds from recordingTime string (MM:SS format)
          const [minutes, seconds] = recordingTime.split(':').map(Number);
          const durationSeconds = minutes * 60 + seconds;

          addCallRecord({
            phoneNumber: phoneNumber || '',
            timestamp: Date.now(),
            duration: durationSeconds,
            audioSamplePath: audioPath,
            isAIDetected: result.result === "AI",
            isAI: result.result === "AI",
            confidenceScore: Math.max(result.genuine_score, result.spoof_score),
            callerName: null,
            isBlocked: false
          });

          console.log('Analysis complete:', result);
        } catch (error: any) {
          console.error('Analysis failed:', error);
          const fallbackMessage = typeof error === 'string'
            ? error
            : error?.message || JSON.stringify(error) || 'Unknown error';
          Alert.alert('Analysis Error', fallbackMessage);
        } finally {
          setIsAnalyzing(false);
        }
      };
      await analyzeRecording(audioFilePath.current);

      console.log('Analysis complete:', analysisResult);
    } catch (error) {
      console.error('Analysis failed:', error);
      Alert.alert('Analysis Error', 'Failed to analyze the recording. Please try again.');
      setAnalysisState(AnalysisState.READY);
      setIsRecording(false);
    }
  };

  // Play recording
  const playRecording = async () => {
    try {
      await audioRecorder.playRecording();
    } catch (error) {
      console.error('Failed to play recording:', error);
      Alert.alert('Playback Error', 'Failed to play the recording.');
    }
  };

  // Reset and scan again
  const resetAndScanAgain = () => {
    setAnalysisState(AnalysisState.READY);
    setAnalysisResult(null);
    setRecordingTime('00:00');
    setIsRecording(false);
    setResult(null);
  };

  // Render ready state with tap to scan button
  const renderReadyState = () => {
    return (
      <TouchableOpacity
        style={styles.scanButton}
        onPress={startRecording}
        activeOpacity={0.8}
      >
        <CustomIcon 
          name="microphone" 
          size={40} 
          color="#FFFFFF" 
          style={styles.scanButtonIcon}
        />
        <Text style={styles.scanButtonText}>
          Tap to Record Voice Sample
        </Text>
        <Text style={styles.scanSubText}>
          Record a small snippet (1-2 sec)
        </Text>
      </TouchableOpacity>
    );
  };

  // Render recording state
  const renderRecordingState = () => {
    return (
      <View style={styles.recordingContainer}>
        <View style={styles.recordingIndicator}>
          <CustomIcon name="record-circle" size={24} color="#DC2626" />
          <Text style={styles.recordingText}>Recording</Text>
        </View>

        <Text style={styles.recordingTime}>{recordingTime}s</Text>

        <Text style={styles.recordingInstructions}>
          Record a brief sample of the caller's voice (1-2 seconds)
        </Text>

        <TouchableOpacity
          style={styles.stopButton}
          onPress={stopRecordingAndAnalyze}
        >
          <Text style={styles.stopButtonText}>Stop & Analyze</Text>
          <CustomIcon name="stop-circle" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  };

  // Render analyzing state
  const renderAnalyzingState = () => {
    return (
      <View style={styles.recordingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={[styles.recordingInstructions, { marginTop: 20 }]}>
          Analyzing voice patterns...
        </Text>
      </View>
    );
  };

  // Render analysis results with improved UI
  const renderAnalysisResults = () => {
    if (!result) return null;

    const isAI = result.result === "AI";
    const confidenceScore = Math.max(result.genuine_score, result.spoof_score);

    return (
      <View style={[
        styles.resultCard,
        isAI ? styles.aiCard : styles.humanCard
      ]}>
        <Text style={[
          styles.resultTitle,
          isAI ? styles.aiText : styles.humanText
        ]}>
          {isAI ? '❌ AI Voice Detected' : '✅ Human Voice Detected'}
        </Text>
        <Text style={styles.confidenceText}>
          Confidence: {Math.round(confidenceScore * 100)}%
        </Text>
        <View style={styles.actionsContainer}>
          {isAI && (
            <TouchableOpacity
              style={[styles.actionButton, styles.hangupButton]}
              onPress={handleHangup}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>Hang Up</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.closeButton]}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleClose = () => {
    resetAndScanAgain();
    navigation.goBack();
  };

  const handleHangup = () => {
    // TODO: Implement hangup functionality
    handleClose();
  };

  // Render content based on state
  const renderContent = () => {
    switch (analysisState) {
      case AnalysisState.READY:
        return renderReadyState();
      case AnalysisState.RECORDING:
        return renderRecordingState();
      case AnalysisState.ANALYZING:
        return renderAnalyzingState();
      case AnalysisState.COMPLETE:
        return renderAnalysisResults();
      default:
        return renderReadyState();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <CustomIcon name="arrow-left" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.title}>Voice Scanner</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        {!isRecording && !isAnalyzing && !result && (
          renderReadyState()
        )}

        {isRecording && (
          renderRecordingState()
        )}

        {isAnalyzing && (
          renderAnalyzingState()
        )}

        {result && (
          renderAnalysisResults()
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  scanButton: {
    backgroundColor: '#1E3A8A',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanButtonIcon: {
    marginBottom: 12,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  scanSubText: {
    color: '#FFFFFF',
    fontSize: 13,
    opacity: 0.9,
  },
  recordingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
  },
  recordingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
  },
  recordingTime: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  recordingInstructions: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
    maxWidth: 280,
  },
  stopButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  resultCard: {
    width: '100%',
    maxWidth: 340,
    padding: 20,
    borderRadius: 15,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  humanCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A',
    borderWidth: 1,
  },
  aiCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
    borderWidth: 1,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  humanText: {
    color: '#16A34A',
  },
  aiText: {
    color: '#DC2626',
  },
  confidenceText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  hangupButton: {
    backgroundColor: '#DC2626',
  },
  closeButton: {
    backgroundColor: '#1E3A8A',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CallScanScreen;
