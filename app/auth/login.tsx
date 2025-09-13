import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
// import KakaoLogins from '@react-native-seoul/kakao-login';

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');

  const handleKakaoLogin = async () => {
    try {
      setIsLoading(true);

      // 개발 단계에서는 데모 로그인 처리
      // 실제 운영 시에는 아래 주석 해제하고 카카오 로그인 사용
      /*
      const result = await KakaoLogins.login();
      if (result) {
        const success = await login(result.accessToken, 'kakao');
        if (success) {
          router.replace('/(tabs)');
        } else {
          Alert.alert('로그인 실패', '카카오 로그인 중 오류가 발생했습니다.');
        }
      }
      */

      // 데모용 카카오 로그인
      const success = await login('kakao@demo.com', 'kakao_demo');
      if (success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('로그인 실패', '카카오 로그인 중 오류가 발생했습니다.');
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
      const success = await login('driver@travelrider.com', 'password123');
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
    backgroundColor: '#000000',
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