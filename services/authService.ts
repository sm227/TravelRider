import api, { ApiResponse } from './api';

// 회원가입 요청 데이터
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'USER' | 'PARTNER' | 'WAIT';
}

// 로그인 요청 데이터
export interface LoginRequest {
  email: string;
  password: string;
}

// 라이더 로그인 응답 데이터 (API 가이드 기반)
export interface RiderLoginResponse {
  userId: number;
  name: string;
  email: string;
  role: string;
  driverId: number;
  vehicleNumber: string;
  phoneNumber: string;
  driverStatus: 'OFFLINE' | 'ONLINE' | 'BUSY' | 'BREAK';
  accessToken: string;
  refreshToken: string;
}

// 기존 호환성을 위한 LoginResponse (deprecated)
export interface LoginResponse {
  token?: string;
  userId?: number;
  email?: string;
  name?: string;
  role?: string;
}

// 회원가입 API
export const register = async (data: RegisterRequest): Promise<ApiResponse> => {
  try {
    const response = await api.post<ApiResponse>('/users/register', data);
    return response.data;
  } catch (error: any) {
    console.error('Register API error:', error);
    return {
      success: false,
      message: error.response?.data?.message || '회원가입에 실패했습니다.',
      data: null
    };
  }
};

// 라이더 로그인 API
export const riderLogin = async (data: LoginRequest): Promise<ApiResponse<RiderLoginResponse>> => {
  try {
    console.log('Rider login request data:', data);
    const response = await api.post<ApiResponse<RiderLoginResponse>>('/riders/login', data);
    console.log('Rider login response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Rider login API error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);

    // API 가이드에 따른 에러 처리
    const status = error.response?.status;
    let message = '로그인에 실패했습니다.';

    if (status === 401) {
      message = '이메일 또는 비밀번호가 일치하지 않습니다.';
    } else if (status === 403) {
      message = '승인되지 않은 라이더입니다. 관리자의 승인을 기다려주세요.';
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    }

    return {
      success: false,
      message,
      data: {} as RiderLoginResponse
    };
  }
};

// 기존 로그인 API (deprecated, riderLogin 사용 권장)
export const login = async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  try {
    console.log('Login request data:', data);
    const response = await api.post<ApiResponse<LoginResponse>>('/users/login', data);
    console.log('Login response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Login API error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    return {
      success: false,
      message: error.response?.data?.message || '로그인에 실패했습니다.',
      data: {} as LoginResponse
    };
  }
};

// 라이더 회원가입 요청 데이터
export interface RiderRegisterRequest {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  vehicleNumber: string;
  licenseNumber?: string;
}

// 라이더 회원가입 응답 데이터
export interface RiderRegisterResponse {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  phoneNumber: string;
  vehicleNumber: string;
  licenseNumber: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// 라이더 회원가입 API
export const riderRegister = async (data: RiderRegisterRequest): Promise<ApiResponse<RiderRegisterResponse>> => {
  try {
    console.log('Rider register request data:', data);
    const response = await api.post<ApiResponse<RiderRegisterResponse>>('/riders/register', data);
    console.log('Rider register response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Rider register API error:', error);
    console.error('Error response:', error.response?.data);

    const message = error.response?.data?.message || '회원가입에 실패했습니다.';

    return {
      success: false,
      message,
      data: {} as RiderRegisterResponse
    };
  }
};

export const authService = {
  register,
  login,
  riderLogin,
  riderRegister
};
