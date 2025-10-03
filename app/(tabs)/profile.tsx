import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { driverService, DriverStatsResponse } from '@/services/driverService';

// 웹 호환 Alert 함수
const showAlert = (title: string, message?: string, buttons?: any[]) => {
  if (Platform.OS === 'web') {
    // 웹에서는 confirm/alert 사용
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n\n${message || ''}`);
      const confirmButton = buttons.find(b => b.text !== '취소' && b.text !== 'Cancel');
      if (confirmed && confirmButton?.onPress) {
        confirmButton.onPress();
      }
    } else {
      window.alert(`${title}\n\n${message || ''}`);
      if (buttons?.[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

export default function ProfileScreen() {
  const {
    user,
    logout,
    updateDriverStatus,
    refreshProfile,
    startLocationTracking,
    stopLocationTracking,
    isLocationTrackingActive
  } = useAuth();
  const insets = useSafeAreaInsets();
  const [driverStats, setDriverStats] = useState<DriverStatsResponse | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (user) {
      loadDriverStats();
    }
  }, [user]);

  const loadDriverStats = async () => {
    if (!user) return;

    try {
      setIsLoadingStats(true);
      const response = await driverService.getStats(user.id);
      if (response.success && response.data) {
        setDriverStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load driver stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const getDriverInfo = () => ({
    name: user?.name || '배달원',
    id: user?.id ? `D${user.id.toString().padStart(6, '0')}` : 'D000000',
    phone: user?.phone || user?.phoneNumber || '전화번호 없음',
    vehicle: user?.vehicleType && user?.vehicleNumber
      ? `${user.vehicleType} (${user.vehicleNumber})`
      : '차량 정보 없음',
    rating: driverStats?.averageRating || 0,
    totalDeliveries: driverStats?.totalDeliveries || 0,
    completedToday: driverStats?.todayDeliveries || 0,
    todayEarnings: driverStats?.todayEarnings || 0,
    totalEarnings: driverStats?.totalEarnings || 0,
    onlineHours: driverStats?.onlineHours || 0,
    completedDeliveries: driverStats?.completedDeliveries || 0
  });

  const handleLogout = async () => {
    showAlert(
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
    showAlert('프로필 수정', '프로필 수정 화면으로 이동합니다.');
  };

  const handleVehicleInfo = () => {
    showAlert('차량 정보', '차량 정보 관리 화면으로 이동합니다.');
  };

  const handleSettings = () => {
    showAlert('설정', '설정 화면으로 이동합니다.');
  };

  const handleHelp = () => {
    showAlert('도움말', '도움말 및 고객센터 화면으로 이동합니다.');
  };

  const handleStatusChange = () => {
    if (!user) return;

    const currentStatus = user.status || 'OFFLINE';
    const statusOptions = [
      { label: '온라인', value: 'ONLINE', description: '배달 요청을 받을 수 있습니다' },
      { label: '오프라인', value: 'OFFLINE', description: '배달 요청을 받지 않습니다' },
      { label: '바쁨', value: 'BUSY', description: '현재 배달 중입니다' },
      { label: '휴식', value: 'BREAK', description: '잠시 휴식 중입니다' }
    ];

    // 웹에서는 단순화된 상태 변경
    if (Platform.OS === 'web') {
      const currentLabel = statusOptions.find(s => s.value === currentStatus)?.label;
      const message = `현재 상태: ${currentLabel}\n\n변경할 상태:\n1. 온라인\n2. 오프라인\n3. 바쁨\n4. 휴식\n\n번호를 입력하세요 (1-4):`;
      const input = window.prompt(message);

      if (input) {
        const index = parseInt(input) - 1;
        if (index >= 0 && index < statusOptions.length) {
          const option = statusOptions[index];
          setIsUpdatingStatus(true);
          updateDriverStatus(option.value as any).then(success => {
            if (success) {
              showAlert('상태 변경', `상태가 ${option.label}로 변경되었습니다.`);
            } else {
              showAlert('오류', '상태 변경에 실패했습니다.');
            }
          }).finally(() => {
            setIsUpdatingStatus(false);
          });
        }
      }
      return;
    }

    const buttons = statusOptions.map(option => ({
      text: `${option.label} ${currentStatus === option.value ? '✓' : ''}`,
      onPress: async () => {
        if (currentStatus === option.value) return;

        setIsUpdatingStatus(true);
        try {
          const success = await updateDriverStatus(option.value as any);
          if (success) {
            showAlert('상태 변경', `상태가 ${option.label}로 변경되었습니다.`);
          } else {
            showAlert('오류', '상태 변경에 실패했습니다.');
          }
        } catch (error) {
          showAlert('오류', '네트워크 오류가 발생했습니다.');
        } finally {
          setIsUpdatingStatus(false);
        }
      }
    }));

    Alert.alert(
      '상태 변경',
      `현재 상태: ${statusOptions.find(s => s.value === currentStatus)?.label}\n\n변경할 상태를 선택해주세요.`,
      [
        ...buttons,
        { text: '취소', style: 'cancel' }
      ]
    );
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'ONLINE': return '온라인';
      case 'OFFLINE': return '오프라인';
      case 'BUSY': return '바쁨';
      case 'BREAK': return '휴식';
      default: return '알 수 없음';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ONLINE': return '#00FF00';
      case 'OFFLINE': return '#888888';
      case 'BUSY': return '#FF9900';
      case 'BREAK': return '#FFFF00';
      default: return '#CCCCCC';
    }
  };

  const handleLocationTrackingToggle = async () => {
    const isActive = isLocationTrackingActive();

    showAlert(
      '위치 추적',
      isActive
        ? '위치 추적을 중단하시겠습니까?'
        : '위치 추적을 시작하시겠습니까?\n\n온라인 상태일 때 자동으로 위치가 업데이트됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: isActive ? '중단' : '시작',
          onPress: async () => {
            try {
              if (isActive) {
                await stopLocationTracking();
                showAlert('위치 추적', '위치 추적이 중단되었습니다.');
              } else {
                const success = await startLocationTracking();
                if (success) {
                  showAlert('위치 추적', '위치 추적이 시작되었습니다.');
                } else {
                  showAlert('오류', '위치 권한을 확인해주세요.');
                }
              }
            } catch (error) {
              showAlert('오류', '위치 추적 설정 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
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

  const driverInfo = getDriverInfo();

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
              <Text style={styles.ratingText}>⭐ {driverInfo.rating.toFixed(1)}</Text>
              <Text style={styles.ratingLabel}>평점</Text>
            </View>
            {/* 상태 표시 */}
            <TouchableOpacity
              style={[styles.statusContainer, { backgroundColor: getStatusColor(user.status) }]}
              onPress={handleStatusChange}
              disabled={isUpdatingStatus}
            >
              <Text style={styles.statusText}>
                {isUpdatingStatus ? '업데이트 중...' : getStatusText(user.status)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        {isLoadingStats ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>통계 로딩 중...</Text>
          </View>
        ) : (
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
                {(driverInfo.todayEarnings / 10000).toFixed(0)}만원
              </Text>
              <Text style={styles.statLabel}>오늘 수익</Text>
            </View>
          </View>
        )}

        {/* Additional Stats */}
        {driverStats && (
          <View style={styles.additionalStatsContainer}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{driverInfo.completedDeliveries}</Text>
                <Text style={styles.statLabel}>완료 배달</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{driverInfo.onlineHours}h</Text>
                <Text style={styles.statLabel}>온라인 시간</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {(driverInfo.totalEarnings / 10000).toFixed(0)}만원
                </Text>
                <Text style={styles.statLabel}>총 수익</Text>
              </View>
              <View style={styles.statItem}>
                <TouchableOpacity onPress={loadDriverStats} style={styles.refreshStats}>
                  <Text style={styles.refreshStatsText}>🔄 새로고침</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

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

          <TouchableOpacity style={styles.menuItem} onPress={handleLocationTrackingToggle}>
            <Text style={styles.menuIcon}>📍</Text>
            <Text style={styles.menuText}>
              위치 추적 {isLocationTrackingActive() ? '(활성화됨)' : '(비활성화됨)'}
            </Text>
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
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 12,
  },
  additionalStatsContainer: {
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  refreshStats: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#444444',
  },
  refreshStatsText: {
    color: '#CCCCCC',
    fontSize: 12,
    fontWeight: '500',
  },
});