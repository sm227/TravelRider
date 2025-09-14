import api, { ApiResponse } from './api';

export interface DriverLoginRequest {
  email: string;
  password: string;
}

export interface DriverResponse {
  id: number;
  userId: number;
  name: string;
  email: string;
  licenseNumber: string;
  vehicleType: string;
  vehicleNumber: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'BREAK';
  currentLatitude: number;
  currentLongitude: number;
  phoneNumber: string;
  lastLocationUpdate: string;
  createdAt: string;
}

export interface DriverStatsResponse {
  driverId: number;
  driverName: string;
  totalDeliveries: number;
  completedDeliveries: number;
  todayDeliveries: number;
  totalEarnings: number;
  todayEarnings: number;
  averageRating: number;
  onlineHours: number;
  lastActiveAt: string;
}

export interface DriverLocationUpdateRequest {
  latitude: number;
  longitude: number;
  speed?: number;
  bearing?: number;
  accuracy?: number;
}

export interface DriverStatusUpdateRequest {
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'BREAK';
}

export const driverService = {
  login: async (credentials: DriverLoginRequest): Promise<ApiResponse<DriverResponse>> => {
    const response = await api.post('/drivers/login', credentials);
    return response.data;
  },

  getProfile: async (driverId: number): Promise<ApiResponse<DriverResponse>> => {
    const response = await api.get(`/drivers/${driverId}/profile`);
    return response.data;
  },

  getStats: async (driverId: number): Promise<ApiResponse<DriverStatsResponse>> => {
    const response = await api.get(`/drivers/${driverId}/stats`);
    return response.data;
  },

  updateLocation: async (
    driverId: number,
    locationData: DriverLocationUpdateRequest
  ): Promise<ApiResponse<string>> => {
    const response = await api.put(`/drivers/${driverId}/location`, locationData);
    return response.data;
  },

  updateStatus: async (
    driverId: number,
    statusData: DriverStatusUpdateRequest
  ): Promise<ApiResponse<string>> => {
    const response = await api.put(`/drivers/${driverId}/status`, statusData);
    return response.data;
  },

  getOnlineDrivers: async (): Promise<ApiResponse<DriverResponse[]>> => {
    const response = await api.get('/drivers/online');
    return response.data;
  }
};

export default driverService;