import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { deliveryService, DeliveryResponse, DeliveryStatus } from '@/services/deliveryService';
import { useAuth } from './AuthContext';

interface DeliveryContextType {
  deliveries: DeliveryResponse[];
  currentDelivery: DeliveryResponse | null;
  isLoading: boolean;
  fetchDriverDeliveries: () => Promise<void>;
  updateDeliveryStatus: (deliveryId: number, status: DeliveryStatus) => Promise<boolean>;
  setCurrentDelivery: (delivery: DeliveryResponse | null) => void;
  refreshDeliveries: () => Promise<void>;
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

export function DeliveryProvider({ children }: { children: ReactNode }) {
  const [deliveries, setDeliveries] = useState<DeliveryResponse[]>([]);
  const [currentDelivery, setCurrentDeliveryState] = useState<DeliveryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchDriverDeliveries();
    }
  }, [user, fetchDriverDeliveries]);

  const fetchDriverDeliveries = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await deliveryService.getDriverDeliveries(user.id);

      if (response.success && response.data) {
        setDeliveries(response.data);

        // 진행 중인 배달이 있으면 현재 배달로 설정
        const inProgressDelivery = response.data.find(
          delivery => ['ACCEPTED', 'PICKED_UP', 'IN_PROGRESS'].includes(delivery.status)
        );
        if (inProgressDelivery && !currentDelivery) {
          setCurrentDeliveryState(inProgressDelivery);
        }
      } else {
        console.warn('API response failed:', response.message);
      }
    } catch (error) {
      console.error('Failed to fetch driver deliveries:', error);

      // 개발 중 API 서버가 없을 때 mock 데이터 제공
      const mockDeliveries: DeliveryResponse[] = [
        {
          id: 1,
          userId: user.userId,
          reservationId: 1,
          pickupAddress: '서울시 강남구 테헤란로 123, 카페 코인',
          deliveryAddress: '서울시 서초구 반포대로 456, 101동 503호',
          itemDescription: '여행용 캐리어, 백팩 2개',
          weight: 15.5,
          requestedAt: new Date().toISOString(),
          status: 'ASSIGNED' as DeliveryStatus,
          trackingNumber: 'TR' + Date.now(),
          estimatedDeliveryTime: new Date(Date.now() + 3600000).toISOString()
        },
        {
          id: 2,
          userId: user.userId,
          reservationId: 2,
          pickupAddress: '서울시 마포구 홍대입구역 2번 출구',
          deliveryAddress: '서울시 용산구 한강대로 321, 202호',
          itemDescription: '노트북 가방, 서류 박스',
          weight: 8.2,
          requestedAt: new Date(Date.now() - 1800000).toISOString(),
          status: 'PENDING' as DeliveryStatus,
          trackingNumber: 'TR' + (Date.now() - 1000),
          estimatedDeliveryTime: new Date(Date.now() + 1800000).toISOString()
        }
      ];

      console.log('Using mock delivery data for development');
      setDeliveries(mockDeliveries);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updateDeliveryStatus = async (
    deliveryId: number,
    status: DeliveryStatus
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await deliveryService.updateDeliveryStatus(deliveryId, status);

      if (response.success) {
        // 로컬 상태 업데이트
        setDeliveries(prev =>
          prev.map(delivery =>
            delivery.id === deliveryId
              ? { ...delivery, status }
              : delivery
          )
        );

        // 현재 배달 상태 업데이트
        if (currentDelivery?.id === deliveryId) {
          setCurrentDeliveryState(prev => prev ? { ...prev, status } : null);

          // 배달 완료시 현재 배달 초기화
          if (status === 'DELIVERED') {
            setCurrentDeliveryState(null);
          }
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to update delivery status:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentDelivery = (delivery: DeliveryResponse | null): void => {
    setCurrentDeliveryState(delivery);
  };

  const refreshDeliveries = async (): Promise<void> => {
    await fetchDriverDeliveries();
  };

  // 현재 배달이 있을 때 주기적으로 업데이트 (임시 비활성화)
  // useEffect(() => {
  //   if (!currentDelivery) return;

  //   const interval = setInterval(() => {
  //     fetchDriverDeliveries();
  //   }, 30000); // 30초마다 업데이트

  //   return () => clearInterval(interval);
  // }, [currentDelivery, fetchDriverDeliveries]);

  const value: DeliveryContextType = {
    deliveries,
    currentDelivery,
    isLoading,
    fetchDriverDeliveries,
    updateDeliveryStatus,
    setCurrentDelivery,
    refreshDeliveries
  };

  return (
    <DeliveryContext.Provider value={value}>
      {children}
    </DeliveryContext.Provider>
  );
}

export function useDelivery() {
  const context = useContext(DeliveryContext);
  if (context === undefined) {
    throw new Error('useDelivery must be used within a DeliveryProvider');
  }
  return context;
}

export default DeliveryContext;