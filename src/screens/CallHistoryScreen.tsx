import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCallDetection } from '../contexts/CallDetectionContext';
import { RootStackParamList } from '../../App';
import CustomIcon from '../components/CustomIcon';

type CallHistoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CallHistory'>;

const CallHistoryScreen: React.FC = () => {
  const navigation = useNavigation<CallHistoryScreenNavigationProp>();
  const { callHistory, deleteCallRecord } = useCallDetection();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'ai' | 'human'>('all');

  // Use useMemo to prevent unnecessary re-rendering and ensure stable list items
  const filteredCalls = useMemo(() => {
    // Create a deduplicated list based on id
    const uniqueCallMap = new Map();
    callHistory.forEach(call => {
      if (!uniqueCallMap.has(call.id)) {
        uniqueCallMap.set(call.id, call);
      }
    });
    
    // Convert back to array and filter
    const uniqueCalls = Array.from(uniqueCallMap.values());
    return uniqueCalls.filter(call => {
      if (selectedFilter === 'ai') return call.isAIDetected;
      if (selectedFilter === 'human') return !call.isAIDetected;
      return true;
    });
  }, [callHistory, selectedFilter]);

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

  // Format date without live updates
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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
          {formatDate(item.timestamp)}
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <CustomIcon name="arrow-left" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.title}>Scan History</Text>
        <View style={styles.headerRight} />
      </View>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
