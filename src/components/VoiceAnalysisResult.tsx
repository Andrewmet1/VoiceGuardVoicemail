import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { feedbackService } from '../services/feedbackService';

interface Props {
  isAI: boolean;
  confidence: number;
  audioId: string;
  features?: Float32Array;
}

export const VoiceAnalysisResult: React.FC<Props> = ({ 
  isAI, 
  confidence, 
  audioId,
  features 
}) => {
  const submitFeedback = async (userFeedback: boolean) => {
    await feedbackService.submitUserFeedback(
      audioId,
      isAI,
      userFeedback,
      confidence,
      features
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.result}>
        Voice detected as: {isAI ? 'AI-generated' : 'Human'}
      </Text>
      <Text style={styles.confidence}>
        Confidence: {(confidence * 100).toFixed(1)}%
      </Text>
      
      <View style={styles.feedbackContainer}>
        <Text style={styles.feedbackTitle}>Was this correct?</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.correctButton]}
            onPress={() => submitFeedback(isAI)}
          >
            <Text style={styles.buttonText}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.incorrectButton]}
            onPress={() => submitFeedback(!isAI)}
          >
            <Text style={styles.buttonText}>No</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  result: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  confidence: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  feedbackContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  feedbackTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  correctButton: {
    backgroundColor: '#4CAF50',
  },
  incorrectButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
