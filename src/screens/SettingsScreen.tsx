import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert, StyleSheet, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import CustomIcon from '../components/CustomIcon';
import { useSettings } from '../contexts/SettingsContext';
import { useCallDetection } from '../contexts/CallDetectionContext';
import { getModelInfo } from '../services/voiceAnalysisService';
import DeviceInfo from 'react-native-device-info';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings, updateSettings, resetSettings } = useSettings();
  const { clearCallHistory } = useCallDetection();
  const [modelInfo, setModelInfo] = useState<{ isLoaded: boolean; modelSize: number; version: string }>({ 
    isLoaded: false, 
    modelSize: 0, 
    version: '1.0.0' 
  });
  
  // Load model info
  React.useEffect(() => {
    const loadModelInfo = async () => {
      const info = await getModelInfo();
      setModelInfo(info);
    };
    
    loadModelInfo();
  }, []);

  // Toggle settings
  const toggleSetting = async (key: keyof typeof settings, value: any) => {
    await updateSettings({ [key]: value });
  };

  // Handle reset settings
  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            await resetSettings();
          }
        }
      ]
    );
  };

  // Handle clear history
  const handleClearHistory = () => {
    Alert.alert(
      'Clear Call History',
      'Are you sure you want to clear all call history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            await clearCallHistory();
          }
        }
      ]
    );
  };

  // Reset onboarding
  const resetOnboarding = async () => {
    Alert.alert(
      'Reset Onboarding',
      'This will show the onboarding screens again the next time you open the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          onPress: async () => {
            await updateSettings({ onboardingCompleted: false });
            Alert.alert('Success', 'Onboarding has been reset. You will see the onboarding screens the next time you open the app.');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <CustomIcon name="arrow-left" size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Subscription Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.card}>
            <View style={styles.subscriptionContainer}>
              <View style={styles.subscriptionHeader}>
                <CustomIcon name="check-decagram" size={24} color="#10B981" />
                <Text style={styles.subscriptionTitle}>VoiceGuard Premium</Text>
              </View>
              <Text style={styles.subscriptionStatus}>Active</Text>
              <Text style={styles.subscriptionDescription}>
                Your premium subscription gives you unlimited voice scans and access to all features.
              </Text>
            </View>
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={resetOnboarding}
            >
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>View Tutorial</Text>
                <Text style={styles.settingDescription}>Open the tutorial screens again</Text>
              </View>
              <CustomIcon name="chevron-right" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.actionButton} onPress={handleClearHistory}>
              <CustomIcon name="delete" size={20} color="#EF4444" style={styles.actionButtonIcon} />
              <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Clear Call History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleResetSettings}>
              <CustomIcon name="refresh" size={20} color="#4F46E5" style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>Reset All Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>App Version</Text>
              <Text style={styles.infoValue}>{DeviceInfo.getVersion()} ({DeviceInfo.getBuildNumber()})</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>AI Model</Text>
              <Text style={styles.infoValue}>
                {modelInfo.isLoaded ? `v${modelInfo.version}` : 'Loading...'}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => Linking.openURL('https://www.voiceguard.ai/privacy')}
            >
              <CustomIcon name="shield-lock" size={20} color="#4F46E5" style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>Privacy Policy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => Linking.openURL('https://www.voiceguard.ai/terms')}
            >
              <CustomIcon name="file-document" size={20} color="#4F46E5" style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  subscriptionContainer: {
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
  },
  subscriptionStatus: {
    fontSize: 16,
    fontWeight: '500',
    color: '#047857',
    marginBottom: 8,
  },
  subscriptionDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionButtonIcon: {
    marginRight: 12,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '500',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 16,
    color: '#4B5563',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
});

export default SettingsScreen;
