# TravelLight 라이더 앱 API 가이드

React Native 앱 개발을 위한 API 사용 가이드입니다.

## 📋 목차
- [기본 정보](#기본-정보)
- [인증 시스템](#인증-시스템)
- [API 엔드포인트](#api-엔드포인트)
  - [1. 라이더 회원가입](#1-라이더-회원가입)
  - [2. 라이더 로그인](#2-라이더-로그인)
  - [3. 신청 상태 조회](#3-신청-상태-조회)
  - [4. 토큰 갱신](#4-토큰-갱신)
- [에러 처리](#에러-처리)
- [React Native 구현 예제](#react-native-구현-예제)

---

## 기본 정보

### Base URL
```
개발: http://localhost:8080
운영: https://api.travelight.co.kr (또는 실제 운영 서버 주소)
```

### 공통 헤더
```http
Content-Type: application/json
Accept: application/json
```

### 인증이 필요한 요청
```http
Authorization: Bearer {accessToken}
```

### 응답 형식
모든 API는 다음과 같은 공통 응답 형식을 사용합니다:

```json
{
  "success": true,
  "message": "성공 메시지",
  "data": {
    // 실제 데이터
  }
}
```

에러 응답:
```json
{
  "success": false,
  "message": "에러 메시지",
  "data": null
}
```

---

## 인증 시스템

TravelLight는 JWT(JSON Web Token) 기반 인증을 사용합니다.

### 토큰 종류
1. **Access Token**: API 요청 시 사용 (유효기간: 1시간)
2. **Refresh Token**: Access Token 갱신 시 사용 (유효기간: 7일)

### 토큰 저장
React Native에서는 `@react-native-async-storage/async-storage` 또는 `react-native-keychain`을 사용하여 토큰을 안전하게 저장합니다.

```javascript
// AsyncStorage 예제
import AsyncStorage from '@react-native-async-storage/async-storage';

// 토큰 저장
await AsyncStorage.setItem('accessToken', accessToken);
await AsyncStorage.setItem('refreshToken', refreshToken);

// 토큰 불러오기
const accessToken = await AsyncStorage.getItem('accessToken');
```

---

## API 엔드포인트

### 1. 라이더 회원가입

라이더가 가입 신청을 합니다. 관리자 승인 후 로그인이 가능합니다.

**Endpoint**
```http
POST /api/riders/register
```

**Request Body**
```json
{
  "name": "홍길동",
  "email": "rider@example.com",
  "password": "securePassword123!",
  "phoneNumber": "010-1234-5678",
  "vehicleNumber": "12가3456",
  "licenseNumber": "11-12-345678-90"
}
```

**Request Fields**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | ✅ | 이름 |
| email | string | ✅ | 이메일 (로그인 ID로 사용) |
| password | string | ✅ | 비밀번호 (최소 8자 권장) |
| phoneNumber | string | ✅ | 전화번호 (010-1234-5678 형식) |
| vehicleNumber | string | ✅ | 차량번호 (12가3456 형식) |
| licenseNumber | string | ❌ | 운전면허번호 (선택) |

**Response (Success - 200)**
```json
{
  "success": true,
  "message": "회원가입 신청이 완료되었습니다. 관리자의 승인을 기다려주세요.",
  "data": {
    "id": 1,
    "userId": 123,
    "userName": "홍길동",
    "userEmail": "rider@example.com",
    "phoneNumber": "010-1234-5678",
    "vehicleNumber": "12가3456",
    "licenseNumber": "11-12-345678-90",
    "status": "PENDING",
    "rejectionReason": null,
    "approvedAt": null,
    "rejectedAt": null,
    "createdAt": "2025-10-25T22:30:00",
    "updatedAt": "2025-10-25T22:30:00"
  }
}
```

**Response (Error - 400)**
```json
{
  "success": false,
  "message": "이미 사용 중인 이메일입니다.",
  "data": null
}
```

**상태 코드**
- `200 OK`: 회원가입 성공
- `400 Bad Request`: 이메일 중복 또는 잘못된 요청
- `500 Internal Server Error`: 서버 오류

---

### 2. 라이더 로그인

승인된 라이더만 로그인할 수 있습니다.

**Endpoint**
```http
POST /api/riders/login
```

**Request Body**
```json
{
  "email": "rider@example.com",
  "password": "securePassword123!"
}
```

**Request Fields**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| email | string | ✅ | 이메일 |
| password | string | ✅ | 비밀번호 |

**Response (Success - 200)**
```json
{
  "success": true,
  "message": "로그인이 완료되었습니다.",
  "data": {
    "userId": 123,
    "name": "홍길동",
    "email": "rider@example.com",
    "role": "USER",
    "driverId": 45,
    "vehicleNumber": "12가3456",
    "phoneNumber": "010-1234-5678",
    "driverStatus": "OFFLINE",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response Fields**
| 필드 | 타입 | 설명 |
|------|------|------|
| userId | number | 사용자 ID |
| name | string | 이름 |
| email | string | 이메일 |
| role | string | 역할 (USER) |
| driverId | number | 드라이버 ID |
| vehicleNumber | string | 차량번호 |
| phoneNumber | string | 전화번호 |
| driverStatus | string | 드라이버 상태 (OFFLINE, ONLINE, BUSY, BREAK) |
| accessToken | string | 액세스 토큰 (API 요청 시 사용) |
| refreshToken | string | 리프레시 토큰 (토큰 갱신 시 사용) |

**Response (Error - 401)**
```json
{
  "success": false,
  "message": "이메일 또는 비밀번호가 일치하지 않습니다.",
  "data": null
}
```

**Response (Error - 403)**
```json
{
  "success": false,
  "message": "승인되지 않은 라이더입니다. 관리자의 승인을 기다려주세요.",
  "data": null
}
```

**상태 코드**
- `200 OK`: 로그인 성공
- `401 Unauthorized`: 인증 실패 (이메일 또는 비밀번호 불일치)
- `403 Forbidden`: 승인되지 않은 라이더
- `500 Internal Server Error`: 서버 오류

---

### 3. 신청 상태 조회

현재 로그인한 사용자의 라이더 신청 상태를 조회합니다.

**Endpoint**
```http
GET /api/riders/application/status?userId={userId}
```

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| userId | number | ✅ | 사용자 ID (로그인 응답의 userId 사용) |

**Headers**
```http
Authorization: Bearer {accessToken}
```

**Response (Success - 200)**
```json
{
  "success": true,
  "message": "신청 상태를 조회했습니다.",
  "data": {
    "id": 1,
    "userId": 123,
    "userName": "홍길동",
    "userEmail": "rider@example.com",
    "phoneNumber": "010-1234-5678",
    "vehicleNumber": "12가3456",
    "licenseNumber": "11-12-345678-90",
    "status": "PENDING",
    "rejectionReason": null,
    "approvedAt": null,
    "rejectedAt": null,
    "createdAt": "2025-10-25T22:30:00",
    "updatedAt": "2025-10-25T22:30:00"
  }
}
```

**신청 상태 (status)**
| 상태 | 설명 |
|------|------|
| PENDING | 승인 대기중 |
| APPROVED | 승인됨 |
| REJECTED | 거절됨 |

**Response (Error - 404)**
```json
{
  "success": false,
  "message": "신청 내역을 찾을 수 없습니다.",
  "data": null
}
```

**상태 코드**
- `200 OK`: 조회 성공
- `401 Unauthorized`: 인증 실패 (토큰 없음 또는 만료)
- `404 Not Found`: 신청 내역 없음
- `500 Internal Server Error`: 서버 오류

---

### 4. 토큰 갱신

Access Token이 만료되었을 때 Refresh Token을 사용하여 새로운 토큰을 발급받습니다.

**Endpoint**
```http
POST /api/auth/refresh
```

**Headers**
```http
Cookie: refreshToken={refreshToken}
```

또는 Request Body:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success - 200)**
```json
{
  "success": true,
  "message": "토큰이 갱신되었습니다.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error - 401)**
```json
{
  "success": false,
  "message": "유효하지 않은 Refresh Token입니다.",
  "data": null
}
```

**상태 코드**
- `200 OK`: 토큰 갱신 성공
- `401 Unauthorized`: 유효하지 않은 Refresh Token
- `500 Internal Server Error`: 서버 오류

---

## 에러 처리

### 공통 에러 응답 형식
```json
{
  "success": false,
  "message": "에러 메시지",
  "data": null
}
```

### HTTP 상태 코드별 처리 방법

| 상태 코드 | 설명 | 처리 방법 |
|----------|------|----------|
| 200 | 성공 | 정상 처리 |
| 400 | 잘못된 요청 | 입력값 검증 메시지 표시 |
| 401 | 인증 실패 | 토큰 갱신 시도 또는 로그인 화면으로 이동 |
| 403 | 권한 없음 | "승인 대기중" 메시지 표시 |
| 404 | 리소스 없음 | "데이터를 찾을 수 없음" 메시지 표시 |
| 500 | 서버 오류 | "서버 오류" 메시지 표시 및 재시도 옵션 제공 |

### React Native에서의 에러 처리 예제

```javascript
try {
  const response = await api.post('/riders/login', loginData);

  if (response.data.success) {
    // 성공 처리
    const { accessToken, refreshToken } = response.data.data;
    await saveTokens(accessToken, refreshToken);
    navigation.navigate('Home');
  } else {
    // 실패 처리
    Alert.alert('로그인 실패', response.data.message);
  }
} catch (error) {
  if (error.response) {
    // 서버 응답이 있는 경우
    const status = error.response.status;
    const message = error.response.data?.message || '알 수 없는 오류가 발생했습니다.';

    switch (status) {
      case 401:
        Alert.alert('인증 실패', '이메일 또는 비밀번호를 확인해주세요.');
        break;
      case 403:
        Alert.alert('승인 대기중', '관리자의 승인을 기다려주세요.');
        break;
      case 500:
        Alert.alert('서버 오류', '잠시 후 다시 시도해주세요.');
        break;
      default:
        Alert.alert('오류', message);
    }
  } else if (error.request) {
    // 요청은 전송되었으나 응답이 없는 경우
    Alert.alert('네트워크 오류', '인터넷 연결을 확인해주세요.');
  } else {
    // 요청 설정 중 오류 발생
    Alert.alert('오류', error.message);
  }
}
```

---

## React Native 구현 예제

### 1. API 클라이언트 설정 (api.js)

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:8080/api'; // 개발 환경
// const API_BASE_URL = 'https://api.travelight.co.kr/api'; // 운영 환경

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10초
});

// 요청 인터셉터: Access Token 추가
api.interceptors.request.use(
  async (config) => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 토큰 만료 시 자동 갱신
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고 아직 재시도하지 않은 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 토큰 갱신
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        if (response.data.success) {
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          // 새 토큰 저장
          await AsyncStorage.setItem('accessToken', accessToken);
          await AsyncStorage.setItem('refreshToken', newRefreshToken);

          // 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // 토큰 갱신 실패 시 로그아웃 처리
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        // 로그인 화면으로 이동하는 로직 추가
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 2. 인증 서비스 (authService.js)

```javascript
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  // 라이더 회원가입
  register: async (data) => {
    try {
      const response = await api.post('/riders/register', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 라이더 로그인
  login: async (email, password) => {
    try {
      const response = await api.post('/riders/login', {
        email,
        password,
      });

      if (response.data.success) {
        const { accessToken, refreshToken, ...userData } = response.data.data;

        // 토큰 저장
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);

        // 사용자 정보 저장
        await AsyncStorage.setItem('userData', JSON.stringify(userData));

        return response.data;
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 로그아웃
  logout: async () => {
    try {
      // 토큰 및 사용자 정보 삭제
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('userData');

      // 서버에 로그아웃 알림 (선택사항)
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  // 신청 상태 조회
  getApplicationStatus: async (userId) => {
    try {
      const response = await api.get(`/riders/application/status?userId=${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 현재 사용자 정보 가져오기
  getCurrentUser: async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // 로그인 상태 확인
  isAuthenticated: async () => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    return !!accessToken;
  },
};

export default authService;
```

### 3. 회원가입 화면 (RegisterScreen.js)

```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import authService from '../services/authService';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    vehicleNumber: '',
    licenseNumber: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return false;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      Alert.alert('알림', '올바른 이메일을 입력해주세요.');
      return false;
    }

    if (formData.password.length < 8) {
      Alert.alert('알림', '비밀번호는 8자 이상이어야 합니다.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('알림', '비밀번호가 일치하지 않습니다.');
      return false;
    }

    if (!formData.phoneNumber.trim()) {
      Alert.alert('알림', '전화번호를 입력해주세요.');
      return false;
    }

    if (!formData.vehicleNumber.trim()) {
      Alert.alert('알림', '차량번호를 입력해주세요.');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await authService.register(registerData);

      if (response.success) {
        Alert.alert(
          '회원가입 완료',
          '회원가입 신청이 완료되었습니다.\n관리자의 승인 후 로그인이 가능합니다.',
          [
            {
              text: '확인',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert('회원가입 실패', response.message);
      }
    } catch (error) {
      console.error('Register error:', error);
      const message =
        error.response?.data?.message || '회원가입 중 오류가 발생했습니다.';
      Alert.alert('오류', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>라이더 회원가입</Text>

        <TextInput
          style={styles.input}
          placeholder="이름"
          value={formData.name}
          onChangeText={(value) => handleInputChange('name', value)}
        />

        <TextInput
          style={styles.input}
          placeholder="이메일"
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
        />

        <TextInput
          style={styles.input}
          placeholder="비밀번호 (8자 이상)"
          secureTextEntry
          value={formData.password}
          onChangeText={(value) => handleInputChange('password', value)}
        />

        <TextInput
          style={styles.input}
          placeholder="비밀번호 확인"
          secureTextEntry
          value={formData.confirmPassword}
          onChangeText={(value) => handleInputChange('confirmPassword', value)}
        />

        <TextInput
          style={styles.input}
          placeholder="전화번호 (010-1234-5678)"
          keyboardType="phone-pad"
          value={formData.phoneNumber}
          onChangeText={(value) => handleInputChange('phoneNumber', value)}
        />

        <TextInput
          style={styles.input}
          placeholder="차량번호 (12가3456)"
          autoCapitalize="characters"
          value={formData.vehicleNumber}
          onChangeText={(value) => handleInputChange('vehicleNumber', value)}
        />

        <TextInput
          style={styles.input}
          placeholder="운전면허번호 (선택)"
          value={formData.licenseNumber}
          onChangeText={(value) => handleInputChange('licenseNumber', value)}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '처리 중...' : '회원가입'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>이미 계정이 있으신가요? 로그인</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  linkButton: {
    marginTop: 20,
  },
  linkText: {
    color: '#3b82f6',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default RegisterScreen;
```

### 4. 로그인 화면 (LoginScreen.js)

```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import authService from '../services/authService';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login(email, password);

      if (response.success) {
        // 로그인 성공 시 메인 화면으로 이동
        navigation.replace('Main');
      } else {
        Alert.alert('로그인 실패', response.message);
      }
    } catch (error) {
      console.error('Login error:', error);

      const status = error.response?.status;
      const message = error.response?.data?.message;

      if (status === 401) {
        Alert.alert('로그인 실패', '이메일 또는 비밀번호를 확인해주세요.');
      } else if (status === 403) {
        Alert.alert(
          '승인 대기중',
          '관리자의 승인을 기다려주세요.\n신청 상태를 확인하시겠습니까?',
          [
            { text: '취소', style: 'cancel' },
            {
              text: '확인',
              onPress: () => navigation.navigate('ApplicationStatus'),
            },
          ]
        );
      } else {
        Alert.alert('오류', message || '로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>TravelLight</Text>
        <Text style={styles.subtitle}>라이더 로그인</Text>

        <TextInput
          style={styles.input}
          placeholder="이메일"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '로그인 중...' : '로그인'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.linkText}>계정이 없으신가요? 회원가입</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('ApplicationStatus')}
        >
          <Text style={styles.linkText}>신청 상태 확인</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#3b82f6',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  linkButton: {
    marginTop: 15,
  },
  linkText: {
    color: '#3b82f6',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LoginScreen;
```

### 5. 신청 상태 확인 화면 (ApplicationStatusScreen.js)

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import authService from '../services/authService';

const ApplicationStatusScreen = ({ navigation }) => {
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplicationStatus();
  }, []);

  const fetchApplicationStatus = async () => {
    setLoading(true);
    try {
      const userData = await authService.getCurrentUser();

      if (!userData) {
        Alert.alert('알림', '로그인이 필요합니다.', [
          {
            text: '확인',
            onPress: () => navigation.navigate('Login'),
          },
        ]);
        return;
      }

      const response = await authService.getApplicationStatus(userData.userId);

      if (response.success) {
        setApplicationStatus(response.data);
      } else {
        Alert.alert('오류', response.message);
      }
    } catch (error) {
      console.error('Fetch application status error:', error);
      const message =
        error.response?.data?.message || '신청 상태를 불러오는데 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'PENDING':
        return {
          text: '승인 대기중',
          color: '#f59e0b',
          description: '관리자가 신청을 검토 중입니다.',
        };
      case 'APPROVED':
        return {
          text: '승인됨',
          color: '#10b981',
          description: '승인이 완료되었습니다. 로그인해주세요.',
        };
      case 'REJECTED':
        return {
          text: '거절됨',
          color: '#ef4444',
          description: '신청이 거절되었습니다.',
        };
      default:
        return {
          text: status,
          color: '#6b7280',
          description: '',
        };
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>불러오는 중...</Text>
      </View>
    );
  }

  if (!applicationStatus) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>신청 내역을 찾을 수 없습니다.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.buttonText}>회원가입하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = getStatusInfo(applicationStatus.status);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>신청 상태</Text>

      <View style={styles.card}>
        <View style={styles.statusBadge}>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
        </View>

        <Text style={styles.description}>{statusInfo.description}</Text>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>이름</Text>
            <Text style={styles.infoValue}>{applicationStatus.userName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>이메일</Text>
            <Text style={styles.infoValue}>{applicationStatus.userEmail}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>전화번호</Text>
            <Text style={styles.infoValue}>{applicationStatus.phoneNumber}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>차량번호</Text>
            <Text style={styles.infoValue}>{applicationStatus.vehicleNumber}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>신청일</Text>
            <Text style={styles.infoValue}>
              {new Date(applicationStatus.createdAt).toLocaleDateString('ko-KR')}
            </Text>
          </View>

          {applicationStatus.status === 'REJECTED' && applicationStatus.rejectionReason && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>거절 사유</Text>
              <Text style={[styles.infoValue, { color: '#ef4444' }]}>
                {applicationStatus.rejectionReason}
              </Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={fetchApplicationStatus}
      >
        <Text style={styles.buttonText}>새로고침</Text>
      </TouchableOpacity>

      {applicationStatus.status === 'APPROVED' && (
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>로그인하기</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.linkText}>돌아가기</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  statusBadge: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoContainer: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#111',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#e5e7eb',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  buttonText: {
    color: '#111',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  linkButton: {
    marginTop: 10,
  },
  linkText: {
    color: '#3b82f6',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ApplicationStatusScreen;
```

---

## 추가 참고사항

### 1. 네트워크 보안 (Android)

Android 9(API 28) 이상에서는 기본적으로 HTTP 통신이 차단됩니다. 개발 환경에서 HTTP를 사용하려면 `android/app/src/main/AndroidManifest.xml`에 다음을 추가하세요:

```xml
<application
  ...
  android:usesCleartextTraffic="true">
```

**주의**: 운영 환경에서는 반드시 HTTPS를 사용하세요.

### 2. iOS ATS (App Transport Security) 설정

iOS에서 HTTP 통신을 허용하려면 `ios/YourApp/Info.plist`에 다음을 추가하세요:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

**주의**: 운영 환경에서는 반드시 HTTPS를 사용하세요.

### 3. 패키지 설치

React Native 프로젝트에 필요한 패키지:

```bash
# Axios (HTTP 클라이언트)
npm install axios

# AsyncStorage (로컬 저장소)
npm install @react-native-async-storage/async-storage

# Navigation (화면 전환)
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install react-native-gesture-handler react-native-reanimated

# iOS 전용: CocoaPods 설치
cd ios && pod install && cd ..
```

### 4. 개발 팁

1. **디버깅**: React Native Debugger 또는 Flipper 사용
2. **API 테스트**: Postman으로 먼저 API 테스트 후 앱에 통합
3. **에러 로깅**: Sentry 또는 Firebase Crashlytics 사용 권장
4. **상태 관리**: Redux, MobX, 또는 Context API 사용 고려

---

## 문의 및 지원

- **API 문서**: Swagger UI (`http://localhost:8080/swagger-ui.html`)
- **GitHub**: [TravelLight Repository](https://github.com/your-org/travellight)
- **이메일**: support@travelight.co.kr

---

**버전**: 1.0.0
**최종 수정일**: 2025-10-25
