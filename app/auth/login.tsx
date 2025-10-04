import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 카카오 SDK는 Expo Go에서 작동하지 않으므로 타입만 임포트
let KakaoLogins: any = null;
try {
  KakaoLogins = require('@react-native-seoul/kakao-login').default;
} catch (error) {
  console.log('Kakao SDK not available in Expo Go');
}

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { login, kakaoLogin } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');

  const handleKakaoLogin = async () => {
    try {
      setIsLoading(true);

      // Expo Go에서는 카카오 SDK를 사용할 수 없으므로 체크
      if (!KakaoLogins || typeof KakaoLogins.login !== 'function') {
        Alert.alert(
          '카카오 로그인 사용 불가',
          'Expo Go에서는 카카오 로그인을 사용할 수 없습니다.\n\n개발 빌드(npx expo run:android 또는 npx expo run:ios)를 사용하거나, 테스트용 데모 계정을 사용해주세요.',
          [
            {
              text: '확인',
              style: 'default'
            }
          ]
        );
        setIsLoading(false);
        return;
      }

      // 카카오 로그인 SDK 호출
      const loginResult = await KakaoLogins.login();

      if (loginResult) {
        // 카카오 프로필 정보 가져오기
        const profile = await KakaoLogins.getProfile();

        if (profile && profile.email) {
          // 서버에 카카오 이메일과 이름으로 로그인/회원가입 처리
          const success = await kakaoLogin(
            profile.email,
            profile.nickname || profile.email.split('@')[0]
          );

          if (success) {
            router.replace('/(tabs)');
          } else {
            Alert.alert('로그인 실패', '카카오 로그인 처리 중 오류가 발생했습니다.');
          }
        } else {
          Alert.alert('로그인 실패', '카카오 계정 이메일 정보가 필요합니다.');
        }
      }
    } catch (error) {
      console.error('카카오 로그인 오류:', error);
      Alert.alert('오류', '카카오 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setIsLoading(true);
      // 서버 DB의 실제 테스트 계정 사용
      const success = await login('del@del.com', 'qqqq1111');
      if (success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('로그인 실패', '데모 로그인 중 오류가 발생했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Logo/Title Section */}
        <View style={styles.headerSection}>
          <Text style={styles.logoText}>🚛</Text>
          <ThemedText type="title" style={styles.title}>
            TravelRider
          </ThemedText>
          <Text style={styles.subtitle}>배달 관리 시스템</Text>
        </View>

        {/* Login Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.kakaoButton, isLoading && styles.disabledButton]}
            onPress={handleKakaoLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <>
                <Text style={styles.kakaoIcon}>💬</Text>
                <Text style={styles.kakaoButtonText}>카카오톡으로 시작하기</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.demoButton, isLoading && styles.disabledButton]}
            onPress={handleDemoLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.demoButtonText}>데모 계정으로 체험하기</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            배달기사를 위한 전문 관리 시스템
          </Text>
          <Text style={styles.footerSubtext}>
            효율적인 배달 관리와 수익 증대를 경험해보세요
          </Text>
        </View>
      </View>
    </View>
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
    justifyContent: 'space-between',
    paddingBottom: 60,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 40,
  },
  logoText: {
    fontSize: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 18,
    color: '#CCCCCC',
    textAlign: 'center',
    fontWeight: '400',
  },
  buttonSection: {
    gap: 16,
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
    borderRadius: 12,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  kakaoIcon: {
    fontSize: 20,
  },
  kakaoButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
  },
  demoButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.6,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },
});