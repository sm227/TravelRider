import { authService } from "@/services/authService";
import { driverService } from "@/services/driverService";
import { locationService } from "@/services/locationService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";

export interface User {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone?: string;
  role: "driver" | "admin" | "user";
  licenseNumber?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  status?: "ONLINE" | "OFFLINE" | "BUSY" | "BREAK";
  currentLatitude?: number;
  currentLongitude?: number;
  phoneNumber?: string;
  lastLocationUpdate?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  updateDriverStatus: (
    status: "ONLINE" | "OFFLINE" | "BUSY" | "BREAK"
  ) => Promise<boolean>;
  refreshProfile: () => Promise<boolean>;
  startLocationTracking: () => Promise<boolean>;
  stopLocationTracking: () => Promise<void>;
  isLocationTrackingActive: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 플랫폼별 API URL 설정
const getApiBaseUrl = () => {
  if (Platform.OS === "android") {
    return "http://1.236.13.63:8888/api"; // Android 에뮬레이터
  } else if (Platform.OS === "ios") {
    return "http://1.236.13.63:8888/api"; // iOS - 컴퓨터의 실제 IP
  } else {
    return "http://localhost:8080/api"; // 웹
  }
};

const API_BASE_URL = getApiBaseUrl();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      const userData = await AsyncStorage.getItem("userData");

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Set default axios header
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // 앱이 다시 시작될 때 위치 추적 복원
        await locationService.restoreLocationTracking();
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthData = async () => {
    try {
      await AsyncStorage.multiRemove(["authToken", "userData"]);
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);
    } catch (error) {
      console.error("Error clearing auth data:", error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      // 배달원 로그인 API 시도
      const driverResponse = await driverService.login({ email, password });

      if (driverResponse.success && driverResponse.data) {
        const driverData = driverResponse.data;

        // DriverResponse를 User 형태로 매핑
        const userData: User = {
          id: driverData.id,
          userId: driverData.userId,
          name: driverData.name,
          email: driverData.email,
          phone: driverData.phoneNumber,
          role: "driver",
          licenseNumber: driverData.licenseNumber,
          vehicleType: driverData.vehicleType,
          vehicleNumber: driverData.vehicleNumber,
          status: driverData.status || "OFFLINE",
          currentLatitude: driverData.currentLatitude,
          currentLongitude: driverData.currentLongitude,
          phoneNumber: driverData.phoneNumber,
          lastLocationUpdate: driverData.lastLocationUpdate,
          createdAt: driverData.createdAt,
        };

        // JWT 토큰은 응답에서 받아야 함
        const token =
          driverResponse.data.token ||
          `driver_token_${driverData.id}_${Date.now()}`;

        await AsyncStorage.setItem("authToken", token);
        await AsyncStorage.setItem("userData", JSON.stringify(userData));
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        setUser(userData);

        // 로그인 후 자동으로 ONLINE 상태로 변경
        if (userData.status === "OFFLINE") {
          await updateDriverStatus("ONLINE");
        }

        return true;
      }

      // 배달원 로그인 실패 시, 일반 사용자 로그인 시도 (fallback)
      const response = await authService.login({ email, password });

      if (response.success && response.data) {
        const { token, userId, email: userEmail, name, role } = response.data;

        // User 객체 생성
        const userData: User = {
          id: userId || 0,
          userId: userId || 0,
          name: name || email.split("@")[0],
          email: userEmail || email,
          role: (role?.toLowerCase() as "user" | "driver" | "admin") || "user",
          status: "OFFLINE",
        };

        // 토큰과 사용자 정보 저장
        const authToken = token || `user_token_${userId}_${Date.now()}`;
        await AsyncStorage.setItem("authToken", authToken);
        await AsyncStorage.setItem("userData", JSON.stringify(userData));
        axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;

        setUser(userData);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);

      // 로그아웃 시 위치 추적 중지
      await locationService.stopLocationTracking();

      await clearAuthData();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      if (!user) return false;

      setIsLoading(true);

      const response = await axios.put(
        `${API_BASE_URL}/users/${user.userId}`,
        userData
      );

      if (response.data && response.data.success) {
        const updatedUser = { ...user, ...userData };
        await AsyncStorage.setItem("userData", JSON.stringify(updatedUser));
        setUser(updatedUser);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Update profile error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateDriverStatus = async (
    status: "ONLINE" | "OFFLINE" | "BUSY" | "BREAK"
  ): Promise<boolean> => {
    try {
      if (!user) return false;

      setIsLoading(true);

      const response = await driverService.updateStatus(user.id, { status });

      if (response.success) {
        const updatedUser = { ...user, status };
        await AsyncStorage.setItem("userData", JSON.stringify(updatedUser));
        setUser(updatedUser);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Update driver status error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async (): Promise<boolean> => {
    try {
      if (!user) return false;

      const response = await driverService.getProfile(user.id);

      if (response.success && response.data) {
        const driverData = response.data;
        const userData: User = {
          ...user,
          name: driverData.name,
          email: driverData.email,
          phone: driverData.phoneNumber,
          licenseNumber: driverData.licenseNumber,
          vehicleType: driverData.vehicleType,
          vehicleNumber: driverData.vehicleNumber,
          status: driverData.status,
          currentLatitude: driverData.currentLatitude,
          currentLongitude: driverData.currentLongitude,
          phoneNumber: driverData.phoneNumber,
          lastLocationUpdate: driverData.lastLocationUpdate,
        };

        await AsyncStorage.setItem("userData", JSON.stringify(userData));
        setUser(userData);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Refresh profile error:", error);
      return false;
    }
  };

  const startLocationTracking = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const success = await locationService.startLocationTracking(user.id);
      return success;
    } catch (error) {
      console.error("Start location tracking error:", error);
      return false;
    }
  };

  const stopLocationTracking = async (): Promise<void> => {
    try {
      await locationService.stopLocationTracking();
    } catch (error) {
      console.error("Stop location tracking error:", error);
    }
  };

  const isLocationTrackingActive = (): boolean => {
    return locationService.isLocationTrackingActive();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    updateProfile,
    updateDriverStatus,
    refreshProfile,
    startLocationTracking,
    stopLocationTracking,
    isLocationTrackingActive,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
