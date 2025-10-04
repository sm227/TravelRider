import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDelivery } from '@/contexts/DeliveryContext';
import { useAuth } from '@/contexts/AuthContext';
import { DeliveryResponse } from '@/services/deliveryService';

export default function DeliveryProgressScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { assignedDeliveries, currentDelivery, setCurrentDelivery, updateDeliveryStatus, fetchAssignedDeliveries } = useDelivery();
  const [currentStep, setCurrentStep] = useState<number>(1); // 1: 픽업 진행, 2: 배송 진행
  const [isUpdating, setIsUpdating] = useState(false);
  const [showList, setShowList] = useState(true); // 목록/진행 화면 전환

  // 배차받은 배달 목록 가져오기
  useEffect(() => {
    if (user) {
      fetchAssignedDeliveries();
    }
  }, [user, fetchAssignedDeliveries]);

  // 디버깅: 상태 로그
  useEffect(() => {
    console.log('=== Delivery Screen Debug ===');
    console.log('assignedDeliveries:', assignedDeliveries.length);
    console.log('currentDelivery:', currentDelivery?.id);
    console.log('showList:', showList);
    console.log('currentStep:', currentStep);
  }, [assignedDeliveries, currentDelivery, showList, currentStep]);

  // 배달 상태에 따라 현재 단계 결정
  useEffect(() => {
    if (currentDelivery) {
      switch (currentDelivery.status) {
        case 'ACCEPTED':
        case 'ASSIGNED':
          setCurrentStep(1);
          break;
        case 'PICKED_UP':
        case 'IN_PROGRESS':
          setCurrentStep(2);
          break;
        case 'DELIVERED':
          setCurrentStep(0); // 완료
          break;
        default:
          setCurrentStep(1);
      }
    }
  }, [currentDelivery]);

  const handleSelectDelivery = (delivery: DeliveryResponse) => {
    setShowList(false);
    setCurrentDelivery(delivery);
  };

  const handleStartDelivery = async (delivery: DeliveryResponse) => {
    Alert.alert(
      '배달 시작',
      `이 배달을 시작하시겠습니까?\n\n픽업: ${delivery.pickupAddress}`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '시작',
          onPress: async () => {
            try {
              setIsUpdating(true);
              const success = await updateDeliveryStatus(delivery.id, 'ACCEPTED');
              if (success) {
                setShowList(false);
                setCurrentDelivery(delivery);
                Alert.alert('배달 시작', '픽업 장소로 이동해주세요.');
              } else {
                Alert.alert('오류', '배달을 시작할 수 없습니다.');
              }
            } catch (error) {
              Alert.alert('오류', '네트워크 오류가 발생했습니다.');
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  const handlePickupComplete = async () => {
    if (!currentDelivery) return;

    Alert.alert(
      '픽업 완료',
      '짐을 픽업했습니다. 배송을 시작하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '배송 시작',
          onPress: async () => {
            setIsUpdating(true);
            try {
              const success = await updateDeliveryStatus(currentDelivery.id, 'PICKED_UP');
              if (success) {
                setCurrentStep(2);
                Alert.alert('배송 시작', '배송지로 이동해주세요.');
              } else {
                Alert.alert('오류', '상태 업데이트에 실패했습니다.');
              }
            } catch (error) {
              Alert.alert('오류', '네트워크 오류가 발생했습니다.');
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  const handleDeliveryComplete = async () => {
    if (!currentDelivery) return;

    Alert.alert(
      '배달 완료',
      '배달 완료 사진을 촬영하시겠습니까?',
      [
        {
          text: '나중에',
          onPress: async () => {
            setIsUpdating(true);
            try {
              const success = await updateDeliveryStatus(currentDelivery.id, 'DELIVERED');
              if (success) {
                setCurrentStep(0);
                Alert.alert('배달 완료', '배달이 완료되었습니다!');
              } else {
                Alert.alert('오류', '상태 업데이트에 실패했습니다.');
              }
            } catch (error) {
              Alert.alert('오류', '네트워크 오류가 발생했습니다.');
            } finally {
              setIsUpdating(false);
            }
          }
        },
        {
          text: '사진 촬영',
          onPress: () => {
            router.push({
              pathname: '/camera/delivery-photo',
              params: {
                deliveryId: currentDelivery.id.toString(),
                customerName: `고객 #${currentDelivery.id}`,
                address: currentDelivery.deliveryAddress
              }
            });
          }
        }
      ]
    );
  };

  const handleCall = (phone?: string) => {
    if (phone) {
      Alert.alert('전화 걸기', `${phone}로 전화를 걸겠습니까?`);
    } else {
      Alert.alert('전화번호', '고객 전화번호가 없습니다.');
    }
  };

  const getCustomerName = (delivery: DeliveryResponse): string => {
    return `고객 #${delivery.id}`;
  };

  const getCustomerPhone = (delivery: DeliveryResponse): string => {
    // API에서 고객 전화번호를 제공하지 않는 경우 임시 번호
    return '010-0000-0000';
  };

  const getEstimatedTime = (delivery: DeliveryResponse): string => {
    if (delivery.estimatedDeliveryTime) {
      const date = new Date(delivery.estimatedDeliveryTime);
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    return '--:--';
  };

  const getRequestedTime = (delivery: DeliveryResponse): string => {
    const date = new Date(delivery.requestedAt);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // 로그인되지 않은 경우
  if (!user) {
    return (
      <ThemedView style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <ThemedText type="title" style={styles.emptyTitle}>
          로그인이 필요합니다
        </ThemedText>
        <Text style={styles.emptySubtitle}>
          로그인 후 배달을 진행할 수 있습니다
        </Text>
      </ThemedView>
    );
  }

  // 배차받은 배달이 없는 경우
  if (assignedDeliveries.length === 0) {
    return (
      <ThemedView style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <ThemedText type="title" style={styles.emptyTitle}>
          배차받은 배달이 없습니다
        </ThemedText>
        <Text style={styles.emptySubtitle}>
          배달 목록에서 배달을 수락해주세요
        </Text>
        <TouchableOpacity
          style={styles.goToListButton}
          onPress={() => router.push('/')}
        >
          <Text style={styles.goToListButtonText}>배달 목록 보기</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // 배차받은 배달 목록 표시
  if (showList || !currentDelivery || currentStep === 0) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>내 배달 목록</ThemedText>
          <Text style={styles.headerSubtitle}>배차받은 {assignedDeliveries.length}건</Text>
        </View>
        <ScrollView style={styles.deliveryList} showsVerticalScrollIndicator={false}>
          {assignedDeliveries.map((delivery) => (
            <TouchableOpacity
              key={delivery.id}
              style={styles.deliveryCard}
              onPress={() => handleSelectDelivery(delivery)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.customerName}>배달 #{delivery.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: delivery.status === 'ASSIGNED' ? '#666' : '#888' }]}>
                  <Text style={styles.statusText}>
                    {delivery.status === 'ASSIGNED' ? '대기' : delivery.status === 'ACCEPTED' ? '진행중' : '완료'}
                  </Text>
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
                {delivery.status === 'ASSIGNED' && (
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => handleStartDelivery(delivery)}
                  >
                    <Text style={styles.startButtonText}>배달 시작</Text>
                  </TouchableOpacity>
                )}
                {(delivery.status === 'ACCEPTED' || delivery.status === 'PICKED_UP' || delivery.status === 'IN_PROGRESS') && (
                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={() => handleSelectDelivery(delivery)}
                  >
                    <Text style={styles.continueButtonText}>계속하기</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ThemedView>
    );
  }

  // 로딩 중인 경우
  if (isUpdating) {
    return (
      <ThemedView style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>상태 업데이트 중...</Text>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setShowList(true);
            setCurrentDelivery(null);
          }}
        >
          <Text style={styles.backButtonText}>← 목록으로</Text>
        </TouchableOpacity>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[styles.stepCircle, currentStep >= 1 ? styles.activeStep : styles.inactiveStep]}>
              <Text style={[styles.stepText, currentStep >= 1 ? styles.activeStepText : styles.inactiveStepText]}>1</Text>
            </View>
            <Text style={styles.stepLabel}>픽업</Text>
          </View>
          <View style={[styles.progressLine, currentStep >= 2 ? styles.activeLine : styles.inactiveLine]} />
          <View style={styles.progressStep}>
            <View style={[styles.stepCircle, currentStep >= 2 ? styles.activeStep : styles.inactiveStep]}>
              <Text style={[styles.stepText, currentStep >= 2 ? styles.activeStepText : styles.inactiveStepText]}>2</Text>
            </View>
            <Text style={styles.stepLabel}>배송</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>고객 정보</Text>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{getCustomerName(currentDelivery)}</Text>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCall(getCustomerPhone(currentDelivery))}
            >
              <Text style={styles.callButtonText}>📞 전화</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Address */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>
            {currentStep === 1 ? '픽업 주소' : '배송 주소'}
          </Text>
          <Text style={styles.addressText}>
            {currentStep === 1 ? currentDelivery.pickupAddress : currentDelivery.deliveryAddress}
          </Text>
          <TouchableOpacity style={styles.mapButton}>
            <Text style={styles.mapButtonText}>🗺️ 지도로 보기</Text>
          </TouchableOpacity>
        </View>

        {/* Items */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>배송 물품</Text>
          <View style={styles.itemRow}>
            <Text style={styles.itemName}>{currentDelivery.itemDescription}</Text>
            <Text style={styles.itemCount}>{currentDelivery.weight}kg</Text>
          </View>
          <View style={styles.itemRow}>
            <Text style={styles.itemName}>배송 번호</Text>
            <Text style={styles.itemCount}>#{currentDelivery.trackingNumber || currentDelivery.id}</Text>
          </View>
        </View>

        {/* Time Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>시간 정보</Text>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>신청 시간:</Text>
            <Text style={styles.timeValue}>{getRequestedTime(currentDelivery)}</Text>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>예상 배송:</Text>
            <Text style={styles.timeValue}>{getEstimatedTime(currentDelivery)}</Text>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>현재 상태:</Text>
            <Text style={styles.timeValue}>
              {currentStep === 1 ? '픽업 진행중' : '배송 진행중'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {currentStep === 1 ? (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handlePickupComplete}
            >
              <Text style={styles.completeButtonText}>픽업 완료</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleDeliveryComplete}
            >
              <Text style={styles.completeButtonText}>배달 완료</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  progressStep: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeStep: {
    backgroundColor: '#FFFFFF',
  },
  inactiveStep: {
    backgroundColor: '#333333',
  },
  stepText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeStepText: {
    color: '#000000',
  },
  inactiveStepText: {
    color: '#CCCCCC',
  },
  stepLabel: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  progressLine: {
    height: 2,
    flex: 1,
    marginHorizontal: 16,
  },
  activeLine: {
    backgroundColor: '#FFFFFF',
  },
  inactiveLine: {
    backgroundColor: '#333333',
  },
  infoCard: {
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  callButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  callButtonText: {
    color: '#000000',
    fontWeight: '500',
  },
  addressText: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
    marginBottom: 12,
  },
  mapButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444444',
  },
  mapButtonText: {
    color: '#CCCCCC',
    fontWeight: '500',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  itemName: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  itemCount: {
    fontSize: 16,
    color: '#AAAAAA',
    fontWeight: 'bold',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  timeLabel: {
    fontSize: 16,
    color: '#AAAAAA',
  },
  timeValue: {
    fontSize: 16,
    color: '#CCCCCC',
    fontWeight: 'bold',
  },
  actionContainer: {
    paddingVertical: 24,
  },
  completeButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
  },
  goToListButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  goToListButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: 16,
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
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
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
  continueButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 6,
    backgroundColor: '#666666',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  backButtonText: {
    color: '#CCCCCC',
    fontSize: 16,
    fontWeight: '500',
  },
});