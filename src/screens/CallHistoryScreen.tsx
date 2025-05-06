import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCallDetection } from '../contexts/CallDetectionContext';
import { RootStackParamList } from '../../App';

type CallHistoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CallHistory'>;

const CallHistoryScreen: React.FC = () => {
  const navigation = useNavigation<CallHistoryScreenNavigationProp>();
  const { callHistory, deleteCallRecord } = useCallDetection();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'ai' | 'human'>('all');

  const filteredCalls = callHistory.filter(call => {
    if (selectedFilter === 'ai') return call.isAIDetected;
    if (selectedFilter === 'human') return !call.isAIDetected;
    return true;
  });

  const handleDeleteCall = (id: string) => {
    Alert.alert(
      'Delete Call Record',
      'Are you sure you want to delete this call record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteCallRecord(id)
        },
      ]
    );
  };

  const renderCallItem = ({ item }: { item: typeof callHistory[0] }) => (
    <View style={styles.callItem}>
      <View style={styles.callIcon}>
        <Icon 
          name={item.isAIDetected ? "robot" : "account"} 
          size={24} 
          color={item.isAIDetected ? "#DC2626" : "#4F46E5"}
        />
      </View>
      <View style={styles.callInfo}>
        <Text style={styles.phoneNumber}>{item.callerName || item.phoneNumber}</Text>
        <Text style={styles.callTime}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
        <View style={[
          styles.badge,
          { backgroundColor: item.isAIDetected ? "#FEE2E2" : "#EEF2FF" }
        ]}>
          <Text style={[
            styles.badgeText,
            { color: item.isAIDetected ? "#DC2626" : "#4F46E5" }
          ]}>
            {item.isAIDetected ? "AI Voice" : "Human"}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteCall(item.id)}
      >
        <Icon name="delete" size={20} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filters}>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'ai' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('ai')}
        >
          <Text style={[styles.filterText, selectedFilter === 'ai' && styles.filterTextActive]}>
            AI Detected
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'human' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('human')}
        >
          <Text style={[styles.filterText, selectedFilter === 'human' && styles.filterTextActive]}>
            Human
          </Text>
        </TouchableOpacity>
      </View>

      {/* Call List */}
      <FlatList
        data={filteredCalls}
        renderItem={renderCallItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Icon name="phone-off" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No calls in history</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  filters: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#4F46E5',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  callIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  callInfo: {
    flex: 1,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  callTime: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
});

export default CallHistoryScreen;
