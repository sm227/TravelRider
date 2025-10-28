import { ThemedText } from '@/components/themed-text';
import { authService } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RegisterStep = 1 | 2 | 3 | 4;
type UserRole = 'USER' | 'DRIVER';

export default function RegisterScreen() {
  const [currentStep, setCurrentStep] = useState<RegisterStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [role, setRole] = useState<UserRole>('DRIVER'); // 라이더 앱이므로 기본값 DRIVER

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    // 최소 8자, 영문과 숫자 포함
    return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  };

  const getPasswordStrength = (password: string): string => {
    if (password.length === 0) return '';
    if (password.length < 8) return '약함';
    if (!(/[a-zA-Z]/.test(password) && /[0-9]/.test(password))) return '보통';
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) return '강함';
    return '보통';
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Step 1: 이메일 검증
      if (!email.trim()) {
        Alert.alert('입력 오류', '이메일을 입력해주세요.');
        return;
      }
      if (!validateEmail(email)) {
        Alert.alert('입력 오류', '올바른 이메일 형식을 입력해주세요.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Step 2: 비밀번호 검증
      if (!password.trim()) {
        Alert.alert('입력 오류', '비밀번호를 입력해주세요.');
        return;
      }
      if (!validatePassword(password)) {
        Alert.alert('입력 오류', '비밀번호는 최소 8자 이상이며, 영문과 숫자를 포함해야 합니다.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('입력 오류', '비밀번호가 일치하지 않습니다.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Step 3: 개인정보 검증
      if (!name.trim()) {
        Alert.alert('입력 오류', '이름을 입력해주세요.');
        return;
      }
      if (!phone.trim()) {
        Alert.alert('입력 오류', '전화번호를 입력해주세요.');
        return;
      }
      if (!vehicleNumber.trim()) {
        Alert.alert('입력 오류', '차량번호를 입력해주세요.');
        return;
      }
      setCurrentStep(4);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as RegisterStep);
    }
  };

  const handleRegister = async () => {
    try {
      setIsLoading(true);

      // 라이더 회원가입 API 호출
      const response = await authService.riderRegister({
        name: name.trim(),
        email: email.trim(),
        password,
        phoneNumber: phone.trim(),
        vehicleNumber: vehicleNumber.trim(),
        licenseNumber: licenseNumber.trim() || undefined,
      });

      if (response.success) {
        Alert.alert(
          '회원가입 신청 완료',
          '회원가입 신청이 완료되었습니다.\n관리자의 승인 후 로그인이 가능합니다.',
          [
            {
              text: '확인',
              onPress: () => {
                // 승인 대기 상태이므로 로그인 화면으로 이동
                router.replace('/auth/login');
              },
            },
          ]
        );
      } else {
        Alert.alert('회원가입 실패', response.message || '회원가입 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      Alert.alert('오류', '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((step) => (
        <View
          key={step}
          style={[
            styles.stepDot,
            step === currentStep && styles.stepDotActive,
            step < currentStep && styles.stepDotCompleted,
          ]}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>이메일 주소를 입력하세요</Text>
      <Text style={styles.stepSubtitle}>로그인 시 사용할 이메일 주소입니다</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>이메일</Text>
        <TextInput
          style={styles.input}
          placeholder="example@email.com"
          placeholderTextColor="#666666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!isLoading}
          autoFocus
        />
      </View>

      <TouchableOpacity
        style={[styles.nextButton, isLoading && styles.disabledButton]}
        onPress={handleNextStep}
        disabled={isLoading}
      >
        <Text style={styles.nextButtonText}>다음</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => {
    const passwordStrength = getPasswordStrength(password);
    const passwordMatch = password && confirmPassword && password === confirmPassword;

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>비밀번호를 설정하세요</Text>
        <Text style={styles.stepSubtitle}>최소 8자 이상, 영문과 숫자를 포함해야 합니다</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>비밀번호</Text>
          <TextInput
            style={styles.input}
            placeholder="비밀번호를 입력하세요"
            placeholderTextColor="#666666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!isLoading}
            autoFocus
          />
          {password.length > 0 && (
            <View style={styles.passwordStrengthContainer}>
              <Text
                style={[
                  styles.passwordStrength,
                  passwordStrength === '약함' && styles.passwordStrengthWeak,
                  passwordStrength === '보통' && styles.passwordStrengthMedium,
                  passwordStrength === '강함' && styles.passwordStrengthStrong,
                ]}
              >
                {passwordStrength}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>비밀번호 확인</Text>
          <TextInput
            style={styles.input}
            placeholder="비밀번호를 다시 입력하세요"
            placeholderTextColor="#666666"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!isLoading}
          />
          {confirmPassword.length > 0 && (
            <Text
              style={[
                styles.passwordMatch,
                passwordMatch ? styles.passwordMatchSuccess : styles.passwordMatchError,
              ]}
            >
              {passwordMatch ? '✓ 비밀번호가 일치합니다' : '✗ 비밀번호가 일치하지 않습니다'}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.nextButton, isLoading && styles.disabledButton]}
          onPress={handleNextStep}
          disabled={isLoading}
        >
          <Text style={styles.nextButtonText}>다음</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>라이더 정보를 입력하세요</Text>
      <Text style={styles.stepSubtitle}>배달 서비스 이용을 위한 라이더 정보입니다</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>이름</Text>
        <TextInput
          style={styles.input}
          placeholder="이름을 입력하세요"
          placeholderTextColor="#666666"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          editable={!isLoading}
          autoFocus
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>전화번호</Text>
        <TextInput
          style={styles.input}
          placeholder="010-1234-5678"
          placeholderTextColor="#666666"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!isLoading}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>차량번호</Text>
        <TextInput
          style={styles.input}
          placeholder="12가3456"
          placeholderTextColor="#666666"
          value={vehicleNumber}
          onChangeText={setVehicleNumber}
          autoCapitalize="characters"
          editable={!isLoading}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>운전면허번호 (선택)</Text>
        <TextInput
          style={styles.input}
          placeholder="11-12-345678-90"
          placeholderTextColor="#666666"
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          editable={!isLoading}
        />
      </View>

      <TouchableOpacity
        style={[styles.nextButton, isLoading && styles.disabledButton]}
        onPress={handleNextStep}
        disabled={isLoading}
      >
        <Text style={styles.nextButtonText}>다음</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>입력하신 정보를 확인해주세요</Text>
      <Text style={styles.stepSubtitle}>정보가 올바른지 확인 후 가입 신청을 완료하세요</Text>

      <View style={styles.confirmContainer}>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>이메일</Text>
          <Text style={styles.confirmValue}>{email}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>이름</Text>
          <Text style={styles.confirmValue}>{name}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>전화번호</Text>
          <Text style={styles.confirmValue}>{phone}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>차량번호</Text>
          <Text style={styles.confirmValue}>{vehicleNumber}</Text>
        </View>
        {licenseNumber && (
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>운전면허번호</Text>
            <Text style={styles.confirmValue}>{licenseNumber}</Text>
          </View>
        )}
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>역할</Text>
          <Text style={styles.confirmValue}>라이더</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          ℹ️ 관리자의 승인 후 로그인이 가능합니다.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.registerButton, isLoading && styles.disabledButton]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.registerButtonText}>가입 신청하기</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        {/* Header */}
        <View style={styles.header}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handlePreviousStep}
              disabled={isLoading}
            >
              <Text style={styles.backButtonText}>← 이전</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleBackToLogin}
            disabled={isLoading}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#666666',
    fontSize: 24,
    fontWeight: '300',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333333',
  },
  stepDotActive: {
    width: 32,
    backgroundColor: '#007AFF',
  },
  stepDotCompleted: {
    backgroundColor: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#999999',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#333333',
  },
  passwordStrengthContainer: {
    marginTop: 8,
    marginLeft: 4,
  },
  passwordStrength: {
    fontSize: 14,
    fontWeight: '500',
  },
  passwordStrengthWeak: {
    color: '#FF3B30',
  },
  passwordStrengthMedium: {
    color: '#FF9500',
  },
  passwordStrengthStrong: {
    color: '#34C759',
  },
  passwordMatch: {
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
  },
  passwordMatchSuccess: {
    color: '#34C759',
  },
  passwordMatchError: {
    color: '#FF3B30',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  roleButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  roleButtonText: {
    color: '#CCCCCC',
    fontSize: 16,
    fontWeight: '500',
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
  nextButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  confirmContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  confirmLabel: {
    fontSize: 16,
    color: '#999999',
    fontWeight: '500',
  },
  confirmValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  infoBox: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  infoText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
  },
});
