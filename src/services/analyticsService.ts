import axios from 'axios';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

interface DetectionMetrics {
  modelVersion: string;
  timestamp: number;
  deviceType: string;
  osVersion: string;
  appVersion: string;
  modelPrediction: boolean;
  userFeedback: boolean;
  confidence: number;
  processingTime: number;
  audioFeatureHash: string;  // Hashed features for tracking patterns without raw data
}

interface AggregatedStats {
  totalDetections: number;
  accuracyRate: number;
  falsePositives: number;
  falseNegatives: number;
  averageConfidence: number;
  detectionsByDay: Record<string, number>;
  modelVersionStats: Record<string, {
    accuracy: number;
    totalSamples: number;
  }>;
}

class AnalyticsService {
  private readonly API_ENDPOINT = 'https://api.voiceguard.com/analytics';
  private metricsQueue: DetectionMetrics[] = [];
  
  async submitMetrics(metrics: DetectionMetrics) {
    try {
      // Add device info
      const enrichedMetrics = {
        ...metrics,
        deviceType: Platform.OS,
        osVersion: Platform.Version,
        appVersion: await DeviceInfo.getVersion(),
      };

      // Queue metrics for batch sending
      this.metricsQueue.push(enrichedMetrics);

      // Send batch if queue is large enough
      if (this.metricsQueue.length >= 50) {
        await this.sendBatch();
      }
    } catch (error) {
      console.error('Error submitting metrics:', error);
    }
  }

  private async sendBatch() {
    if (this.metricsQueue.length === 0) return;

    try {
      await axios.post(`${this.API_ENDPOINT}/batch`, {
        metrics: this.metricsQueue,
        timestamp: Date.now(),
      });

      // Clear queue after successful send
      this.metricsQueue = [];
    } catch (error) {
      console.error('Error sending metrics batch:', error);
    }
  }

  // Force send remaining metrics, used when app goes to background
  async flushMetrics() {
    await this.sendBatch();
  }
}

export const analyticsService = new AnalyticsService();
