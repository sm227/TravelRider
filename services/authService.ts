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

// 로그인 응답 데이터 (API 문서 기반)
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

// 로그인 API
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

export const authService = {
  register,
  login
};
