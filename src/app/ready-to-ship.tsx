import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Image, RefreshControl, Modal, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Truck, MapPin, Calendar, AlertTriangle, Clock, X, Check, QrCode, Camera } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { api, BACKEND_URL } from '@/lib/api';
import type { GetInventoryResponse, InventoryItem, UpdateInventoryItemRequest, UploadImageResponse } from '@/shared/contracts';

export default function ReadyToShipScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // QR Code scanning state
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [qrScanItem, setQrScanItem] = useState<InventoryItem | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.get<GetInventoryResponse>('/api/inventory'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventoryItemRequest }) =>
      api.patch<InventoryItem>(`/api/inventory/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setShowDatePicker(false);
      setSelectedItem(null);
      setShowQrScanner(false);
      setQrScanItem(null);
    },
  });

  // Show sold items that need to be shipped
  const readyToShipItems = data?.items?.filter((item) => item.status === 'sold') ?? [];

  // Sort by ship by date (urgent first, then no date)
  const sortedItems = [...readyToShipItems].sort((a, b) => {
    if (!a.shipByDate && !b.shipByDate) return 0;
    if (!a.shipByDate) return 1;
    if (!b.shipByDate) return -1;
    return new Date(a.shipByDate).getTime() - new Date(b.shipByDate).getTime();
  });

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${BACKEND_URL}${imageUrl}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilShip = (shipByDate: string | null): number | null => {
    if (!shipByDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const shipDate = new Date(shipByDate);
    shipDate.setHours(0, 0, 0, 0);
    const diffTime = shipDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyStatus = (shipByDate: string | null) => {
    const days = getDaysUntilShip(shipByDate);
    if (days === null) return { color: '#64748B', bgColor: '#64748B20', label: 'No date set', icon: Calendar, urgent: false };
    if (days < 0) return { color: '#EF4444', bgColor: '#EF444420', label: 'Overdue!', icon: AlertTriangle, urgent: true };
    if (days === 0) return { color: '#F59E0B', bgColor: '#F59E0B20', label: 'Ship today!', icon: AlertTriangle, urgent: true };
    if (days === 1) return { color: '#F59E0B', bgColor: '#F59E0B20', label: 'Ship tomorrow', icon: Clock, urgent: true };
    if (days <= 3) return { color: '#F59E0B', bgColor: '#F59E0B20', label: `${days} days left`, icon: Clock, urgent: true };
    return { color: '#10B981', bgColor: '#10B98120', label: `${days} days left`, icon: Calendar, urgent: false };
  };

  const handleSetShipDate = (item: InventoryItem) => {
    setSelectedItem(item);
    setSelectedDate(item.shipByDate ? new Date(item.shipByDate) : new Date());
    setShowDatePicker(true);
  };

  const handleDateChange = (_event: unknown, date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleSaveDate = () => {
    if (selectedItem) {
      updateMutation.mutate({
        id: selectedItem.id,
        data: { shipByDate: selectedDate.toISOString() },
      });
    }
  };

  const handleClearDate = () => {
    if (selectedItem) {
      updateMutation.mutate({
        id: selectedItem.id,
        data: { shipByDate: null },
      });
    }
  };

  const handleAddQrCode = async (item: InventoryItem) => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        alert('Camera permission is required to scan QR codes');
        return;
      }
    }
    setQrScanItem(item);
    setShowQrScanner(true);
  };

  const handleCaptureQrCode = async () => {
    if (!cameraRef.current || !qrScanItem || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        // Upload the image
        const formData = new FormData();
        formData.append('image', {
          uri: photo.uri,
          type: 'image/jpeg',
          name: `qr-${qrScanItem.id}.jpg`,
        } as unknown as Blob);

        const response = await fetch(`${BACKEND_URL}/api/upload/image`, {
          method: 'POST',
          body: formData,
        });

        const result: UploadImageResponse = await response.json();

        if (result.success && result.url) {
          // Update the item with the QR code URL
          updateMutation.mutate({
            id: qrScanItem.id,
            data: { shipperQrCode: result.url },
          });
        } else {
          alert('Failed to upload QR code image');
        }
      }
    } catch (error) {
      console.error('Error capturing QR code:', error);
      alert('Failed to capture QR code');
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePickFromGallery = async () => {
    if (!qrScanItem) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsCapturing(true);
        const formData = new FormData();
        formData.append('image', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `qr-${qrScanItem.id}.jpg`,
        } as unknown as Blob);

        const response = await fetch(`${BACKEND_URL}/api/upload/image`, {
          method: 'POST',
          body: formData,
        });

        const uploadResult: UploadImageResponse = await response.json();

        if (uploadResult.success && uploadResult.url) {
          updateMutation.mutate({
            id: qrScanItem.id,
            data: { shipperQrCode: uploadResult.url },
          });
        } else {
          alert('Failed to upload QR code image');
        }
        setIsCapturing(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to select image');
      setIsCapturing(false);
    }
  };

  const handleRemoveQrCode = (item: InventoryItem) => {
    updateMutation.mutate({
      id: item.id,
      data: { shipperQrCode: null },
    });
  };

  // Count urgent items
  const urgentCount = sortedItems.filter((item) => {
    const days = getDaysUntilShip(item.shipByDate);
    return days !== null && days <= 1;
  }).length;

  return (
    <View className="flex-1 bg-neutral-900">
      <LinearGradient
        colors={['#1C1C1E', '#2C2C2E', '#1C1C1E']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-5 pt-4 pb-4">
          <Text className="text-white text-2xl font-bold">Ready to Ship</Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-slate-400 text-sm">
              {readyToShipItems.length} {readyToShipItems.length === 1 ? 'item' : 'items'} awaiting shipment
            </Text>
            {urgentCount > 0 && (
              <View className="flex-row items-center ml-3 bg-amber-500/20 px-2 py-1 rounded-full">
                <AlertTriangle size={12} color="#F59E0B" />
                <Text className="text-amber-500 text-xs font-semibold ml-1">
                  {urgentCount} urgent
                </Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#06B6D4"
            />
          }
        >
          {isLoading ? (
            <View className="bg-slate-800/60 rounded-2xl p-8 items-center border border-slate-700/50">
              <Text className="text-slate-400">Loading...</Text>
            </View>
          ) : sortedItems.length === 0 ? (
            <View className="bg-slate-800/60 rounded-2xl p-8 items-center border border-slate-700/50">
              <Truck size={40} color="#64748B" />
              <Text className="text-slate-400 mt-3 text-center">No items to ship</Text>
              <Text className="text-slate-500 text-sm mt-1 text-center">
                Items marked as sold will appear here
              </Text>
            </View>
          ) : (
            sortedItems.map((item) => {
              const urgency = getUrgencyStatus(item.shipByDate);
              const UrgencyIcon = urgency.icon;

              return (
                <Pressable
                  key={item.id}
                  className={`bg-slate-800/60 rounded-2xl p-4 mb-3 border active:opacity-80 ${
                    urgency.urgent ? 'border-amber-500/50' : 'border-slate-700/50'
                  }`}
                  onPress={() => router.push(`/item/${item.id}`)}
                >
                  <View className="flex-row items-start">
                    <Image
                      source={{ uri: getImageUrl(item.imageUrl) }}
                      className="w-20 h-20 rounded-xl bg-slate-700"
                    />
                    <View className="flex-1 ml-4">
                      <Text className="text-white font-bold text-base" numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.soldPrice ? (
                        <Text className="text-emerald-400 font-semibold mt-1">
                          {formatCurrency(item.soldPrice)}
                        </Text>
                      ) : null}
                      <Text className="text-cyan-400 text-xs mt-1">{item.platform}</Text>
                    </View>
                    {/* QR Code indicator/button */}
                    {item.shipperQrCode ? (
                      <Pressable
                        className="w-12 h-12 rounded-xl bg-cyan-500/20 items-center justify-center"
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push(`/item/${item.id}`);
                        }}
                      >
                        <QrCode size={24} color="#06B6D4" />
                      </Pressable>
                    ) : (
                      <Pressable
                        className="w-12 h-12 rounded-xl bg-slate-700/50 items-center justify-center border border-dashed border-slate-600"
                        onPress={(e) => {
                          e.stopPropagation();
                          handleAddQrCode(item);
                        }}
                      >
                        <QrCode size={20} color="#64748B" />
                      </Pressable>
                    )}
                  </View>

                  {/* Ship By Date & Location Row */}
                  <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                    <View className="flex-row items-center">
                      <MapPin size={14} color="#06B6D4" />
                      <Text className="text-slate-400 text-sm ml-2">
                        Bin {item.binNumber || '—'} • Rack {item.rackNumber || '—'}
                      </Text>
                    </View>
                  </View>

                  {/* Ship By Date Section */}
                  <Pressable
                    className="flex-row items-center justify-between mt-3 p-3 rounded-xl"
                    style={{ backgroundColor: urgency.bgColor }}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleSetShipDate(item);
                    }}
                  >
                    <View className="flex-row items-center">
                      <UrgencyIcon size={16} color={urgency.color} />
                      <Text className="ml-2 font-semibold text-sm" style={{ color: urgency.color }}>
                        {urgency.label}
                      </Text>
                    </View>
                    {item.shipByDate ? (
                      <Text className="text-sm" style={{ color: urgency.color }}>
                        {formatDate(item.shipByDate)}
                      </Text>
                    ) : (
                      <Text className="text-slate-500 text-sm">Tap to set date</Text>
                    )}
                  </Pressable>
                </Pressable>
              );
            })
          )}
          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-slate-900 rounded-t-3xl p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Pressable
                className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center"
                onPress={() => setShowDatePicker(false)}
              >
                <X size={20} color="#F8FAFC" />
              </Pressable>
              <Text className="text-white text-lg font-bold">Ship By Date</Text>
              <Pressable
                className="w-10 h-10 rounded-full bg-cyan-500 items-center justify-center"
                onPress={handleSaveDate}
                disabled={updateMutation.isPending}
              >
                <Check size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            {selectedItem && (
              <View className="bg-slate-800/60 rounded-xl p-3 mb-4 flex-row items-center">
                <Image
                  source={{ uri: getImageUrl(selectedItem.imageUrl) }}
                  className="w-12 h-12 rounded-lg bg-slate-700"
                />
                <Text className="text-white font-semibold ml-3 flex-1" numberOfLines={1}>
                  {selectedItem.name}
                </Text>
              </View>
            )}

            <View className="bg-slate-800 rounded-xl overflow-hidden mb-4">
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date()}
                textColor="#FFFFFF"
                themeVariant="dark"
              />
            </View>

            {selectedItem?.shipByDate && (
              <Pressable
                className="bg-red-500/20 rounded-xl py-3 items-center"
                onPress={handleClearDate}
              >
                <Text className="text-red-400 font-semibold">Clear Ship Date</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      {/* QR Code Scanner Modal */}
      <Modal
        visible={showQrScanner}
        animationType="slide"
        onRequestClose={() => {
          setShowQrScanner(false);
          setQrScanItem(null);
        }}
      >
        <View className="flex-1 bg-neutral-900">
          <SafeAreaView className="flex-1">
            {/* Header */}
            <View className="px-5 pt-4 pb-4 flex-row items-center justify-between">
              <Pressable
                className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center"
                onPress={() => {
                  setShowQrScanner(false);
                  setQrScanItem(null);
                }}
              >
                <X size={20} color="#F8FAFC" />
              </Pressable>
              <Text className="text-white text-lg font-bold">Add Shipper QR Code</Text>
              <View className="w-10" />
            </View>

            {qrScanItem && (
              <View className="px-5 mb-4">
                <View className="bg-slate-800/60 rounded-xl p-3 flex-row items-center">
                  <Image
                    source={{ uri: getImageUrl(qrScanItem.imageUrl) }}
                    className="w-12 h-12 rounded-lg bg-slate-700"
                  />
                  <Text className="text-white font-semibold ml-3 flex-1" numberOfLines={1}>
                    {qrScanItem.name}
                  </Text>
                </View>
              </View>
            )}

            {/* Camera View */}
            <View className="flex-1 mx-5 rounded-2xl overflow-hidden bg-slate-800">
              {permission?.granted ? (
                <CameraView
                  ref={cameraRef}
                  style={{ flex: 1 }}
                  facing="back"
                >
                  {/* Overlay with QR frame */}
                  <View className="flex-1 items-center justify-center">
                    <View className="w-64 h-64 border-2 border-cyan-400 rounded-2xl" />
                    <Text className="text-white text-center mt-4 px-8">
                      Position the shipping label QR code within the frame
                    </Text>
                  </View>
                </CameraView>
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Camera size={48} color="#64748B" />
                  <Text className="text-slate-400 mt-4 text-center px-8">
                    Camera permission required
                  </Text>
                  <Pressable
                    className="bg-cyan-500 rounded-xl px-6 py-3 mt-4"
                    onPress={requestPermission}
                  >
                    <Text className="text-white font-bold">Grant Permission</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View className="px-5 py-6">
              <View className="flex-row gap-3">
                <Pressable
                  className="flex-1 bg-slate-700 rounded-2xl py-4 flex-row items-center justify-center active:opacity-80"
                  onPress={handlePickFromGallery}
                  disabled={isCapturing}
                >
                  <Text className="text-white font-bold">From Gallery</Text>
                </Pressable>
                <Pressable
                  className="flex-1 bg-cyan-500 rounded-2xl py-4 flex-row items-center justify-center active:opacity-80"
                  onPress={handleCaptureQrCode}
                  disabled={isCapturing || !permission?.granted}
                >
                  {isCapturing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-bold">Capture</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
