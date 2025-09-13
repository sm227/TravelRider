import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function DeliveryListScreen() {
  const insets = useSafeAreaInsets();

  const mockDeliveries = [
    {
      id: '1',
      customerName: '김고객',
      pickupAddress: '서울시 강남구 테헤란로 123',
      deliveryAddress: '서울시 서초구 반포대로 456',
      status: 'assigned',
      priority: 'high'
    },
    {
      id: '2',
      customerName: '이고객',
      pickupAddress: '서울시 마포구 홍대입구역 789',
      deliveryAddress: '서울시 용산구 한강대로 321',
      status: 'in_progress',
      priority: 'normal'
    },
    {
      id: '3',
      customerName: '박고객',
      pickupAddress: '서울시 종로구 종로 654',
      deliveryAddress: '서울시 중구 명동길 987',
      status: 'assigned',
      priority: 'normal'
    }
  ];

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return '배정됨';
      case 'in_progress': return '진행중';
      case 'completed': return '완료';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return '#000000';
      case 'in_progress': return '#666666';
      case 'completed': return '#999999';
      default: return '#CCCCCC';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#000000';
      case 'normal': return '#666666';
      case 'low': return '#999999';
      default: return '#CCCCCC';
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>배달 목록</ThemedText>
        <Text style={styles.headerSubtitle}>총 {mockDeliveries.length}건</Text>
      </View>

      <ScrollView style={styles.deliveryList} showsVerticalScrollIndicator={false}>
        {mockDeliveries.map((delivery) => (
          <TouchableOpacity key={delivery.id} style={styles.deliveryCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.customerName}>{delivery.customerName}</Text>
              <View style={styles.statusContainer}>
                {delivery.priority === 'high' && (
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(delivery.priority) }]}>
                    <Text style={styles.priorityText}>긴급</Text>
                  </View>
                )}
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(delivery.status)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.addressContainer}>
              <View style={styles.addressRow}>
                <Text style={styles.addressLabel}>픽업:</Text>
                <Text style={styles.addressText} numberOfLines={1}>{delivery.pickupAddress}</Text>
              </View>
              <View style={styles.addressRow}>
                <Text style={styles.addressLabel}>배송:</Text>
                <Text style={styles.addressText} numberOfLines={1}>{delivery.deliveryAddress}</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>상세보기</Text>
              </TouchableOpacity>
              {delivery.status === 'assigned' && (
                <TouchableOpacity style={styles.startButton}>
                  <Text style={styles.startButtonText}>배달 시작</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  deliveryList: {
    flex: 1,
  },
  deliveryCard: {
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  addressContainer: {
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#CCCCCC',
    width: 40,
    marginRight: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#AAAAAA',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#444444',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  actionButtonText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: '500',
  },
  startButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '500',
  },
});
