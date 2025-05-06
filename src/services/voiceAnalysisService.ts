/**
 * Voice Analysis Service
 * Uses the VoiceGuard API to detect synthetic/AI-generated voices
 */

import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

// Types
export interface VoiceAnalysisResult {
  genuine_score: number;
  spoof_score: number;
  result: string;
}

// API configuration
const API_CONFIG = {
  baseUrl: 'https://api.voiceguard.ai/api/predict',
  timeout: 30000, // 30 seconds
  retries: 2,
  retryDelay: 1000, // 1 second
};

/**
 * Analyze a voice recording to determine if it's AI-generated
 * @param audioPath Path to the audio file to analyze
 */
export const analyzeVoice = async (audioPath: string): Promise<VoiceAnalysisResult> => {
  try {
    // Check if file exists and has minimum size
    try {
      const fileStats = await RNFS.stat(audioPath);
      if (fileStats.size < 1000) {
        throw new Error('Recording file is too small. Please try again.');
      }
      console.log('Recording Path:', audioPath);
    } catch (error) {
      throw new Error('Recording failed. Please ensure microphone access is enabled.');
    }

    // Create form data with audio file
    const formData = new FormData();
    formData.append('file', {
      uri: Platform.OS === 'android' ? `file://${audioPath}` : audioPath,
      type: 'audio/m4a',
      name: 'recording.m4a'
    } as any);

    // Implement retry logic
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= API_CONFIG.retries; attempt++) {
      try {
        // If this is a retry, wait before trying again
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt}/${API_CONFIG.retries}...`);
          await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * attempt));
        }

        // Send to API
        console.log('Sending request to:', API_CONFIG.baseUrl);
        const response = await fetch(API_CONFIG.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          },
          body: formData,
        });

        if (response.status === 503) {
          throw new Error('Analysis temporarily unavailable. Please try again shortly.');
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log(' Raw API response:', JSON.stringify(data, null, 2));

        // Try to extract scores using the new format first
        if (data.combined_score) {
          return {
            genuine_score: data.combined_score.genuine_score,
            spoof_score: data.combined_score.spoof_score,
            result: data.combined_score.result
          };
        }
        
        // Fallback to direct score format if available
        if (typeof data.genuine_score === 'number' && typeof data.spoof_score === 'number') {
          return {
            genuine_score: data.genuine_score,
            spoof_score: data.spoof_score,
            result: data.result || (data.genuine_score > data.spoof_score ? "Human" : "AI")
          };
        }

        console.error('Unexpected response format:', data);
        throw new Error(' Unexpected analysis response format');

      } catch (error: any) {
        console.error('API call failed:', error);
        lastError = error;

        // If this was our last retry, throw the error
        if (attempt === API_CONFIG.retries) {
          throw lastError;
        }
        // Otherwise, continue to next retry
        continue;
      }
    }

    // This should never be reached due to the retry logic above
    throw new Error('Unexpected error in analysis');
  } catch (error: any) {
    console.error('Voice analysis error:', error);
    throw error;
  }
};
