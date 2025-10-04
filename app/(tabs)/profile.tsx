import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/contexts/AuthContext";
import { driverService, DriverStatsResponse } from "@/services/driverService";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 웹 호환 Alert 함수
const showAlert = (title: string, message?: string, buttons?: any[]) => {
  if (Platform.OS === "web") {
    // 웹에서는 confirm/alert 사용
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n\n${message || ""}`);
      const confirmButton = buttons.find(
        (b) => b.text !== "취소" && b.text !== "Cancel"
      );
      if (confirmed && confirmButton?.onPress) {
        confirmButton.onPress();
      }
    } else {
      window.alert(`${title}\n\n${message || ""}`);
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
    isLocationTrackingActive,
  } = useAuth();
  const insets = useSafeAreaInsets();
  const [driverStats, setDriverStats] = useState<DriverStatsResponse | null>(
    null
  );
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
      console.error("Failed to load driver stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const getDriverInfo = () => ({
    name: user?.name || "배달원",
    id: user?.id ? `D${user.id.toString().padStart(6, "0")}` : "D000000",
    phone: user?.phone || user?.phoneNumber || "전화번호 없음",
    vehicle:
      user?.vehicleType && user?.vehicleNumber
        ? `${user.vehicleType} (${user.vehicleNumber})`
        : "차량 정보 없음",
    rating: driverStats?.averageRating || 0,
    totalDeliveries: driverStats?.totalDeliveries || 0,
    completedToday: driverStats?.todayDeliveries || 0,
    todayEarnings: driverStats?.todayEarnings || 0,
    totalEarnings: driverStats?.totalEarnings || 0,
    onlineHours: driverStats?.onlineHours || 0,
    completedDeliveries: driverStats?.completedDeliveries || 0,
  });

  const handleLogout = async () => {
    showAlert("로그아웃", "정말 로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        onPress: async () => {
          await logout();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    showAlert("프로필 수정", "프로필 수정 화면으로 이동합니다.");
  };

  const handleVehicleInfo = () => {
    showAlert("차량 정보", "차량 정보 관리 화면으로 이동합니다.");
  };

  const handleSettings = () => {
    showAlert("설정", "설정 화면으로 이동합니다.");
  };

  const handleHelp = () => {
    showAlert("도움말", "도움말 및 고객센터 화면으로 이동합니다.");
  };

  const handleStatusChange = () => {
    if (!user) return;

    const currentStatus = user.status || "OFFLINE";
    const statusOptions = [
      {
        label: "온라인",
        value: "ONLINE",
        description: "배달 요청을 받을 수 있습니다",
      },
      {
        label: "오프라인",
        value: "OFFLINE",
        description: "배달 요청을 받지 않습니다",
      },
      { label: "바쁨", value: "BUSY", description: "현재 배달 중입니다" },
      { label: "휴식", value: "BREAK", description: "잠시 휴식 중입니다" },
    ];

    // 웹에서는 단순화된 상태 변경
    if (Platform.OS === "web") {
      const currentLabel = statusOptions.find(
        (s) => s.value === currentStatus
      )?.label;
      const message = `현재 상태: ${currentLabel}\n\n변경할 상태:\n1. 온라인\n2. 오프라인\n3. 바쁨\n4. 휴식\n\n번호를 입력하세요 (1-4):`;
      const input = window.prompt(message);

      if (input) {
        const index = parseInt(input) - 1;
        if (index >= 0 && index < statusOptions.length) {
          const option = statusOptions[index];
          setIsUpdatingStatus(true);
          updateDriverStatus(option.value as any)
            .then((success) => {
              if (success) {
                showAlert(
                  "상태 변경",
                  `상태가 ${option.label}로 변경되었습니다.`
                );
              } else {
                showAlert("오류", "상태 변경에 실패했습니다.");
              }
            })
            .finally(() => {
              setIsUpdatingStatus(false);
            });
        }
      }
      return;
    }

    const buttons = statusOptions.map((option) => ({
      text: `${option.label} ${currentStatus === option.value ? "✓" : ""}`,
      onPress: async () => {
        if (currentStatus === option.value) return;

        setIsUpdatingStatus(true);
        try {
          const success = await updateDriverStatus(option.value as any);
          if (success) {
            showAlert("상태 변경", `상태가 ${option.label}로 변경되었습니다.`);
          } else {
            showAlert("오류", "상태 변경에 실패했습니다.");
          }
        } catch (error) {
          showAlert("오류", "네트워크 오류가 발생했습니다.");
        } finally {
          setIsUpdatingStatus(false);
        }
      },
    }));

    Alert.alert(
      "상태 변경",
      `현재 상태: ${
        statusOptions.find((s) => s.value === currentStatus)?.label
      }\n\n변경할 상태를 선택해주세요.`,
      [...buttons, { text: "취소", style: "cancel" }]
    );
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case "ONLINE":
        return "온라인";
      case "OFFLINE":
        return "오프라인";
      case "BUSY":
        return "바쁨";
      case "BREAK":
        return "휴식";
      default:
        return "알 수 없음";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "ONLINE":
        return "#00FF00";
      case "OFFLINE":
        return "#888888";
      case "BUSY":
        return "#FF9900";
      case "BREAK":
        return "#FFFF00";
      default:
        return "#CCCCCC";
    }
  };

  const handleLocationTrackingToggle = async () => {
    const isActive = isLocationTrackingActive();

    showAlert(
      "위치 추적",
      isActive
        ? "위치 추적을 중단하시겠습니까?"
        : "위치 추적을 시작하시겠습니까?\n\n온라인 상태일 때 자동으로 위치가 업데이트됩니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: isActive ? "중단" : "시작",
          onPress: async () => {
            try {
              if (isActive) {
                await stopLocationTracking();
                showAlert("위치 추적", "위치 추적이 중단되었습니다.");
              } else {
                const success = await startLocationTracking();
                if (success) {
                  showAlert("위치 추적", "위치 추적이 시작되었습니다.");
                } else {
                  showAlert("오류", "위치 권한을 확인해주세요.");
                }
              }
            } catch (error) {
              showAlert("오류", "위치 추적 설정 중 오류가 발생했습니다.");
            }
          },
        },
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
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.loginButtonText}>로그인하기</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const driverInfo = getDriverInfo();

  // 이니셜 추출 함수
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Text style={styles.profileImageText}>
              {getInitials(driverInfo.name)}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <ThemedText type="title" style={styles.driverName}>
              {driverInfo.name}
            </ThemedText>
            <Text style={styles.driverInfo}>ID: {driverInfo.id}</Text>
            <Text style={styles.driverInfo}>{driverInfo.phone}</Text>

            {/* 평점 바 */}
            <View style={styles.ratingContainer}>
              <View style={styles.ratingBarContainer}>
                <View
                  style={[
                    styles.ratingBar,
                    { width: `${(driverInfo.rating / 5) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.ratingText}>
                {driverInfo.rating.toFixed(1)}/5.0
              </Text>
            </View>

            {/* 상태 표시 */}
            <Pressable
              style={({ pressed }) => [
                styles.statusContainer,
                pressed && styles.statusPressed,
              ]}
              onPress={handleStatusChange}
              disabled={isUpdatingStatus}
            >
              <View
                style={[
                  styles.statusDot,
                  { opacity: user.status === "ONLINE" ? 1 : 0.3 },
                ]}
              />
              <Text style={styles.statusText}>
                {isUpdatingStatus
                  ? "업데이트 중..."
                  : getStatusText(user.status)}
              </Text>
            </Pressable>
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
              <Text style={styles.statNumber}>
                {driverInfo.totalDeliveries}
              </Text>
              <Text style={styles.statLabel}>총 배달</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{driverInfo.completedToday}</Text>
              <Text style={styles.statLabel}>오늘 완료</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {(driverInfo.todayEarnings / 10000).toFixed(0)}만
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
                <Text style={styles.statNumber}>
                  {driverInfo.completedDeliveries}
                </Text>
                <Text style={styles.statLabel}>완료 배달</Text>
              </View>
              <View style={styles.statDivider} />
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
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Pressable
                  onPress={loadDriverStats}
                  style={({ pressed }) => [
                    styles.refreshStats,
                    pressed && styles.refreshStatsPressed,
                  ]}
                >
                  <Text style={styles.refreshStatsText}>새로고침</Text>
                </Pressable>
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
          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
            ]}
            onPress={handleEditProfile}
          >
            <Text style={styles.menuText}>프로필 수정</Text>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
            ]}
            onPress={handleLocationTrackingToggle}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.menuText}>위치 추적</Text>
              <Text style={styles.menuSubtext}>
                {isLocationTrackingActive() ? "활성화됨" : "비활성화됨"}
              </Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
            ]}
            onPress={handleSettings}
          >
            <Text style={styles.menuText}>설정</Text>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
            ]}
            onPress={handleHelp}
          >
            <Text style={styles.menuText}>도움말 및 고객센터</Text>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
            ]}
          >
            <Text style={styles.menuText}>배달 통계</Text>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
            ]}
          >
            <Text style={styles.menuText}>수익 관리</Text>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>
        </View>

        {/* Clock Out / Status Button */}
        {user.status === 'ONLINE' || user.status === 'BUSY' ? (
          <TouchableOpacity
            style={styles.clockOutButton}
            onPress={async () => {
              Alert.alert(
                '퇴근하기',
                '정말 퇴근하시겠습니까?\n진행 중인 배달이 있다면 완료 후 퇴근해주세요.',
                [
                  { text: '취소', style: 'cancel' },
                  {
                    text: '퇴근',
                    style: 'destructive',
                    onPress: async () => {
                      const success = await updateDriverStatus('OFFLINE');
                      if (success) {
                        await stopLocationTracking();
                        Alert.alert('퇴근 완료', '수고하셨습니다!');
                      } else {
                        Alert.alert('오류', '퇴근 처리에 실패했습니다.');
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.clockOutButtonText}>퇴근하기</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.goToWorkButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.goToWorkButtonText}>출근하러 가기</Text>
          </TouchableOpacity>
        )}

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
    backgroundColor: "#000000",
    paddingHorizontal: 16,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111111",
    borderRadius: 16,
    padding: 24,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: "#222222",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
    borderWidth: 2,
    borderColor: "#3A3A3A",
  },
  profileImageText: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  driverInfo: {
    fontSize: 14,
    color: "#AAAAAA",
    marginBottom: 4,
    fontWeight: "400",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  ratingBarContainer: {
    width: 100,
    height: 6,
    backgroundColor: "#2A2A2A",
    borderRadius: 3,
    marginRight: 12,
    overflow: "hidden",
  },
  ratingBar: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  ratingLabel: {
    fontSize: 14,
    color: "#CCCCCC",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  statNumber: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#AAAAAA",
    fontWeight: "500",
  },
  infoCard: {
    backgroundColor: "#111111",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#222222",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  vehicleInfo: {
    fontSize: 16,
    color: "#AAAAAA",
    marginBottom: 16,
    fontWeight: "400",
  },
  editButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#444444",
  },
  editButtonText: {
    color: "#CCCCCC",
    fontSize: 14,
    fontWeight: "600",
  },
  menuSection: {
    backgroundColor: "#111111",
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#222222",
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
    backgroundColor: "#111111",
  },
  menuItemPressed: {
    backgroundColor: "#1A1A1A",
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: "#DDDDDD",
    fontWeight: "500",
  },
  menuSubtext: {
    fontSize: 13,
    color: "#888888",
    marginTop: 2,
    fontWeight: "400",
  },
  menuArrow: {
    fontSize: 24,
    color: "#666666",
    fontWeight: "300",
  },
  logoutButton: {
    backgroundColor: "#1A1A1A",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    color: "#AAAAAA",
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  loginButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#2A2A2A",
    borderWidth: 1,
    borderColor: "#3A3A3A",
  },
  statusPressed: {
    opacity: 0.7,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: "#FFFFFF",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#AAAAAA",
    marginTop: 12,
    fontWeight: "500",
  },
  additionalStatsContainer: {
    backgroundColor: "#111111",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#222222",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#333333",
    marginHorizontal: 16,
  },
  refreshStats: {
    backgroundColor: "#2A2A2A",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3A3A3A",
  },
  refreshStatsPressed: {
    backgroundColor: "#333333",
  },
  refreshStatsText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  clockOutButton: {
    backgroundColor: "#DD3333",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EE4444",
  },
  clockOutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  goToWorkButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  goToWorkButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
