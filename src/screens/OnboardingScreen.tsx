import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  FlatList, 
  Dimensions, 
  StyleSheet, 
  Platform,
  Alert,
  Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import CustomIcon from '../components/CustomIcon';
import { RootStackParamList } from '../../App';
import { useSettings } from '../contexts/SettingsContext';
import { requestPermission, checkPermission, PermissionType } from '../utils/permissionsHandler';

type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const { updateSettings } = useSettings();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [isTutorialMode, setIsTutorialMode] = useState(false);

  // Check if we're in tutorial mode (reopened from Help button)
  useEffect(() => {
    const checkTutorialMode = async () => {
      try {
        const settings = await AsyncStorage.getItem('voiceGuardSettings');
        if (settings) {
          const parsedSettings = JSON.parse(settings);
          setIsTutorialMode(parsedSettings.onboardingCompleted === true);
        }
      } catch (error) {
        console.error('Error checking tutorial mode:', error);
      }
    };
    
    checkTutorialMode();
  }, []);

  // Check microphone permission
  useEffect(() => {
    const checkMicPermission = async () => {
      const granted = await checkPermission(PermissionType.MICROPHONE);
      setMicPermissionGranted(granted);
    };
    
    checkMicPermission();
  }, []);

  // Request microphone permission
  const requestMicPermission = async () => {
    try {
      const granted = await requestPermission(PermissionType.MICROPHONE);
      setMicPermissionGranted(granted);
      
      if (!granted) {
        Alert.alert(
          'Microphone Permission Required',
          'VoiceGuard needs microphone access to analyze voice patterns. Please grant this permission in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Platform.OS === 'ios' ? Linking.openURL('app-settings:') : Linking.openSettings() }
          ]
        );
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return false;
    }
  };

  // Complete onboarding
  const completeOnboarding = () => {
    // Only update the onboardingCompleted flag if we're not in tutorial mode
    if (!isTutorialMode) {
      updateSettings({ onboardingCompleted: true });
    }
    navigation.replace('Home');
  };

  // Go to next slide
  const goToNextSlide = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true
      });
    } else {
      completeOnboarding();
    }
  };

  // Handle scroll end
  const handleScrollEnd = (e: any) => {
    const { contentOffset } = e.nativeEvent;
    const viewSize = e.nativeEvent.layoutMeasurement;
    const pageNum = Math.floor(contentOffset.x / viewSize.width);
    setCurrentIndex(pageNum);
  };

  // Onboarding slides data
  const slides: OnboardingSlide[] = [
    {
      id: '1',
      title: 'What VoiceGuard Does',
      description: 'VoiceGuard AI protects you from scam voicemails by detecting synthetic (artificial) voices used by scammers.',
      icon: 'shield-check'
    },
    {
      id: '2',
      title: 'How It Works',
      description: 'Save your suspicious voicemails to your device, then upload them to VoiceGuard. Our AI will analyze the voice to determine if it\'s real or AI-generated.',
      icon: 'voicemail'
    },
    {
      id: '3',
      title: 'File Access',
      description: 'VoiceGuard needs access to your files to analyze saved voicemails. Your privacy is protected - no recordings are sent to the internet unless you choose to enable cloud processing.',
      icon: 'file'
    },
  ];

  // Render slide item
  const renderSlideItem = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    const isLastSlide = index === slides.length - 1;
    
    return (
      <View style={styles.slide}>
        <View style={styles.slideHeader}>
          <CustomIcon name={item.icon as any} size={80} color="#4F46E5" style={styles.slideIcon} />
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideDescription}>{item.description}</Text>
        </View>
        
        <View style={styles.slideContent}>
          {index === 0 && (
            <View style={styles.featureContainer}>
              <View style={styles.featureItem}>
                <CustomIcon name="shield-check" size={24} color="#4F46E5" />
                <Text style={styles.featureText}>Detects AI-generated voices</Text>
              </View>
              <View style={styles.featureItem}>
                <CustomIcon name="voicemail" size={24} color="#4F46E5" />
                <Text style={styles.featureText}>Works with saved voicemails</Text>
              </View>
              <View style={styles.featureItem}>
                <CustomIcon name="lightning-bolt" size={24} color="#4F46E5" />
                <Text style={styles.featureText}>Fast and accurate analysis</Text>
              </View>
              <Text style={styles.tutorialText}>
                Scammers use AI to create fake voices that sound like real people. 
                VoiceGuard helps you identify these fake voices in voicemails to avoid being scammed.
              </Text>
            </View>
          )}
          
          {index === 1 && (
            <View style={styles.howToContainer}>
              <Text style={styles.howToTitle}>Step-by-Step Guide:</Text>
              
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Save Your Voicemail</Text>
                  <Text style={styles.stepDescription}>
                    When you receive a suspicious voicemail, save it to your device from your voicemail app.
                  </Text>
                </View>
              </View>
              
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Open VoiceGuard</Text>
                  <Text style={styles.stepDescription}>
                    Open the VoiceGuard app and tap on the "Scan Voicemail" button on the home screen.
                  </Text>
                </View>
              </View>
              
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Select Your Voicemail File</Text>
                  <Text style={styles.stepDescription}>
                    Use the document picker to select the voicemail file you saved to your device.
                  </Text>
                </View>
              </View>
              
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>View Results</Text>
                  <Text style={styles.stepDescription}>
                    VoiceGuard will analyze the voicemail and tell you if the voice is human or AI-generated.
                  </Text>
                </View>
              </View>
            </View>
          )}
          
          {index === 2 && (
            <View style={styles.permissionContainer}>
              <View style={styles.permissionItem}>
                <CustomIcon 
                  name="file" 
                  size={32} 
                  color={"#4F46E5"} 
                />
                <View style={styles.permissionTextContainer}>
                  <Text style={styles.permissionTitle}>File Access</Text>
                  <Text style={styles.permissionDescription}>
                    Required to analyze saved voicemail files
                  </Text>
                </View>
                <View style={[
                  styles.permissionStatus,
                  { backgroundColor: "#EEF2FF" }
                ]}>
                  <Text style={[
                    styles.permissionStatusText,
                    { color: "#4F46E5" }
                  ]}>
                    Required
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.permissionButton}
                onPress={() => {}}
              >
                <Text style={styles.permissionButtonText}>File access will be requested when needed</Text>
              </TouchableOpacity>
              
              <Text style={styles.privacyText}>
                VoiceGuard respects your privacy. We do not share your voicemails with third parties unless 
                you explicitly enable cloud processing in settings. All analysis is done on your 
                device by default.
              </Text>
              
              <Text style={styles.helpText}>
                You can always access this tutorial again by tapping the "Help & Tutorial" 
                button on the home screen.
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.slideFooter}>
          <View style={styles.paginationContainer}>
            {slides.map((_, i) => (
              <View 
                key={i} 
                style={[
                  styles.paginationDot,
                  i === currentIndex ? styles.paginationDotActive : {}
                ]} 
              />
            ))}
          </View>
          
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={goToNextSlide}
          >
            <Text style={styles.nextButtonText}>
              {isLastSlide ? "Get Started" : "Next"}
            </Text>
            <CustomIcon name="arrow-right" size={20} color="#FFFFFF" style={styles.nextButtonIcon} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlideItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        keyExtractor={(item) => item.id}
        bounces={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  slide: {
    width,
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  slideHeader: {
    alignItems: 'center',
    marginTop: 40,
  },
  slideIcon: {
    marginBottom: 24,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  slideDescription: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  featureContainer: {
    marginTop: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  tutorialText: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  howToContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  howToTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  permissionContainer: {
    marginTop: 24,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#4B5563',
  },
  permissionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  permissionStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  permissionButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  privacyText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  helpText: {
    fontSize: 15,
    color: '#4F46E5',
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  slideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginRight: 8,
  },
  paginationDotActive: {
    backgroundColor: '#4F46E5',
    width: 24,
  },
  nextButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonIcon: {
    marginLeft: 8,
  }
});

export default OnboardingScreen;
