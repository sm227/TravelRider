import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Animated } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDelivery } from '@/contexts/DeliveryContext';
import { useAuth } from '@/contexts/AuthContext';
import { DeliveryResponse, DeliveryStatus } from '@/services/deliveryService';

export default function DeliveryListScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateDriverStatus } = useAuth();
  const {
    availableDeliveries,
    isLoading,
    fetchAvailableDeliveries,
    acceptDelivery,
    setCurrentDelivery,
    refreshDeliveries
  } = useDelivery();

  // 안전 수칙 체크 상태
  const [safetyChecks, setSafetyChecks] = useState({
    vehicleCheck: false,
    safetyGearCheck: false,
    routeCheck: false,
  });

  const [isClockingIn, setIsClockingIn] = useState(false);
  const [translateX] = useState(new Animated.Value(0));

  useEffect(() => {
    if (user && user.status === 'ONLINE') {
      fetchAvailableDeliveries();
    }
  }, [user, fetchAvailableDeliveries]);

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

  const handleAcceptDelivery = async (delivery: DeliveryResponse) => {
    Alert.alert(
      '배달 수락',
      `이 배달을 수락하시겠습니까?\n\n픽업: ${delivery.pickupAddress}\n배송: ${delivery.deliveryAddress}`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '수락',
          onPress: async () => {
            try {
              const success = await acceptDelivery(delivery.id);
              if (success) {
                setCurrentDelivery(delivery);
                Alert.alert('배달 수락 완료', '배달 진행 탭에서 배달을 시작해주세요.');
                router.push('/delivery');
              } else {
                Alert.alert('오류', '배달을 수락할 수 없습니다.');
              }
            } catch (error) {
              Alert.alert('오류', '네트워크 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
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

  // 안전 수칙 토글
  const toggleSafetyCheck = (key: keyof typeof safetyChecks) => {
    setSafetyChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // 모든 안전 수칙 확인 여부
  const allSafetyChecksComplete = Object.values(safetyChecks).every(check => check);

  // 스와이프 트랙 너비 - 패딩 - 버튼 너비 = 최대 슬라이드 거리
  // 대략 화면 너비(390) - paddingHorizontal(40) - track padding(20) - button width(100) - safe margin(20) = 210
  const maxSlideDistance = 210;
  const threshold = 170; // 출근 처리 임계값

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX: tx } = event.nativeEvent;

      // threshold 이상 밀면 출근 처리
      if (tx > threshold && allSafetyChecksComplete && !isClockingIn) {
        handleClockIn();
      } else {
        // 원위치로 돌아가기
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const handleClockIn = async () => {
    setIsClockingIn(true);

    try {
      const success = await updateDriverStatus('ONLINE');

      if (success) {
        // 애니메이션 완료 후 리셋
        Animated.timing(translateX, {
          toValue: maxSlideDistance,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          translateX.setValue(0);
          setSafetyChecks({
            vehicleCheck: false,
            safetyGearCheck: false,
            routeCheck: false,
          });
          Alert.alert('출근 완료', '안전운전 하세요!');
        });
      } else {
        Alert.alert('오류', '출근 처리에 실패했습니다.');
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } finally {
      setIsClockingIn(false);
    }
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

  // 오프라인 상태 - 출근하기 화면
  if (user.status === 'OFFLINE') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.clockInWrapper}>
            {/* 환영 메시지 */}
            <View style={styles.welcomeHeader}>
              <Text style={styles.welcomeTitle}>안녕하세요, {user.name}님</Text>
              <Text style={styles.welcomeSubtitle}>오늘도 안전운행 부탁드립니다</Text>
            </View>

            {/* 하단 고정 영역 */}
            <View style={styles.bottomFixedArea}>
              {/* 안전 수칙 체크리스트 */}
              <View style={styles.safetyChecklist}>
                <Text style={styles.checklistTitle}>안전 수칙 확인</Text>

                <TouchableOpacity
                  style={styles.checkItem}
                  onPress={() => toggleSafetyCheck('vehicleCheck')}
                >
                  <View style={[styles.checkbox, safetyChecks.vehicleCheck && styles.checkboxChecked]}>
                    {safetyChecks.vehicleCheck && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkLabel}>차량 점검 완료 (타이어, 브레이크 등)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkItem}
                  onPress={() => toggleSafetyCheck('safetyGearCheck')}
                >
                  <View style={[styles.checkbox, safetyChecks.safetyGearCheck && styles.checkboxChecked]}>
                    {safetyChecks.safetyGearCheck && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkLabel}>안전 장비 착용 (헬멧, 보호대 등)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkItem}
                  onPress={() => toggleSafetyCheck('routeCheck')}
                >
                  <View style={[styles.checkbox, safetyChecks.routeCheck && styles.checkboxChecked]}>
                    {safetyChecks.routeCheck && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkLabel}>교통법규 준수 및 안전운전 서약</Text>
                </TouchableOpacity>
              </View>

              {/* 스와이프 출근 */}
              <View style={styles.swipeContainer}>
                <View style={styles.swipeTrack}>
                  <Text style={[
                    styles.swipeText,
                    !allSafetyChecksComplete && styles.swipeTextDisabled
                  ]}>
                    {!allSafetyChecksComplete ? '안전 수칙을 먼저 확인해주세요' : '밀어서 출근하기 →'}
                  </Text>

                  {allSafetyChecksComplete && !isClockingIn && (
                    <PanGestureHandler
                      onGestureEvent={onGestureEvent}
                      onHandlerStateChange={onHandlerStateChange}
                      enabled={allSafetyChecksComplete && !isClockingIn}
                    >
                      <Animated.View
                        style={[
                          styles.swipeButton,
                          {
                            transform: [
                              {
                                translateX: translateX.interpolate({
                                  inputRange: [0, maxSlideDistance],
                                  outputRange: [0, maxSlideDistance],
                                  extrapolate: 'clamp',
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <Text style={styles.swipeButtonText}>→</Text>
                      </Animated.View>
                    </PanGestureHandler>
                  )}
                </View>
              </View>
            </View>

            {isClockingIn && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>출근 처리 중...</Text>
              </View>
            )}
          </View>
        </ThemedView>
      </GestureHandlerRootView>
    );
  }

  // 온라인 상태 - 배달 목록
  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>배달 목록</ThemedText>
        <Text style={styles.headerSubtitle}>수락 가능 {availableDeliveries.length}건</Text>
      </View>

      {isLoading && availableDeliveries.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>배달 목록을 불러오는 중...</Text>
        </View>
      ) : availableDeliveries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>현재 수락 가능한 배달이 없습니다.</Text>
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
          {availableDeliveries.map((delivery) => (
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
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => handleAcceptDelivery(delivery)}
                >
                  <Text style={styles.startButtonText}>배달 수락</Text>
                </TouchableOpacity>
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
    backgroundColor: '#1A1A1A',
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
  // 출근 화면 스타일
  clockInWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  welcomeHeader: {
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#AAAAAA',
  },
  bottomFixedArea: {
    paddingBottom: 40,
  },
  safetyChecklist: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  checklistTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#444444',
    backgroundColor: '#1A1A1A',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  checkLabel: {
    flex: 1,
    fontSize: 15,
    color: '#DDDDDD',
    lineHeight: 22,
  },
  swipeContainer: {
    paddingHorizontal: 20,
  },
  swipeTrack: {
    height: 70,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2A2A2A',
    justifyContent: 'center',
    paddingHorizontal: 10,
    position: 'relative',
  },
  swipeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingLeft: 80,
  },
  swipeTextDisabled: {
    fontSize: 15,
    color: '#666666',
    paddingLeft: 0,
  },
  swipeButton: {
    position: 'absolute',
    left: 6,
    top: 6,
    width: 100,
    height: 58,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  swipeButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
