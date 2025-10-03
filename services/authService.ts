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

// 카카오 로그인/회원가입 통합 함수
export const kakaoLoginOrRegister = async (
  kakaoEmail: string,
  kakaoName: string
): Promise<ApiResponse<LoginResponse>> => {
  // 카카오 이메일로 고정 비밀번호 생성 (실제로는 서버에서 소셜 로그인 처리 권장)
  const kakaoPassword = `kakao_${kakaoEmail}_secure`;

  // 1. 로그인 시도
  const loginResult = await login({
    email: kakaoEmail,
    password: kakaoPassword
  });

  // 로그인 성공 시 반환
  if (loginResult.success) {
    return loginResult;
  }

  // 2. 로그인 실패 시 회원가입 시도
  const registerResult = await register({
    name: kakaoName,
    email: kakaoEmail,
    password: kakaoPassword,
    role: 'USER'
  });

  // 회원가입 실패 시 반환
  if (!registerResult.success) {
    return {
      success: false,
      message: registerResult.message,
      data: {} as LoginResponse
    };
  }

  // 3. 회원가입 성공 후 재로그인
  const reLoginResult = await login({
    email: kakaoEmail,
    password: kakaoPassword
  });

  return reLoginResult;
};

export const authService = {
  register,
  login,
  kakaoLoginOrRegister
};
