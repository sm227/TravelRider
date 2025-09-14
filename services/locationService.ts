import * as Location from 'expo-location';
import { driverService } from './driverService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LocationData {
  latitude: number;
  longitude: number;
  speed?: number;
  bearing?: number;
  accuracy?: number;
}

class LocationService {
  private locationInterval: NodeJS.Timeout | null = null;
  private isTracking: boolean = false;
  private lastLocationUpdate: number = 0;
  private readonly UPDATE_INTERVAL = 30000; // 30초마다 업데이트
  private readonly MIN_UPDATE_DISTANCE = 50; // 50미터 이상 이동했을 때 업데이트

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        console.warn('Location permission not granted');
        return false;
      }

      // 백그라운드 권한도 요청 (선택사항)
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

      if (backgroundStatus !== 'granted') {
        console.warn('Background location permission not granted');
        // 백그라운드 권한이 없어도 포그라운드에서는 작동
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000, // 10초 이내 캐시된 위치 사용
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        speed: location.coords.speed || undefined,
        bearing: location.coords.heading || undefined,
        accuracy: location.coords.accuracy || undefined,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async updateDriverLocation(driverId: number, locationData: LocationData): Promise<boolean> {
    try {
      const response = await driverService.updateLocation(driverId, locationData);
      return response.success;
    } catch (error) {
      console.error('Error updating driver location:', error);
      return false;
    }
  }

  async startLocationTracking(driverId: number): Promise<boolean> {
    if (this.isTracking) {
      console.log('Location tracking already started');
      return true;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      return false;
    }

    try {
      this.isTracking = true;

      // 즉시 한 번 업데이트
      await this.performLocationUpdate(driverId);

      // 주기적 업데이트 시작
      this.locationInterval = setInterval(() => {
        this.performLocationUpdate(driverId);
      }, this.UPDATE_INTERVAL);

      // AsyncStorage에 트래킹 상태 저장
      await AsyncStorage.setItem('locationTrackingActive', 'true');
      await AsyncStorage.setItem('locationTrackingDriverId', driverId.toString());

      console.log('Location tracking started for driver:', driverId);
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      this.isTracking = false;
      return false;
    }
  }

  async stopLocationTracking(): Promise<void> {
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
      this.locationInterval = null;
    }

    this.isTracking = false;

    // AsyncStorage에서 트래킹 상태 제거
    await AsyncStorage.removeItem('locationTrackingActive');
    await AsyncStorage.removeItem('locationTrackingDriverId');

    console.log('Location tracking stopped');
  }

  private async performLocationUpdate(driverId: number): Promise<void> {
    try {
      const currentTime = Date.now();

      // 너무 자주 업데이트하지 않도록 제한
      if (currentTime - this.lastLocationUpdate < this.UPDATE_INTERVAL) {
        return;
      }

      const locationData = await this.getCurrentLocation();
      if (!locationData) {
        return;
      }

      // 이전 위치와 비교해서 충분히 이동했을 때만 업데이트
      const lastLocation = await this.getLastKnownLocation();
      if (lastLocation && this.calculateDistance(lastLocation, locationData) < this.MIN_UPDATE_DISTANCE) {
        return;
      }

      const success = await this.updateDriverLocation(driverId, locationData);

      if (success) {
        this.lastLocationUpdate = currentTime;
        await this.saveLastKnownLocation(locationData);
        console.log('Location updated:', locationData);
      }
    } catch (error) {
      console.error('Error in performLocationUpdate:', error);
    }
  }

  private async saveLastKnownLocation(location: LocationData): Promise<void> {
    try {
      await AsyncStorage.setItem('lastKnownLocation', JSON.stringify(location));
    } catch (error) {
      console.error('Error saving last known location:', error);
    }
  }

  private async getLastKnownLocation(): Promise<LocationData | null> {
    try {
      const locationString = await AsyncStorage.getItem('lastKnownLocation');
      return locationString ? JSON.parse(locationString) : null;
    } catch (error) {
      console.error('Error getting last known location:', error);
      return null;
    }
  }

  private calculateDistance(loc1: LocationData, loc2: LocationData): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = loc1.latitude * Math.PI / 180;
    const φ2 = loc2.latitude * Math.PI / 180;
    const Δφ = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const Δλ = (loc2.longitude - loc1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  async restoreLocationTracking(): Promise<boolean> {
    try {
      const isActive = await AsyncStorage.getItem('locationTrackingActive');
      const driverIdString = await AsyncStorage.getItem('locationTrackingDriverId');

      if (isActive === 'true' && driverIdString) {
        const driverId = parseInt(driverIdString, 10);
        return await this.startLocationTracking(driverId);
      }

      return false;
    } catch (error) {
      console.error('Error restoring location tracking:', error);
      return false;
    }
  }

  isLocationTrackingActive(): boolean {
    return this.isTracking;
  }
}

export const locationService = new LocationService();
export default locationService;