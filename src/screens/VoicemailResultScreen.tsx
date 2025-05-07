import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import CustomIcon from '../components/CustomIcon';
import { useCallDetection } from '../contexts/CallDetectionContext';

type VoicemailResultScreenRouteProp = RouteProp<RootStackParamList, 'VoicemailResult'>;
type VoicemailResultScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VoicemailResult'>;

const VoicemailResultScreen: React.FC = () => {
  const navigation = useNavigation<VoicemailResultScreenNavigationProp>();
  const route = useRoute<VoicemailResultScreenRouteProp>();
  const { result } = route.params || { result: { genuine_score: 0, spoof_score: 0, result: 'Unknown' } };
  const { addCallRecord } = useCallDetection();
  
  // Use a ref to track if we've already saved this scan to prevent duplicates
  const scanSavedRef = useRef(false);

  const isAI = result.result === "AI";
  const confidenceScore = Math.max(result.genuine_score, result.spoof_score);

  // Save scan result to call history only once when the screen first loads
  useEffect(() => {
    // Skip if we've already saved this scan
    if (scanSavedRef.current) {
      return;
    }
    
    // Store current values in variables to use in the async function
    // This prevents issues with stale closures
    const currentIsAI = isAI;
    const currentConfidenceScore = confidenceScore;
    const currentResult = result;
    
    const saveVoicemailScan = async () => {
      try {
        // Mark as saved before the async operation to prevent race conditions
        scanSavedRef.current = true;
        
        // Create a fixed timestamp for this scan
        const scanTimestamp = Date.now();
        
        await addCallRecord({
          phoneNumber: 'Voicemail Scan', // Since there's no phone number for voicemails
          callerName: 'Voicemail Analysis',
          timestamp: scanTimestamp,
          duration: 0, // Not applicable for voicemail
          isAIDetected: currentIsAI,
          isAI: currentIsAI,
          confidenceScore: currentConfidenceScore,
          isBlocked: false,
          modelDetails: {
            huggingface: {
              enabled: false,
              genuine: null,
              spoof: null
            },
            voiceguard: {
              enabled: true,
              genuine: currentResult.genuine_score,
              spoof: currentResult.spoof_score
            },
            ensemble: {
              genuine: currentResult.genuine_score,
              spoof: currentResult.spoof_score
            }
          },
          message: `Voicemail scan result: ${currentIsAI ? 'AI' : 'Human'} (${Math.round(currentConfidenceScore * 100)}% confidence)`
        });
        console.log('Voicemail scan saved to history');
      } catch (error) {
        // If there's an error, we might want to retry on next render
        scanSavedRef.current = false;
        console.error('Failed to save voicemail scan to history:', error);
      }
    };

    saveVoicemailScan();
    
    // Include addCallRecord in dependencies to satisfy ESLint
    // The ref ensures we only run this once regardless of dependency changes
  }, [addCallRecord, isAI, confidenceScore, result]);

  const handleClose = () => {
    navigation.navigate('Home');
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
        <Text style={styles.title}>Voicemail Scan Results</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
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

          <View style={styles.scoreContainer}>
            <View style={styles.scoreBar}>
              <View 
                style={[
                  styles.scoreBarFill, 
                  styles.humanScoreBarFill,
                  { width: `${result.genuine_score * 100}%` }
                ]} 
              />
              <Text style={styles.scoreBarLabel}>Human: {Math.round(result.genuine_score * 100)}%</Text>
            </View>
            
            <View style={styles.scoreBar}>
              <View 
                style={[
                  styles.scoreBarFill, 
                  styles.aiScoreBarFill,
                  { width: `${result.spoof_score * 100}%` }
                ]} 
              />
              <Text style={styles.scoreBarLabel}>AI: {Math.round(result.spoof_score * 100)}%</Text>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.closeButton]}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.explanationContainer}>
          <Text style={styles.explanationTitle}>What does this mean?</Text>
          {isAI ? (
            <Text style={styles.explanationText}>
              This voicemail was likely generated by an AI system. Be cautious about any requests or information contained in this message.
            </Text>
          ) : (
            <Text style={styles.explanationText}>
              This voicemail appears to be from a real human. However, always verify the identity of the caller through other means if they're requesting sensitive information.
            </Text>
          )}
        </View>
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
    padding: 20,
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
    marginBottom: 20,
  },
  scoreContainer: {
    width: '100%',
    marginBottom: 20,
  },
  scoreBar: {
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  scoreBarFill: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 12,
  },
  humanScoreBarFill: {
    backgroundColor: '#16A34A',
  },
  aiScoreBarFill: {
    backgroundColor: '#DC2626',
  },
  scoreBarLabel: {
    position: 'absolute',
    left: 12,
    top: 2,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
  closeButton: {
    backgroundColor: '#1E3A8A',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  explanationContainer: {
    width: '100%',
    maxWidth: 340,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default VoicemailResultScreen;
