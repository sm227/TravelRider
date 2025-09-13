import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function DeliveryProgressScreen() {
  const insets = useSafeAreaInsets();

  const [currentDelivery, setCurrentDelivery] = useState({
    id: '1',
    customerName: '김고객',
    customerPhone: '010-1234-5678',
    pickupAddress: '서울시 강남구 테헤란로 123, 1층 카페',
    deliveryAddress: '서울시 서초구 반포대로 456, 101동 503호',
    status: 'in_progress',
    priority: 'high',
    pickupTime: '14:30',
    estimatedDeliveryTime: '15:00',
    items: [
      { name: '여행가방 대형', count: 1 },
      { name: '백팩', count: 2 }
    ]
  });

  const [currentStep, setCurrentStep] = useState(1); // 1: 픽업 진행, 2: 배송 진행

  const handlePickupComplete = () => {
    Alert.alert(
      '픽업 완료',
      '짐을 픽업했습니다. 배송을 시작하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '배송 시작',
          onPress: () => {
            setCurrentStep(2);
            setCurrentDelivery(prev => ({ ...prev, status: 'delivering' }));
          }
        }
      ]
    );
  };

  const handleDeliveryComplete = () => {
    Alert.alert(
      '배달 완료',
      '배달 완료 사진을 촬영하시겠습니까?',
      [
        { text: '나중에', onPress: () => setCurrentStep(0) },
        {
          text: '사진 촬영',
          onPress: () => {
            router.push({
              pathname: '/camera/delivery-photo',
              params: {
                deliveryId: currentDelivery.id,
                customerName: currentDelivery.customerName,
                address: currentDelivery.deliveryAddress
              }
            });
          }
        }
      ]
    );
  };

  const handleCall = (phone: string) => {
    Alert.alert('전화 걸기', `${phone}로 전화를 걸겠습니까?`);
  };

  if (currentStep === 0 || !currentDelivery) {
    return (
      <ThemedView style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <ThemedText type="title" style={styles.emptyTitle}>
          진행 중인 배달이 없습니다
        </ThemedText>
        <Text style={styles.emptySubtitle}>
          배달 목록에서 배달을 시작해주세요
        </Text>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
            <Text style={styles.customerName}>{currentDelivery.customerName}</Text>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCall(currentDelivery.customerPhone)}
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
          {currentDelivery.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemCount}>{item.count}개</Text>
            </View>
          ))}
        </View>

        {/* Time Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>시간 정보</Text>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>픽업 시간:</Text>
            <Text style={styles.timeValue}>{currentDelivery.pickupTime}</Text>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>예상 배송:</Text>
            <Text style={styles.timeValue}>{currentDelivery.estimatedDeliveryTime}</Text>
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
    backgroundColor: '#000000',
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#000000',
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
});