import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useCallDetection } from '../contexts/CallDetectionContext';
import CustomIcon from '../components/CustomIcon';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { callHistory } = useCallDetection();
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  // Checklist state
  const [checklist, setChecklist] = useState([
    { id: 'speakerphone', text: 'Call is on speakerphone', checked: false, icon: 'phone-in-talk' },
    { id: 'volume', text: 'Volume is turned up', checked: false, icon: 'volume-high' },
    { id: 'number', text: 'Phone number is verified', checked: false, icon: 'phone-check' },
  ]);

  // Check if all items are checked
  const allChecked = checklist.every(item => item.checked);

  // Toggle checklist item
  const toggleChecklistItem = (id: string) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  // Handle scan call
  const handleScanCall = () => {
    if (!allChecked) {
      Alert.alert('Checklist Incomplete', 'Please complete all checklist items before scanning to ensure proper voice recording.');
      return;
    }

    navigation.navigate('CallScan', { phoneNumber: phoneNumber.trim() });
  };

  // Render recent call history item
  const renderCallHistoryItem = (call: any, index: number) => {
    if (!call) return null;

    const isAI = call.isAI || call.isAIDetected;
    const date = new Date(call.timestamp);
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    return (
      <TouchableOpacity
        key={index}
        style={styles.historyItem}
        onPress={() => navigation.navigate('CallHistory')}
      >
        <View style={styles.historyItemLeft}>
          <CustomIcon
            name={isAI ? "robot" : "account"}
            size={24}
            color={isAI ? "#EF4444" : "#10B981"}
          />
          <View style={styles.historyItemTextContainer}>
            <Text style={styles.historyItemPhone}>{call.phoneNumber || "Unknown"}</Text>
            <Text style={styles.historyItemDate}>{formattedDate}</Text>
          </View>
        </View>
        <View style={[styles.resultBadge, { backgroundColor: isAI ? "#FEE2E2" : "#D1FAE5" }]}>
          <Text style={[styles.resultBadgeText, { color: isAI ? "#B91C1C" : "#047857" }]}>
            {isAI ? "AI" : "Human"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.header}>
            <Text style={styles.title}>VoiceGuard AI</Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <CustomIcon name="cog" size={24} color="#4F46E5" />
            </TouchableOpacity>
          </View>

          <View style={styles.mainCard}>
            <View style={styles.cardHeader}>
              <CustomIcon name="shield-check" size={32} color="#4F46E5" />
              <Text style={styles.cardTitle}>Call Scanner</Text>
            </View>

            <Text style={styles.cardDescription}>
              Put your call on speaker and let VoiceGuard analyze the voice to detect AI-generated scams.
            </Text>

            <View style={styles.phoneInputContainer}>
              <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.checklistContainer}>
              <Text style={styles.checklistTitle}>Before scanning:</Text>

              {checklist.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.checklistItem}
                  onPress={() => toggleChecklistItem(item.id)}
                >
                  <View style={[styles.checkbox, item.checked ? styles.checkboxChecked : {}]}>
                    {item.checked && <CustomIcon name="check" size={16} color="#FFFFFF" />}
                  </View>
                  <CustomIcon name={item.icon} size={20} color="#4F46E5" style={styles.checklistIcon} />
                  <Text style={styles.checklistText}>{item.text}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.scanButton, !allChecked ? styles.scanButtonDisabled : {}]}
              onPress={handleScanCall}
              disabled={!allChecked}
            >
              <Text style={styles.scanButtonText}>Start Scan</Text>
              <CustomIcon name="microphone" size={20} color="#FFFFFF" style={styles.scanButtonIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.historySection}>
            <View style={styles.historySectionHeader}>
              <Text style={styles.historySectionTitle}>Recent Scans</Text>
              {callHistory.length > 0 && (
                <TouchableOpacity onPress={() => navigation.navigate('CallHistory')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              )}
            </View>

            {callHistory.length > 0 ? (
              <View style={styles.historyList}>
                {callHistory.slice(0, 3).map((call, index) => renderCallHistoryItem(call, index))}
              </View>
            ) : (
              <View style={styles.emptyHistory}>
                <CustomIcon name="history" size={48} color="#D1D5DB" />
                <Text style={styles.emptyHistoryText}>No scan history yet</Text>
                <Text style={styles.emptyHistorySubtext}>Your scan results will appear here</Text>
              </View>
            )}
          </View>

          {/* Help & Tutorial Button */}
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => {
              // Navigate to onboarding screens for tutorial
              navigation.navigate('Onboarding');
            }}
          >
            <CustomIcon name="help-circle" size={20} color="#4F46E5" />
            <Text style={styles.helpButtonText}>Help & Tutorial</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 20,
    lineHeight: 20,
  },
  phoneInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  phoneInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  checklistContainer: {
    marginBottom: 24,
  },
  checklistTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4F46E5',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4F46E5',
  },
  checklistIcon: {
    marginRight: 8,
  },
  checklistText: {
    fontSize: 14,
    color: '#111827',
  },
  scanButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scanButtonIcon: {
    marginLeft: 8,
  },
  historySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historySectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  historyList: {
    marginTop: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemTextContainer: {
    marginLeft: 12,
  },
  historyItemPhone: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  historyItemDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  resultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginTop: 12,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignSelf: 'center',
  },
  helpButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4F46E5',
    marginLeft: 8,
  },
});

export default HomeScreen;
