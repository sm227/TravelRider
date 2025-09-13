import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const driverInfo = {
    name: user?.name || '홍배달',
    id: 'D001234',
    phone: user?.phone || '010-9876-5432',
    vehicle: '오토바이 (서울12하3456)',
    rating: 4.8,
    totalDeliveries: 1247,
    completedToday: 8,
    monthlyEarnings: 1850000
  };

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('프로필 수정', '프로필 수정 화면으로 이동합니다.');
  };

  const handleVehicleInfo = () => {
    Alert.alert('차량 정보', '차량 정보 관리 화면으로 이동합니다.');
  };

  const handleSettings = () => {
    Alert.alert('설정', '설정 화면으로 이동합니다.');
  };

  const handleHelp = () => {
    Alert.alert('도움말', '도움말 및 고객센터 화면으로 이동합니다.');
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Text style={styles.profileImageText}>👤</Text>
          </View>
          <View style={styles.profileInfo}>
            <ThemedText type="title" style={styles.driverName}>
              {driverInfo.name}
            </ThemedText>
            <Text style={styles.driverInfo}>ID: {driverInfo.id}</Text>
            <Text style={styles.driverInfo}>📞 {driverInfo.phone}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>⭐ {driverInfo.rating}</Text>
              <Text style={styles.ratingLabel}>평점</Text>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{driverInfo.totalDeliveries}</Text>
            <Text style={styles.statLabel}>총 배달</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{driverInfo.completedToday}</Text>
            <Text style={styles.statLabel}>오늘 완료</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {(driverInfo.monthlyEarnings / 10000).toFixed(0)}만원
            </Text>
            <Text style={styles.statLabel}>이번 달 수익</Text>
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>차량 정보</Text>
          <Text style={styles.vehicleInfo}>{driverInfo.vehicle}</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleVehicleInfo}
          >
            <Text style={styles.editButtonText}>차량 정보 관리</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <Text style={styles.menuIcon}>✏️</Text>
            <Text style={styles.menuText}>프로필 수정</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
            <Text style={styles.menuIcon}>⚙️</Text>
            <Text style={styles.menuText}>설정</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleHelp}>
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={styles.menuText}>도움말 및 고객센터</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>📊</Text>
            <Text style={styles.menuText}>배달 통계</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>💰</Text>
            <Text style={styles.menuText}>수익 관리</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 24,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  profileImageText: {
    fontSize: 36,
  },
  profileInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#FFFFFF',
  },
  driverInfo: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FEE500',
    marginRight: 8,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#333333',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  infoCard: {
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  vehicleInfo: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#444444',
  },
  editButtonText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: '500',
  },
  menuSection: {
    backgroundColor: '#111111',
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#CCCCCC',
  },
  menuArrow: {
    fontSize: 20,
    color: '#666666',
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 40,
  },
});