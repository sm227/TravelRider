import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDelivery } from '@/contexts/DeliveryContext';
import { useAuth } from '@/contexts/AuthContext';
import { DeliveryResponse, DeliveryStatus } from '@/services/deliveryService';

export default function DeliveryListScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    deliveries,
    isLoading,
    fetchDriverDeliveries,
    setCurrentDelivery,
    updateDeliveryStatus,
    refreshDeliveries
  } = useDelivery();

  useEffect(() => {
    if (user) {
      fetchDriverDeliveries();
    }
  }, [user, fetchDriverDeliveries]);

  const getStatusText = (status: DeliveryStatus) => {
    switch (status) {
      case 'PENDING': return '대기중';
      case 'ASSIGNED': return '배정됨';
      case 'ACCEPTED': return '수락됨';
      case 'PICKED_UP': return '픽업완료';
      case 'IN_PROGRESS': return '배송중';
      case 'DELIVERED': return '배송완료';
      case 'CANCELLED': return '취소됨';
      default: return status;
    }
  };

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case 'PENDING': return '#999999';
      case 'ASSIGNED': return '#000000';
      case 'ACCEPTED': return '#333333';
      case 'PICKED_UP': return '#555555';
      case 'IN_PROGRESS': return '#666666';
      case 'DELIVERED': return '#888888';
      case 'CANCELLED': return '#AAAAAA';
      default: return '#CCCCCC';
    }
  };

  const isUrgentDelivery = (delivery: DeliveryResponse): boolean => {
    const requestedAt = new Date(delivery.requestedAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - requestedAt.getTime()) / (1000 * 60 * 60);
    return hoursDiff > 2; // 2시간 이상 지난 배달을 긴급으로 표시
  };

  const handleStartDelivery = async (delivery: DeliveryResponse) => {
    try {
      const success = await updateDeliveryStatus(delivery.id, 'ACCEPTED');
      if (success) {
        setCurrentDelivery(delivery);
        router.push('/delivery');
        Alert.alert('배달 시작', `${delivery.pickupAddress}로 이동하여 픽업을 진행해주세요.`);
      } else {
        Alert.alert('오류', '배달을 시작할 수 없습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    }
  };

  const handleDeliveryDetail = (delivery: DeliveryResponse) => {
    Alert.alert(
      '배달 상세정보',
      `픽업: ${delivery.pickupAddress}\n배송: ${delivery.deliveryAddress}\n물품: ${delivery.itemDescription}\n무게: ${delivery.weight}kg`,
      [{ text: '확인' }]
    );
  };

  const getCustomerName = (delivery: DeliveryResponse): string => {
    // API에서 고객명을 따로 제공하지 않는 경우 주소에서 추출하거나 기본값 사용
    return `고객 #${delivery.id}`;
  };

  // 로그인되지 않은 경우
  if (!user) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>로그인이 필요합니다.</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>로그인하기</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>배달 목록</ThemedText>
        <Text style={styles.headerSubtitle}>총 {deliveries.length}건</Text>
      </View>

      {isLoading && deliveries.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>배달 목록을 불러오는 중...</Text>
        </View>
      ) : deliveries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>배정된 배달이 없습니다.</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={refreshDeliveries}
          >
            <Text style={styles.refreshButtonText}>새로고침</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.deliveryList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshDeliveries}
              tintColor="#FFFFFF"
            />
          }
        >
          {deliveries.map((delivery) => (
            <TouchableOpacity
              key={delivery.id}
              style={styles.deliveryCard}
              onPress={() => handleDeliveryDetail(delivery)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.customerName}>{getCustomerName(delivery)}</Text>
                <View style={styles.statusContainer}>
                  {isUrgentDelivery(delivery) && (
                    <View style={styles.priorityBadge}>
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
                  <Text style={styles.addressText} numberOfLines={2}>{delivery.pickupAddress}</Text>
                </View>
                <View style={styles.addressRow}>
                  <Text style={styles.addressLabel}>배송:</Text>
                  <Text style={styles.addressText} numberOfLines={2}>{delivery.deliveryAddress}</Text>
                </View>
                <View style={styles.addressRow}>
                  <Text style={styles.addressLabel}>물품:</Text>
                  <Text style={styles.addressText} numberOfLines={1}>{delivery.itemDescription}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeliveryDetail(delivery)}
                >
                  <Text style={styles.actionButtonText}>상세보기</Text>
                </TouchableOpacity>
                {(delivery.status === 'ASSIGNED' || delivery.status === 'PENDING') && (
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => handleStartDelivery(delivery)}
                  >
                    <Text style={styles.startButtonText}>배달 시작</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: 16,
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
  },
  refreshButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444444',
  },
  refreshButtonText: {
    color: '#CCCCCC',
    fontSize: 16,
    fontWeight: '500',
  },
});
