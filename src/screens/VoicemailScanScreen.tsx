import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import CustomIcon from '../components/CustomIcon';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
import { analyzeVoice } from '../services/voiceAnalysisService';
import { checkForSharedVoicemail } from '../services/voicemailShareService';

type VoicemailScanScreenRouteProp = RouteProp<RootStackParamList, 'VoicemailScan'>;
type VoicemailScanScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VoicemailScan'>;

// Analysis states
enum AnalysisState {
  READY = 'ready',
  ANALYZING = 'analyzing',
  COMPLETE = 'complete',
}

const VoicemailScanScreen: React.FC = () => {
  const navigation = useNavigation<VoicemailScanScreenNavigationProp>();
  const route = useRoute<VoicemailScanScreenRouteProp>();

  // State
  const [analysisState, setAnalysisState] = useState<AnalysisState>(AnalysisState.READY);
  const [selectedFile, setSelectedFile] = useState<DocumentPickerResponse | null>(null);
  const [sharedFilePath, setSharedFilePath] = useState<string | null>(null);
  
  // Check for shared voicemail when the screen loads
  useEffect(() => {
    const checkForShared = async () => {
      try {
        const path = await checkForSharedVoicemail();
        if (path) {
          console.log('Found shared voicemail:', path);
          setSharedFilePath(path);
          // Auto-analyze the shared voicemail
          handleAnalyzeShared(path);
        }
      } catch (error) {
        console.error('Error checking for shared voicemail:', error);
      }
    };
    
    checkForShared();
  }, []);

  // Handle file upload
  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.audio],
        copyTo: 'documentDirectory',
      });
      
      console.log('Selected file:', result);
      setSelectedFile(result);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker
        console.log('User cancelled file picker');
      } else {
        console.error('Error picking document:', err);
        Alert.alert('Error', 'Failed to select voicemail file. Please try again.');
      }
    }
  };

  // Handle analysis of manually selected file
  const handleAnalyze = async () => {
    if (!selectedFile) {
      Alert.alert('No File Selected', 'Please upload a voicemail file first.');
      return;
    }

    try {
      setAnalysisState(AnalysisState.ANALYZING);
      
      // Use the existing voice analysis service to analyze the voicemail
      const filePath = selectedFile.fileCopyUri || selectedFile.uri;
      if (!filePath) {
        throw new Error('Invalid file path');
      }
      
      console.log('Analyzing file:', filePath);
      const result = await analyzeVoice(filePath);
      
      setAnalysisState(AnalysisState.COMPLETE);
      
      // Navigate to results screen with the analysis result
      navigation.navigate('VoicemailResult', { result });
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisState(AnalysisState.READY);
      Alert.alert('Analysis Failed', error instanceof Error ? error.message : 'Failed to analyze voicemail. Please try again.');
    }
  };
  
  // Handle analysis of shared voicemail
  const handleAnalyzeShared = async (path: string) => {
    try {
      setAnalysisState(AnalysisState.ANALYZING);
      
      console.log('Analyzing shared voicemail:', path);
      const result = await analyzeVoice(path);
      
      setAnalysisState(AnalysisState.COMPLETE);
      
      // Navigate to results screen with the analysis result
      navigation.navigate('VoicemailResult', { result });
    } catch (error) {
      console.error('Analysis error for shared voicemail:', error);
      setAnalysisState(AnalysisState.READY);
      Alert.alert('Analysis Failed', error instanceof Error ? error.message : 'Failed to analyze shared voicemail. Please try again.');
    }
  };

  // Navigate to help screen with device type
  const navigateToHelp = () => {
    Alert.alert(
      'Select Your Device',
      'Which type of device are you using?',
      [
        {
          text: 'iPhone',
          onPress: () => navigation.navigate('VoicemailHelp', { deviceType: 'ios' })
        },
        {
          text: 'Android',
          onPress: () => navigation.navigate('VoicemailHelp', { deviceType: 'android' })
        }
      ]
    );
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
        <Text style={styles.title}>VoiceGuard Voicemail</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        {analysisState === AnalysisState.ANALYZING && sharedFilePath ? (
          <View style={styles.analyzingContainer}>
            <Text style={styles.instructionTitle}>Analyzing Shared Voicemail</Text>
            <ActivityIndicator size="large" color="#1E3A8A" style={styles.loadingIndicator} />
            <Text style={styles.instructionText}>Please wait while we analyze your shared voicemail...</Text>
          </View>
        ) : (
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionTitle}>
              Scan Your Voicemail
            </Text>
            <Text style={styles.instructionText}>
              You can scan any voicemail to detect if it's AI-generated or a real human.
            </Text>
            <Text style={styles.instructionText}>
              Follow these steps to scan a voicemail:
            </Text>
            <View style={styles.stepContainer}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>In the Phone app, open your voicemail</Text>
            </View>
            <View style={styles.stepContainer}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>Tap the share icon on the voicemail</Text>
            </View>
            <View style={styles.stepContainer}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>Select "Save to Files" and choose a location</Text>
            </View>
            <View style={styles.stepContainer}>
              <Text style={styles.stepNumber}>4</Text>
              <Text style={styles.stepText}>Tap "Upload Voicemail" below and select the saved file</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleFileUpload}
          activeOpacity={0.8}
        >
          <View style={styles.uploadButtonContent}>
            <CustomIcon 
              name="upload" 
              size={40} 
              color="#FFFFFF" 
              style={styles.uploadButtonIcon}
            />
            <Text style={styles.uploadButtonText}>
              Upload Voicemail File
            </Text>
          </View>
          {selectedFile && (
            <Text style={styles.selectedFileText}>
              Selected: {selectedFile.name}
              {selectedFile.size && ` (${(selectedFile.size / 1024).toFixed(1)} KB)`}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.analyzeButton,
            (!selectedFile || analysisState === AnalysisState.ANALYZING) && styles.analyzeButtonDisabled
          ]}
          onPress={handleAnalyze}
          disabled={!selectedFile || analysisState === AnalysisState.ANALYZING}
        >
          {analysisState === AnalysisState.ANALYZING ? (
            <View style={styles.analyzeButtonContent}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.analyzeButtonText}>Analyzing...</Text>
            </View>
          ) : (
            <Text style={styles.analyzeButtonText}>
              Analyze
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.helpButton}
          onPress={navigateToHelp}
        >
          <Text style={styles.helpButtonText}>
            Need help?
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  analyzingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E3A8A',
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: 'bold',
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
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
  analyzeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  instructionContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
    maxWidth: 320,
  },
  uploadButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  uploadButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonIcon: {
    marginBottom: 12,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedFileText: {
    color: '#FFFFFF',
    fontSize: 13,
    opacity: 0.9,
    marginTop: 8,
  },
  analyzeButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    marginBottom: 20,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helpButton: {
    padding: 12,
  },
  helpButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default VoicemailScanScreen;
