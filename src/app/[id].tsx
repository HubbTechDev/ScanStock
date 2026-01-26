import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, MapPin, Tag, Calendar, Trash2, Truck, CheckCircle, DollarSign, Pencil, X, Check, Bell, Clock, QrCode, RotateCcw, AlertTriangle, Maximize2, Camera, Upload } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { api, BACKEND_URL } from '@/lib/api';
import { usePlatforms } from '@/config/platforms';
import { PlatformSelector } from '@/components/PlatformSelector';
import type { InventoryItem, UpdateInventoryItemRequest, UploadImageResponse } from '@/shared/contracts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function ItemDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const loadPlatforms = usePlatforms((s) => s.loadPlatforms);
  const [showSoldPrice, setShowSoldPrice] = useState(false);
  const [soldPrice, setSoldPrice] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Ship by date state
  const [shipByDate, setShipByDate] = useState('');
  const [showShipByDatePicker, setShowShipByDatePicker] = useState(false);
  const [selectedShipByDate, setSelectedShipByDate] = useState(new Date());

  // Reminder state
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderDate, setReminderDate] = useState(new Date());
  const [showReminderDatePicker, setShowReminderDatePicker] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBinNumber, setEditBinNumber] = useState('');
  const [editRackNumber, setEditRackNumber] = useState('');
  const [editPlatforms, setEditPlatforms] = useState<string[]>([]);
  const [editSoldPrice, setEditSoldPrice] = useState('');

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // QR Code fullscreen state
  const [showQrFullscreen, setShowQrFullscreen] = useState(false);

  // QR Code scanner state
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [isCapturingQr, setIsCapturingQr] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const { data: item, isLoading } = useQuery({
    queryKey: ['inventory', id],
    queryFn: () => api.get<InventoryItem>(`/api/inventory/${id}`),
    enabled: !!id,
  });

  // Initialize edit form when item loads
  useEffect(() => {
    if (item) {
      setEditName(item.name);
      setEditDescription(item.description ?? '');
      setEditBinNumber(item.binNumber ?? '');
      setEditRackNumber(item.rackNumber ?? '');
      // Parse platforms from comma-separated string
      const platformList = item.platform ? item.platform.split(',').map((p) => p.trim()).filter(Boolean) : [];
      setEditPlatforms(platformList);
      setEditSoldPrice(item.soldPrice?.toString() ?? '');
    }
  }, [item]);

  // Request notification permissions
  useEffect(() => {
    loadPlatforms();
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
      }
    };
    requestPermissions();
  }, []);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateInventoryItemRequest) =>
      api.patch<InventoryItem>(`/api/inventory/${id}`, data),
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', id] });
      setIsEditing(false);
      setShowSoldPrice(false);
      setSoldPrice('');
      setShipByDate('');
      // If marked as completed, go back to the list
      if (updatedItem.status === 'completed') {
        router.back();
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/inventory/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      router.back();
    },
  });

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${BACKEND_URL}${imageUrl}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'sold': return '#8B5CF6';
      case 'completed': return '#10B981';
      default: return '#64748B';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'In Inventory';
      case 'sold': return 'Ready to Ship';
      case 'completed': return 'Shipped';
      default: return status;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateShort = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleMarkReadyToShip = () => {
    setShowSoldPrice(true);
    // Set default ship by date to 3 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 3);
    setSelectedShipByDate(defaultDate);
    setShipByDate(formatDateShort(defaultDate));
  };

  const handleShipByDateChange = (_event: unknown, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowShipByDatePicker(false);
    }
    if (date) {
      setSelectedShipByDate(date);
      setShipByDate(formatDateShort(date));
    }
  };

  const handleReadyToShipSubmit = () => {
    const price = parseFloat(soldPrice);
    updateMutation.mutate({
      status: 'sold',
      soldPrice: isNaN(price) ? undefined : price,
      shipByDate: selectedShipByDate.toISOString(),
    });
  };

  const handleMarkCompleted = () => {
    updateMutation.mutate({ status: 'completed' });
  };

  const handleMoveBackToShip = () => {
    updateMutation.mutate({ status: 'sold' });
  };

  const handleMoveBackToInventory = () => {
    updateMutation.mutate({
      status: 'pending',
      shipByDate: null,
      shipperQrCode: null,
    });
  };

  // QR Code capture handlers
  const handleOpenQrScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        return;
      }
    }
    setShowQrScanner(true);
  };

  const handleCaptureQrCode = async () => {
    if (!cameraRef.current || isCapturingQr) return;

    setIsCapturingQr(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        await uploadQrCode(photo.uri);
      }
    } catch (error) {
      console.error('Error capturing QR code:', error);
    } finally {
      setIsCapturingQr(false);
    }
  };

  const handlePickQrFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsCapturingQr(true);
        await uploadQrCode(result.assets[0].uri);
        setIsCapturingQr(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setIsCapturingQr(false);
    }
  };

  const uploadQrCode = async (uri: string) => {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri,
        type: 'image/jpeg',
        name: `qr-${id}.jpg`,
      } as unknown as Blob);

      const response = await fetch(`${BACKEND_URL}/api/upload/image`, {
        method: 'POST',
        body: formData,
      });

      const result: UploadImageResponse = await response.json();

      if (result.success && result.url) {
        updateMutation.mutate({ shipperQrCode: result.url });
        setShowQrScanner(false);
      }
    } catch (error) {
      console.error('Error uploading QR code:', error);
    }
  };

  const handleRemoveQrCode = () => {
    updateMutation.mutate({ shipperQrCode: null });
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    deleteMutation.mutate();
  };

  const handleSaveEdit = () => {
    const price = parseFloat(editSoldPrice);
    updateMutation.mutate({
      name: editName,
      description: editDescription || undefined,
      binNumber: editBinNumber || undefined,
      rackNumber: editRackNumber || undefined,
      platform: editPlatforms.length > 0 ? editPlatforms.join(', ') : undefined,
      soldPrice: isNaN(price) ? undefined : price,
    });
  };

  const handleCancelEdit = () => {
    if (item) {
      setEditName(item.name);
      setEditDescription(item.description ?? '');
      setEditBinNumber(item.binNumber ?? '');
      setEditRackNumber(item.rackNumber ?? '');
      const platformList = item.platform ? item.platform.split(',').map((p) => p.trim()).filter(Boolean) : [];
      setEditPlatforms(platformList);
      setEditSoldPrice(item.soldPrice?.toString() ?? '');
    }
    setIsEditing(false);
  };

  const handleSetReminder = () => {
    // Set default reminder to tomorrow at 9 AM
    const defaultReminder = new Date();
    defaultReminder.setDate(defaultReminder.getDate() + 1);
    defaultReminder.setHours(9, 0, 0, 0);
    setReminderDate(defaultReminder);
    setShowReminderModal(true);
  };

  const handleReminderDateChange = (_event: unknown, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowReminderDatePicker(false);
    }
    if (date) {
      const newDate = new Date(reminderDate);
      newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setReminderDate(newDate);
    }
  };

  const handleReminderTimeChange = (_event: unknown, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowReminderTimePicker(false);
    }
    if (date) {
      const newDate = new Date(reminderDate);
      newDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
      setReminderDate(newDate);
    }
  };

  const handleConfirmReminder = async () => {
    if (!item) return;

    try {
      // Schedule the notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Shipping Reminder',
          body: `Don't forget to ship: ${item.name}`,
          data: { itemId: item.id },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate,
        },
      });

      setShowReminderModal(false);
      // Show success feedback
      alert('Reminder set successfully!');
    } catch (error) {
      console.error('Error scheduling notification:', error);
      alert('Failed to set reminder. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-neutral-900 items-center justify-center">
        <ActivityIndicator size="large" color="#06B6D4" />
      </View>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 bg-neutral-900 items-center justify-center">
        <Text className="text-white">Item not found</Text>
        <Pressable
          className="bg-cyan-500 rounded-xl px-6 py-3 mt-4"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-900">
      <LinearGradient
        colors={['#1C1C1E', '#2C2C2E', '#1C1C1E']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Header */}
          <View className="px-5 pt-4 pb-4 flex-row items-center justify-between">
            <Pressable
              className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center active:opacity-80"
              onPress={() => isEditing ? handleCancelEdit() : router.back()}
            >
              {isEditing ? (
                <X size={20} color="#F8FAFC" />
              ) : (
                <ArrowLeft size={20} color="#F8FAFC" />
              )}
            </Pressable>
            <Text className="text-white text-lg font-bold">
              {isEditing ? 'Edit Item' : 'Item Details'}
            </Text>
            {isEditing ? (
              <Pressable
                className="w-10 h-10 rounded-full bg-cyan-500 items-center justify-center active:opacity-80"
                onPress={handleSaveEdit}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Check size={20} color="#FFFFFF" />
                )}
              </Pressable>
            ) : (
              <View className="flex-row gap-2">
                <Pressable
                  className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center active:opacity-80"
                  onPress={() => setIsEditing(true)}
                >
                  <Pencil size={18} color="#06B6D4" />
                </Pressable>
                <Pressable
                  className="w-10 h-10 rounded-full bg-red-500/20 items-center justify-center active:opacity-80"
                  onPress={() => setShowDeleteConfirm(true)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <Trash2 size={18} color="#EF4444" />
                  )}
                </Pressable>
              </View>
            )}
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Item Image */}
            <View className="px-5 mb-6">
              <Image
                source={{ uri: getImageUrl(item.imageUrl) }}
                className="w-full h-72 rounded-2xl bg-slate-700"
                resizeMode="cover"
              />
              <View
                className="absolute bottom-4 left-9 px-4 py-2 rounded-full"
                style={{ backgroundColor: getStatusColor(item.status) }}
              >
                <Text className="text-white text-sm font-bold">{getStatusLabel(item.status)}</Text>
              </View>
            </View>

            {/* Item Info */}
            <View className="px-5">
              {isEditing ? (
                // Edit Mode
                <>
                  <View className="mb-4">
                    <Text className="text-slate-400 text-xs mb-2">Item Name *</Text>
                    <TextInput
                      className="bg-slate-800/60 rounded-xl px-4 py-3 text-white border border-slate-700/50"
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="Enter item name"
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-slate-400 text-xs mb-2">Description</Text>
                    <TextInput
                      className="bg-slate-800/60 rounded-xl px-4 py-3 text-white border border-slate-700/50"
                      value={editDescription}
                      onChangeText={setEditDescription}
                      placeholder="Optional description"
                      placeholderTextColor="#64748B"
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>

                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1">
                      <Text className="text-slate-400 text-xs mb-2">Bin Number</Text>
                      <TextInput
                        className="bg-slate-800/60 rounded-xl px-4 py-3 text-white border border-slate-700/50"
                        value={editBinNumber}
                        onChangeText={setEditBinNumber}
                        placeholder="e.g., A1"
                        placeholderTextColor="#64748B"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-400 text-xs mb-2">Rack Number</Text>
                      <TextInput
                        className="bg-slate-800/60 rounded-xl px-4 py-3 text-white border border-slate-700/50"
                        value={editRackNumber}
                        onChangeText={setEditRackNumber}
                        placeholder="e.g., R01"
                        placeholderTextColor="#64748B"
                      />
                    </View>
                  </View>

                  <View className="mb-4">
                    <PlatformSelector
                      selectedPlatforms={editPlatforms}
                      onSelectPlatforms={setEditPlatforms}
                      showCustomizeLink={false}
                    />
                  </View>

                  {(item.status === 'sold' || item.status === 'completed') && (
                    <View className="mb-4">
                      <Text className="text-slate-400 text-xs mb-2">Sale Price</Text>
                      <TextInput
                        className="bg-slate-800/60 rounded-xl px-4 py-3 text-white border border-slate-700/50"
                        value={editSoldPrice}
                        onChangeText={setEditSoldPrice}
                        placeholder="0.00"
                        placeholderTextColor="#64748B"
                        keyboardType="decimal-pad"
                      />
                    </View>
                  )}
                </>
              ) : (
                // View Mode
                <>
                  <Text className="text-white text-2xl font-bold mb-2">{item.name}</Text>
                  {item.description && (
                    <Text className="text-slate-400 text-base mb-4">{item.description}</Text>
                  )}

                  {/* Location Card */}
                  <View className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50 mb-4">
                    <View className="flex-row items-center mb-3">
                      <MapPin size={18} color="#06B6D4" />
                      <Text className="text-slate-400 text-sm ml-2">Storage Location</Text>
                    </View>
                    <View className="flex-row gap-3">
                      <View className="bg-slate-700/50 px-4 py-3 rounded-xl flex-1">
                        <Text className="text-slate-400 text-xs">Bin</Text>
                        <Text className="text-white font-bold text-xl">{item.binNumber || '—'}</Text>
                      </View>
                      <View className="bg-slate-700/50 px-4 py-3 rounded-xl flex-1">
                        <Text className="text-slate-400 text-xs">Rack</Text>
                        <Text className="text-white font-bold text-xl">{item.rackNumber || '—'}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Platform Card */}
                  {item.platform && (
                    <View className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50 mb-4">
                      <View className="flex-row items-center mb-2">
                        <Tag size={18} color="#06B6D4" />
                        <Text className="text-slate-400 text-sm ml-2">Listed Platform</Text>
                      </View>
                      <Text className="text-cyan-400 font-bold text-lg">{item.platform}</Text>
                    </View>
                  )}

                  {/* Dates Card */}
                  <View className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50 mb-4">
                    <View className="flex-row items-center mb-3">
                      <Calendar size={18} color="#06B6D4" />
                      <Text className="text-slate-400 text-sm ml-2">Timeline</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <View>
                        <Text className="text-slate-500 text-xs">Added</Text>
                        <Text className="text-white text-sm">{formatDate(item.createdAt)}</Text>
                      </View>
                      {item.soldAt && (
                        <View>
                          <Text className="text-slate-500 text-xs">Marked Ready</Text>
                          <Text className="text-white text-sm">{formatDate(item.soldAt)}</Text>
                        </View>
                      )}
                    </View>
                    {item.shipByDate && (
                      <View className="mt-3 pt-3 border-t border-slate-700">
                        <Text className="text-slate-500 text-xs">Ship By</Text>
                        <Text className="text-amber-400 font-semibold">{formatDate(item.shipByDate)}</Text>
                      </View>
                    )}
                    {item.soldPrice != null && item.soldPrice > 0 && (
                      <View className="mt-3 pt-3 border-t border-slate-700">
                        <Text className="text-slate-500 text-xs">Sale Price</Text>
                        <Text className="text-emerald-400 font-bold text-lg">
                          ${item.soldPrice.toFixed(2)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Shipper QR Code Card */}
                  {item.shipperQrCode ? (
                    <View className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50 mb-4">
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center">
                          <QrCode size={18} color="#06B6D4" />
                          <Text className="text-slate-400 text-sm ml-2">Shipping Label QR Code</Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Pressable
                            className="w-8 h-8 rounded-lg bg-red-500/20 items-center justify-center active:opacity-80"
                            onPress={handleRemoveQrCode}
                          >
                            <Trash2 size={14} color="#EF4444" />
                          </Pressable>
                          <Pressable
                            className="w-8 h-8 rounded-lg bg-slate-700/50 items-center justify-center active:opacity-80"
                            onPress={() => setShowQrFullscreen(true)}
                          >
                            <Maximize2 size={16} color="#06B6D4" />
                          </Pressable>
                        </View>
                      </View>
                      <Pressable
                        className="items-center active:opacity-90"
                        onPress={() => setShowQrFullscreen(true)}
                      >
                        <View className="bg-white rounded-2xl p-4">
                          <Image
                            source={{ uri: getImageUrl(item.shipperQrCode) }}
                            style={{ width: SCREEN_WIDTH - 80, height: SCREEN_WIDTH - 80 }}
                            className="rounded-xl"
                            resizeMode="contain"
                          />
                        </View>
                        <Text className="text-slate-500 text-xs mt-3">
                          Tap to view fullscreen
                        </Text>
                      </Pressable>
                    </View>
                  ) : item.status === 'sold' && (
                    <Pressable
                      className="bg-slate-800/60 rounded-2xl p-4 border border-dashed border-slate-600 mb-4 active:opacity-80"
                      onPress={handleOpenQrScanner}
                    >
                      <View className="items-center py-4">
                        <View className="bg-cyan-500/20 w-14 h-14 rounded-full items-center justify-center mb-3">
                          <QrCode size={28} color="#06B6D4" />
                        </View>
                        <Text className="text-white font-semibold text-base">Add Shipping QR Code</Text>
                        <Text className="text-slate-400 text-sm mt-1">
                          Capture or upload the shipper's QR code
                        </Text>
                      </View>
                    </Pressable>
                  )}

                  {/* Action Buttons based on status */}
                  {item.status === 'pending' && (
                    <View className="mb-6">
                      <Pressable
                        className="bg-violet-500 rounded-2xl py-4 flex-row items-center justify-center active:opacity-80"
                        onPress={handleMarkReadyToShip}
                        disabled={updateMutation.isPending}
                      >
                        <Truck size={20} color="#FFFFFF" />
                        <Text className="text-white font-bold text-base ml-2">Mark Ready to Ship</Text>
                      </Pressable>
                    </View>
                  )}

                  {item.status === 'sold' && (
                    <View className="mb-6">
                      <Pressable
                        className="bg-emerald-500 rounded-2xl py-4 flex-row items-center justify-center active:opacity-80"
                        onPress={handleMarkCompleted}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <CheckCircle size={20} color="#FFFFFF" />
                            <Text className="text-white font-bold text-base ml-2">Mark as Shipped</Text>
                          </>
                        )}
                      </Pressable>

                      {/* Add Reminder Button */}
                      <Pressable
                        className="bg-amber-500/20 rounded-2xl py-4 flex-row items-center justify-center active:opacity-80 mt-3 border border-amber-500/50"
                        onPress={handleSetReminder}
                      >
                        <Bell size={20} color="#F59E0B" />
                        <Text className="text-amber-400 font-bold text-base ml-2">Add Reminder</Text>
                      </Pressable>

                      {/* Move Back to Inventory Button */}
                      <Pressable
                        className="bg-slate-700/50 rounded-2xl py-4 flex-row items-center justify-center active:opacity-80 mt-3 border border-slate-600"
                        onPress={handleMoveBackToInventory}
                        disabled={updateMutation.isPending}
                      >
                        <RotateCcw size={20} color="#94A3B8" />
                        <Text className="text-slate-300 font-bold text-base ml-2">Move Back to Inventory</Text>
                      </Pressable>
                    </View>
                  )}

                  {item.status === 'completed' && (
                    <View className="mb-6">
                      <View className="bg-emerald-500/20 rounded-2xl p-4 border border-emerald-500/50 mb-3">
                        <View className="flex-row items-center justify-center">
                          <CheckCircle size={20} color="#10B981" />
                          <Text className="text-emerald-400 font-bold text-base ml-2">Item Shipped</Text>
                        </View>
                      </View>
                      <Pressable
                        className="bg-violet-500/20 rounded-2xl py-4 flex-row items-center justify-center active:opacity-80 border border-violet-500/50"
                        onPress={handleMoveBackToShip}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? (
                          <ActivityIndicator size="small" color="#8B5CF6" />
                        ) : (
                          <>
                            <RotateCcw size={20} color="#8B5CF6" />
                            <Text className="text-violet-400 font-bold text-base ml-2">Move Back to To Ship</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  )}

                  {/* Ready to Ship Form */}
                  {showSoldPrice && (
                    <View className="bg-slate-800/60 rounded-2xl p-4 border border-violet-500/50 mb-6">
                      {/* Sale Price */}
                      <View className="flex-row items-center mb-3">
                        <DollarSign size={18} color="#8B5CF6" />
                        <Text className="text-white font-semibold ml-2">Sale Price (Optional)</Text>
                      </View>
                      <TextInput
                        className="bg-slate-700/50 rounded-xl px-4 py-3 text-white text-lg mb-4"
                        placeholder="0.00"
                        placeholderTextColor="#64748B"
                        value={soldPrice}
                        onChangeText={setSoldPrice}
                        keyboardType="decimal-pad"
                      />

                      {/* Ship By Date */}
                      <View className="flex-row items-center mb-3">
                        <Calendar size={18} color="#F59E0B" />
                        <Text className="text-white font-semibold ml-2">Ship By Date</Text>
                      </View>
                      <Pressable
                        className="bg-slate-700/50 rounded-xl px-4 py-3 mb-4"
                        onPress={() => setShowShipByDatePicker(true)}
                      >
                        <Text className="text-white text-lg">
                          {shipByDate || 'Select date'}
                        </Text>
                      </Pressable>

                      {showShipByDatePicker && (
                        <View className="bg-slate-700 rounded-xl mb-4 overflow-hidden">
                          <DateTimePicker
                            value={selectedShipByDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleShipByDateChange}
                            minimumDate={new Date()}
                            textColor="#FFFFFF"
                            themeVariant="dark"
                          />
                          {Platform.OS === 'ios' && (
                            <Pressable
                              className="bg-cyan-500 py-2 items-center"
                              onPress={() => setShowShipByDatePicker(false)}
                            >
                              <Text className="text-white font-semibold">Done</Text>
                            </Pressable>
                          )}
                        </View>
                      )}

                      <View className="flex-row gap-3">
                        <Pressable
                          className="flex-1 bg-slate-700 rounded-xl py-3 items-center active:opacity-80"
                          onPress={() => {
                            setShowSoldPrice(false);
                            setSoldPrice('');
                            setShipByDate('');
                          }}
                        >
                          <Text className="text-white font-semibold">Cancel</Text>
                        </Pressable>
                        <Pressable
                          className="flex-1 bg-violet-500 rounded-xl py-3 items-center active:opacity-80"
                          onPress={handleReadyToShipSubmit}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text className="text-white font-semibold">Confirm</Text>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>

            <View className="h-8" />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Reminder Modal */}
      <Modal
        visible={showReminderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReminderModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-slate-900 rounded-t-3xl p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Pressable
                className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center"
                onPress={() => setShowReminderModal(false)}
              >
                <X size={20} color="#F8FAFC" />
              </Pressable>
              <Text className="text-white text-lg font-bold">Set Reminder</Text>
              <Pressable
                className="w-10 h-10 rounded-full bg-amber-500 items-center justify-center"
                onPress={handleConfirmReminder}
              >
                <Check size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            <View className="bg-slate-800/60 rounded-xl p-3 mb-4 flex-row items-center">
              <Image
                source={{ uri: getImageUrl(item.imageUrl) }}
                className="w-12 h-12 rounded-lg bg-slate-700"
              />
              <Text className="text-white font-semibold ml-3 flex-1" numberOfLines={1}>
                {item.name}
              </Text>
            </View>

            {/* Date Selection */}
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <Calendar size={16} color="#F59E0B" />
                <Text className="text-white font-semibold ml-2">Reminder Date</Text>
              </View>
              <Pressable
                className="bg-slate-800 rounded-xl px-4 py-3"
                onPress={() => setShowReminderDatePicker(true)}
              >
                <Text className="text-white text-base">{formatDateShort(reminderDate)}</Text>
              </Pressable>
            </View>

            {showReminderDatePicker && (
              <View className="bg-slate-800 rounded-xl mb-4 overflow-hidden">
                <DateTimePicker
                  value={reminderDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleReminderDateChange}
                  minimumDate={new Date()}
                  textColor="#FFFFFF"
                  themeVariant="dark"
                />
                {Platform.OS === 'ios' && (
                  <Pressable
                    className="bg-cyan-500 py-2 items-center"
                    onPress={() => setShowReminderDatePicker(false)}
                  >
                    <Text className="text-white font-semibold">Done</Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Time Selection */}
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <Clock size={16} color="#F59E0B" />
                <Text className="text-white font-semibold ml-2">Reminder Time</Text>
              </View>
              <Pressable
                className="bg-slate-800 rounded-xl px-4 py-3"
                onPress={() => setShowReminderTimePicker(true)}
              >
                <Text className="text-white text-base">{formatTime(reminderDate)}</Text>
              </Pressable>
            </View>

            {showReminderTimePicker && (
              <View className="bg-slate-800 rounded-xl mb-4 overflow-hidden">
                <DateTimePicker
                  value={reminderDate}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleReminderTimeChange}
                  textColor="#FFFFFF"
                  themeVariant="dark"
                />
                {Platform.OS === 'ios' && (
                  <Pressable
                    className="bg-cyan-500 py-2 items-center"
                    onPress={() => setShowReminderTimePicker(false)}
                  >
                    <Text className="text-white font-semibold">Done</Text>
                  </Pressable>
                )}
              </View>
            )}

            <View className="bg-amber-500/20 rounded-xl p-3 flex-row items-center">
              <Bell size={16} color="#F59E0B" />
              <Text className="text-amber-400 text-sm ml-2 flex-1">
                You'll receive a notification at {formatTime(reminderDate)} on {formatDateShort(reminderDate)}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-slate-900 rounded-2xl p-6 w-full max-w-sm border border-slate-700">
            <View className="items-center mb-4">
              <View className="bg-red-500/20 w-16 h-16 rounded-full items-center justify-center mb-4">
                <AlertTriangle size={32} color="#EF4444" />
              </View>
              <Text className="text-white text-xl font-bold text-center">Delete Item?</Text>
              <Text className="text-slate-400 text-center mt-2">
                Are you sure you want to delete "{item?.name ?? 'this item'}"? This action cannot be undone.
              </Text>
            </View>

            <View className="flex-row gap-3 mt-4">
              <Pressable
                className="flex-1 bg-slate-700 rounded-xl py-3 items-center active:opacity-80"
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                className="flex-1 bg-red-500 rounded-xl py-3 items-center active:opacity-80"
                onPress={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold">Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* QR Code Fullscreen Modal */}
      <Modal
        visible={showQrFullscreen}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQrFullscreen(false)}
      >
        <Pressable
          className="flex-1 bg-black/90 justify-center items-center"
          onPress={() => setShowQrFullscreen(false)}
        >
          <View className="items-center">
            <View className="bg-white rounded-3xl p-6">
              {item?.shipperQrCode && (
                <Image
                  source={{ uri: getImageUrl(item.shipperQrCode) }}
                  style={{ width: SCREEN_WIDTH - 60, height: SCREEN_WIDTH - 60 }}
                  resizeMode="contain"
                />
              )}
            </View>
            <Text className="text-white text-sm mt-6">Tap anywhere to close</Text>
            <Text className="text-slate-400 text-xs mt-2">
              Scan this QR code at the shipping carrier
            </Text>
          </View>
        </Pressable>
      </Modal>

      {/* QR Code Scanner Modal */}
      <Modal
        visible={showQrScanner}
        animationType="slide"
        onRequestClose={() => setShowQrScanner(false)}
      >
        <View className="flex-1 bg-neutral-900">
          <SafeAreaView className="flex-1">
            {/* Header */}
            <View className="px-5 pt-4 pb-4 flex-row items-center justify-between">
              <Pressable
                className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center"
                onPress={() => setShowQrScanner(false)}
              >
                <X size={20} color="#F8FAFC" />
              </Pressable>
              <Text className="text-white text-lg font-bold">Add Shipper QR Code</Text>
              <View className="w-10" />
            </View>

            {item && (
              <View className="px-5 mb-4">
                <View className="bg-slate-800/60 rounded-xl p-3 flex-row items-center">
                  <Image
                    source={{ uri: getImageUrl(item.imageUrl) }}
                    className="w-12 h-12 rounded-lg bg-slate-700"
                  />
                  <Text className="text-white font-semibold ml-3 flex-1" numberOfLines={1}>
                    {item.name}
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
                  onPress={handlePickQrFromGallery}
                  disabled={isCapturingQr}
                >
                  <Upload size={20} color="#FFFFFF" />
                  <Text className="text-white font-bold ml-2">From Gallery</Text>
                </Pressable>
                <Pressable
                  className="flex-1 bg-cyan-500 rounded-2xl py-4 flex-row items-center justify-center active:opacity-80"
                  onPress={handleCaptureQrCode}
                  disabled={isCapturingQr || !permission?.granted}
                >
                  {isCapturingQr ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Camera size={20} color="#FFFFFF" />
                      <Text className="text-white font-bold ml-2">Capture</Text>
                    </>
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
