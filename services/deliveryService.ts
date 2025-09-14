import api, { ApiResponse } from './api';

export interface DeliveryResponse {
  id: number;
  userId: number;
  reservationId: number;
  pickupAddress: string;
  deliveryAddress: string;
  itemDescription: string;
  weight: number;
  requestedAt: string;
  status: DeliveryStatus;
  trackingNumber: string;
  estimatedDeliveryTime: string;
}

export type DeliveryStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'CANCELLED';

export interface DeliveryRequest {
  userId: number;
  reservationId: number;
  pickupAddress: string;
  deliveryAddress: string;
  itemDescription: string;
  weight: number;
}

export interface PhotoUploadRequest {
  reservationNumber: string;
  fileName: string;
  base64Data: string;
}

export interface PhotoUploadResponse {
  fileName: string;
  filePath: string;
  thumbnailPath: string;
  fileSize: number;
}

export const deliveryService = {
  // 모든 배달 목록 조회
  getAllDeliveries: async (): Promise<ApiResponse<DeliveryResponse[]>> => {
    const response = await api.get('/deliveries');
    return response.data;
  },

  // 특정 배달원의 배달 목록
  getDriverDeliveries: async (driverId: number): Promise<ApiResponse<DeliveryResponse[]>> => {
    const response = await api.get(`/deliveries/driver/${driverId}`);
    return response.data;
  },

  // 배달 상세 정보
  getDeliveryById: async (id: number): Promise<ApiResponse<DeliveryResponse>> => {
    const response = await api.get(`/deliveries/${id}`);
    return response.data;
  },

  // 배달 상태 변경
  updateDeliveryStatus: async (
    id: number,
    status: DeliveryStatus
  ): Promise<ApiResponse<string>> => {
    const response = await api.put(`/deliveries/${id}/status`, null, {
      params: { status }
    });
    return response.data;
  },

  // 배달원 배정
  assignDriver: async (
    deliveryId: number,
    driverId: number
  ): Promise<ApiResponse<string>> => {
    const response = await api.put(`/deliveries/${deliveryId}/assign`, null, {
      params: { driverId }
    });
    return response.data;
  },

  // 배달 신청
  createDelivery: async (deliveryData: DeliveryRequest): Promise<ApiResponse> => {
    const response = await api.post('/deliveries', deliveryData);
    return response.data;
  },

  // 예약별 배달 정보
  getDeliveriesByReservation: async (reservationId: number): Promise<ApiResponse> => {
    const response = await api.get(`/deliveries/reservation/${reservationId}`);
    return response.data;
  },

  // 배달 완료 사진 업로드
  uploadPhoto: async (photoData: PhotoUploadRequest): Promise<ApiResponse<PhotoUploadResponse>> => {
    const response = await api.post('/storage/upload-photo', photoData);
    return response.data;
  },

  // 파일로 사진 업로드 (FormData 사용)
  uploadPhotoFile: async (
    reservationNumber: string,
    file: FormData
  ): Promise<ApiResponse<PhotoUploadResponse>> => {
    const response = await api.post('/storage/upload-photo-file', file, {
      params: { reservationNumber },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

export default deliveryService;