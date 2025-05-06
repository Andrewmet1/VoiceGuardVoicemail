import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCallDetection } from '../contexts/CallDetectionContext';

type CallAlertScreenRouteProp = RouteProp<RootStackParamList, 'CallAlert'>;
type CallAlertScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CallAlert'>;

const CallAlertScreen: React.FC = () => {
  const route = useRoute<CallAlertScreenRouteProp>();
  const navigation = useNavigation<CallAlertScreenNavigationProp>();
  const { analyzeCall } = useCallDetection();
  const [analyzing, setAnalyzing] = useState(true);
  const [result, setResult] = useState<{ isAI: boolean; confidence: number } | null>(null);
  
  // Animation values
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Simulate call analysis
    const analyzeIncomingCall = async () => {
      try {
        const analysisResult = await analyzeCall(route.params.callerId);
        setResult({
          isAI: analysisResult.isAIDetected,
          confidence: analysisResult.confidence || 0.95,
        });
      } catch (error) {
        console.error('Error analyzing call:', error);
        setResult({ isAI: false, confidence: 0 });
      } finally {
        setAnalyzing(false);
      }
    };

    analyzeIncomingCall();
  }, [route.params.callerId, analyzeCall]);

  const handleClose = () => {
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      {analyzing ? (
        <View style={styles.analyzingContainer}>
          <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]}>
            <Icon name="phone-ring" size={48} color="#4F46E5" />
          </Animated.View>
          <Text style={styles.analyzingText}>Analyzing call from</Text>
          <Text style={styles.phoneNumber}>{route.params.callerId}</Text>
          <Text style={styles.waitText}>Please wait...</Text>
        </View>
      ) : (
        <View style={styles.resultContainer}>
          <Icon 
            name={result?.isAI ? "robot" : "account-check"} 
            size={64} 
            color={result?.isAI ? "#DC2626" : "#10B981"} 
          />
          <Text style={[styles.resultText, { color: result?.isAI ? "#DC2626" : "#10B981" }]}>
            {result?.isAI ? "AI Voice Detected!" : "Human Caller"}
          </Text>
          <Text style={styles.confidenceText}>
            Confidence: {Math.round((result?.confidence || 0) * 100)}%
          </Text>
          <Text style={styles.phoneNumber}>{route.params.callerId}</Text>
          
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: result?.isAI ? "#DC2626" : "#10B981" }]}
              onPress={handleClose}
            >
              <Text style={styles.actionButtonText}>
                {result?.isAI ? "Block Call" : "Accept Call"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingContainer: {
    alignItems: 'center',
  },
  pulseCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  analyzingText: {
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 8,
  },
  phoneNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 16,
  },
  waitText: {
    fontSize: 16,
    color: '#6B7280',
  },
  resultContainer: {
    alignItems: 'center',
    padding: 24,
  },
  resultText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  actionContainer: {
    marginTop: 32,
    width: '100%',
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CallAlertScreen;
