import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { deliveryService, DeliveryResponse, DeliveryStatus } from '@/services/deliveryService';
import { useAuth } from './AuthContext';

interface DeliveryContextType {
  availableDeliveries: DeliveryResponse[]; // 배차 전 배달들
  assignedDeliveries: DeliveryResponse[]; // 내가 배차받은 배달들
  currentDelivery: DeliveryResponse | null;
  isLoading: boolean;
  fetchAvailableDeliveries: () => Promise<void>;
  fetchAssignedDeliveries: () => Promise<void>;
  acceptDelivery: (deliveryId: number) => Promise<boolean>;
  updateDeliveryStatus: (deliveryId: number, status: DeliveryStatus) => Promise<boolean>;
  setCurrentDelivery: (delivery: DeliveryResponse | null) => void;
  refreshDeliveries: () => Promise<void>;
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

export function DeliveryProvider({ children }: { children: ReactNode }) {
  const [availableDeliveries, setAvailableDeliveries] = useState<DeliveryResponse[]>([]);
  const [assignedDeliveries, setAssignedDeliveries] = useState<DeliveryResponse[]>([]);
  const [currentDelivery, setCurrentDeliveryState] = useState<DeliveryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // 배차 전 배달 목록 조회
  const fetchAvailableDeliveries = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await deliveryService.getAllDeliveries();

      if (response.success && response.data) {
        // PENDING 상태인 배달들만 필터링 (아직 배차되지 않은 배달)
        const available = response.data.filter(
          delivery => delivery.status === 'PENDING'
        );
        setAvailableDeliveries(available);
      } else {
        console.warn('API response failed:', response.message);
      }
    } catch (error) {
      console.error('Failed to fetch available deliveries:', error);

      // 개발 중 mock 데이터
      const mockAvailable: DeliveryResponse[] = [
        {
          id: 101,
          userId: 0,
          reservationId: 101,
          pickupAddress: '서울시 강남구 테헤란로 123',
          deliveryAddress: '서울시 서초구 반포대로 456',
          itemDescription: '여행 가방',
          weight: 15.5,
          requestedAt: new Date().toISOString(),
          status: 'PENDING' as DeliveryStatus,
          trackingNumber: 'TR' + Date.now(),
          estimatedDeliveryTime: new Date(Date.now() + 3600000).toISOString()
        }
      ];
      setAvailableDeliveries(mockAvailable);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 내가 배차받은 배달 목록 조회
  const fetchAssignedDeliveries = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await deliveryService.getDriverDeliveries(user.id);

      if (response.success && response.data) {
        setAssignedDeliveries(response.data);

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
      console.error('Failed to fetch assigned deliveries:', error);
      setAssignedDeliveries([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentDelivery]);

  // 배달 수락 (배차 받기)
  const acceptDelivery = async (deliveryId: number): Promise<boolean> => {
    if (!user) return false;

    try {
      setIsLoading(true);
      const response = await deliveryService.assignDriver(deliveryId, user.id);

      if (response.success) {
        // 배차 후 목록 갱신
        await fetchAvailableDeliveries();
        await fetchAssignedDeliveries();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to accept delivery:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAvailableDeliveries();
      fetchAssignedDeliveries();
    }
  }, [user, fetchAvailableDeliveries, fetchAssignedDeliveries]);

  const updateDeliveryStatus = async (
    deliveryId: number,
    status: DeliveryStatus
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await deliveryService.updateDeliveryStatus(deliveryId, status);

      if (response.success) {
        // 로컬 상태 업데이트
        setAssignedDeliveries(prev =>
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
    await fetchAvailableDeliveries();
    await fetchAssignedDeliveries();
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
    availableDeliveries,
    assignedDeliveries,
    currentDelivery,
    isLoading,
    fetchAvailableDeliveries,
    fetchAssignedDeliveries,
    acceptDelivery,
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