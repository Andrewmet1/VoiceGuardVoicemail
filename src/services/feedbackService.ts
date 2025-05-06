import AsyncStorage from '@react-native-async-storage/async-storage';
import * as tf from '@tensorflow/tfjs';

interface VoiceFeedback {
  audioId: string;
  modelPrediction: boolean;  // true = AI, false = human
  userFeedback: boolean;     // true = AI, false = human
  confidence: number;
  timestamp: number;
  features?: Float32Array;
}

const FEEDBACK_STORAGE_KEY = 'voiceguard_feedback';
const FEEDBACK_BATCH_SIZE = 50; // Number of samples before triggering model update

class FeedbackService {
  private feedbackQueue: VoiceFeedback[] = [];
  private baseModel: tf.LayersModel | null = null;
  
  constructor() {
    this.loadStoredFeedback();
  }

  async loadStoredFeedback() {
    try {
      const stored = await AsyncStorage.getItem(FEEDBACK_STORAGE_KEY);
      if (stored) {
        this.feedbackQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading stored feedback:', error);
    }
  }

  async saveFeedback(feedback: VoiceFeedback) {
    try {
      this.feedbackQueue.push(feedback);
      await AsyncStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(this.feedbackQueue));

      // Check if we have enough samples for model update
      if (this.feedbackQueue.length >= FEEDBACK_BATCH_SIZE) {
        await this.updateModel();
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  }

  async submitUserFeedback(
    audioId: string,
    modelPrediction: boolean,
    userFeedback: boolean,
    confidence: number,
    features?: Float32Array
  ) {
    const feedback: VoiceFeedback = {
      audioId,
      modelPrediction,
      userFeedback,
      confidence,
      features,
      timestamp: Date.now()
    };

    await this.saveFeedback(feedback);
  }

  private async updateModel() {
    // Only update if we have disagreements between model and user
    const disagreements = this.feedbackQueue.filter(
      f => f.modelPrediction !== f.userFeedback
    );

    if (disagreements.length > 10) { // Minimum threshold for updating
      try {
        // Create training data from feedback
        const features = disagreements.map(f => f.features);
        const labels = disagreements.map(f => f.userFeedback);

        // Fine-tune model with new data
        if (this.baseModel && features.length > 0) {
          const xs = tf.tensor(features);
          const ys = tf.tensor(labels);

          await this.baseModel.fitDataset(
            tf.data.zip({xs, ys}).batch(32),
            {
              epochs: 5,
              callbacks: {
                onEpochEnd: (epoch, logs) => {
                  console.log(`Fine-tuning epoch ${epoch + 1}, loss: ${logs?.loss}`);
                }
              }
            }
          );

          // Save updated model
          await this.baseModel.save('indexeddb://voiceguard_model');
          
          // Clear processed feedback
          this.feedbackQueue = this.feedbackQueue.slice(FEEDBACK_BATCH_SIZE);
          await AsyncStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(this.feedbackQueue));
        }
      } catch (error) {
        console.error('Error updating model:', error);
      }
    }
  }

  // Get feedback statistics
  async getFeedbackStats() {
    const total = this.feedbackQueue.length;
    const correct = this.feedbackQueue.filter(f => f.modelPrediction === f.userFeedback).length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;

    return {
      total,
      correct,
      accuracy,
      recentFeedback: this.feedbackQueue.slice(-5) // Last 5 feedback items
    };
  }
}

export const feedbackService = new FeedbackService();
