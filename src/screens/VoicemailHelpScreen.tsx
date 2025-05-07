import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import CustomIcon from '../components/CustomIcon';

type VoicemailHelpScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VoicemailHelp'>;
type VoicemailHelpScreenRouteProp = RouteProp<RootStackParamList, 'VoicemailHelp'>;

// Helper function to get device type
const getDeviceType = (routeDeviceType?: 'ios' | 'android'): 'ios' | 'android' => {
  // Use route param if provided, otherwise use platform
  if (routeDeviceType) return routeDeviceType;
  return Platform.OS as 'ios' | 'android';
};

const VoicemailHelpScreen: React.FC = () => {
  const navigation = useNavigation<VoicemailHelpScreenNavigationProp>();
  const route = useRoute<VoicemailHelpScreenRouteProp>();
  const deviceType = getDeviceType(route.params?.deviceType);

  // Device-specific instructions
  const deviceInstructions = {
    ios: {
      stepOne: {
        title: 'Open your Phone app',
        description: 'Navigate to the Voicemail tab in your iPhone Phone app.',
      },
      stepTwo: {
        title: 'Select a voicemail',
        description: 'Tap on the voicemail you want to analyze.',
      },
      stepThree: {
        title: 'Tap the Share button',
        description: 'Look for the share icon (square with an arrow pointing up) and tap it to open sharing options.',
      },
      stepFour: {
        title: 'Save to Files',
        description: 'Select "Save to Files" and choose a location like iCloud Drive or On My iPhone.',
      },
    },
    android: {
      stepOne: {
        title: 'Open your Phone app',
        description: 'Navigate to the Voicemail section in your Android Phone app.',
      },
      stepTwo: {
        title: 'Select a voicemail',
        description: 'Tap on the voicemail you want to analyze.',
      },
      stepThree: {
        title: 'Tap the Menu button',
        description: 'Look for the three dots menu icon and tap it to see options.',
      },
      stepFour: {
        title: 'Share or Save',
        description: 'Select "Share" or "Save" option and choose to save it to your device storage.',
      },
    },
  };

  // Get the instructions for the current device
  const instructions = deviceInstructions[deviceType];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <CustomIcon name="arrow-left" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.title}>Voicemail Help</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Import a Voicemail on {deviceType === 'ios' ? 'iPhone' : 'Android'}</Text>
          <View style={styles.step}>
            <View style={styles.stepNumberContainer}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{instructions.stepOne.title}</Text>
              <Text style={styles.stepDescription}>
                {instructions.stepOne.description}
              </Text>
              {deviceType === 'ios' && (
                <View style={styles.deviceImageContainer}>
                  <CustomIcon name="apple" size={20} color="#333" />
                  <Text style={styles.deviceImageCaption}>iPhone Phone App</Text>
                </View>
              )}
              {deviceType === 'android' && (
                <View style={styles.deviceImageContainer}>
                  <CustomIcon name="android" size={20} color="#333" />
                  <Text style={styles.deviceImageCaption}>Android Phone App</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumberContainer}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{instructions.stepTwo.title}</Text>
              <Text style={styles.stepDescription}>
                {instructions.stepTwo.description}
              </Text>
              {deviceType === 'ios' && (
                <View style={styles.deviceImageContainer}>
                  <CustomIcon name="voicemail" size={20} color="#333" />
                  <Text style={styles.deviceImageCaption}>Select Voicemail in iPhone</Text>
                </View>
              )}
              {deviceType === 'android' && (
                <View style={styles.deviceImageContainer}>
                  <CustomIcon name="voicemail" size={20} color="#333" />
                  <Text style={styles.deviceImageCaption}>Select Voicemail in Android</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumberContainer}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{instructions.stepThree.title}</Text>
              <Text style={styles.stepDescription}>
                {instructions.stepThree.description}
              </Text>
              {deviceType === 'ios' && (
                <View style={styles.deviceImageContainer}>
                  <CustomIcon name="share" size={20} color="#333" />
                  <Text style={styles.deviceImageCaption}>Share Button on iPhone</Text>
                </View>
              )}
              {deviceType === 'android' && (
                <View style={styles.deviceImageContainer}>
                  <CustomIcon name="dots-vertical" size={20} color="#333" />
                  <Text style={styles.deviceImageCaption}>Menu Button on Android</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumberContainer}>
              <Text style={styles.stepNumber}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{instructions.stepFour.title}</Text>
              <Text style={styles.stepDescription}>
                {instructions.stepFour.description}
              </Text>
              {deviceType === 'ios' && (
                <View style={styles.deviceImageContainer}>
                  <CustomIcon name="folder" size={20} color="#333" />
                  <Text style={styles.deviceImageCaption}>Save to Files on iPhone</Text>
                </View>
              )}
              {deviceType === 'android' && (
                <View style={styles.deviceImageContainer}>
                  <CustomIcon name="folder" size={20} color="#333" />
                  <Text style={styles.deviceImageCaption}>Save on Android</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Using the Upload Button</Text>
          <Text style={styles.sectionDescription}>
            After saving your voicemail to Files, follow these steps:
          </Text>
          <View style={styles.bulletPoint}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>
              Open VoiceGuard and go to the "Scan Voicemail" screen
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>
              Tap the "Upload Voicemail File" button at the bottom of the screen
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>
              Navigate to where you saved the voicemail file and select it
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>
              Wait for the analysis to complete
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Understanding Results</Text>
          <Text style={styles.sectionDescription}>
            After analysis, you'll see one of two results:
          </Text>
          <View style={styles.resultExample}>
            <View style={styles.resultCard}>
              <Text style={[styles.resultTitle, styles.humanText]}>
                ✅ Human Voice Detected
              </Text>
              <Text style={styles.resultDescription}>
                The voicemail appears to be from a real person.
              </Text>
            </View>
          </View>
          <View style={styles.resultExample}>
            <View style={[styles.resultCard, styles.aiResultCard]}>
              <Text style={[styles.resultTitle, styles.aiText]}>
                ❌ AI Voice Detected
              </Text>
              <Text style={styles.resultDescription}>
                The voicemail was likely generated by AI. Be cautious about any requests or information in this message.
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.doneButtonText}>Got it</Text>
        </TouchableOpacity>
      </ScrollView>
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
  deviceImageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  deviceImageCaption: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  stepNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  placeholderText: {
    color: '#6B7280',
    fontSize: 14,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E3A8A',
    marginRight: 12,
  },
  bulletText: {
    fontSize: 16,
    color: '#4B5563',
  },
  resultExample: {
    marginBottom: 16,
  },
  resultCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  aiResultCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  humanText: {
    color: '#16A34A',
  },
  aiText: {
    color: '#DC2626',
  },
  resultDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  doneButton: {
    backgroundColor: '#1E3A8A',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VoicemailHelpScreen;
