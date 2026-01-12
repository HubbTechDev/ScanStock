import React from 'react';
import { View, Text, ScrollView, Pressable, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Package, Truck, CheckCircle, Camera, Search, AlertTriangle, MapPin, DollarSign, Settings } from 'lucide-react-native';
import { api, BACKEND_URL } from '@/lib/api';
import type { GetInventoryResponse } from '@/shared/contracts';

export default function HomeScreen() {
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.get<GetInventoryResponse>('/api/inventory'),
  });

  const stats = data?.stats ?? { total: 0, pending: 0, completed: 0, sold: 0 };

  // Items ready to ship (sold status)
  const toShipItems = data?.items?.filter((item) => item.status === 'sold') ?? [];

  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${BACKEND_URL}${imageUrl}`;
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

  const getUrgencyInfo = (shipByDate: string | null) => {
    const days = getDaysUntilShip(shipByDate);
    if (days === null) return { color: '#64748B', label: 'No date', urgent: false };
    if (days < 0) return { color: '#EF4444', label: 'Overdue', urgent: true };
    if (days === 0) return { color: '#F59E0B', label: 'Today', urgent: true };
    if (days === 1) return { color: '#F59E0B', label: 'Tomorrow', urgent: true };
    if (days <= 3) return { color: '#F59E0B', label: `${days} days`, urgent: true };
    return { color: '#10B981', label: `${days} days`, urgent: false };
  };

  // Sort by urgency
  const sortedToShipItems = [...toShipItems].sort((a, b) => {
    if (!a.shipByDate && !b.shipByDate) return 0;
    if (!a.shipByDate) return 1;
    if (!b.shipByDate) return -1;
    return new Date(a.shipByDate).getTime() - new Date(b.shipByDate).getTime();
  });

  // Count urgent items
  const urgentCount = toShipItems.filter((item) => {
    const days = getDaysUntilShip(item.shipByDate);
    return days !== null && days <= 1;
  }).length;

  // Calculate total revenue from completed items
  const totalRevenue = data?.items
    ?.filter((item) => item.status === 'completed' && item.soldPrice != null)
    .reduce((sum, item) => sum + (item.soldPrice ?? 0), 0) ?? 0;

  return (
    <View className="flex-1 bg-neutral-900">
      <LinearGradient
        colors={['#1C1C1E', '#2C2C2E', '#1C1C1E']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#06B6D4"
            />
          }
        >
          {/* Header */}
          <View className="px-5 pt-4 pb-6 flex-row items-start justify-between">
            <View>
              <Text className="text-slate-400 text-sm font-medium">Welcome back</Text>
              <Text className="text-white text-3xl font-bold mt-1">Dashboard</Text>
            </View>
            <Pressable
              className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center active:opacity-80"
              onPress={() => router.push('/storage-settings')}
            >
              <Settings size={20} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Stats Cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            style={{ flexGrow: 0 }}
          >
            <View className="bg-slate-800/60 rounded-2xl p-4 w-36 border border-slate-700/50">
              <View className="bg-amber-500/20 w-10 h-10 rounded-xl items-center justify-center mb-3">
                <Package size={20} color="#F59E0B" />
              </View>
              <Text className="text-slate-400 text-xs font-medium">In Inventory</Text>
              <Text className="text-white text-2xl font-bold mt-1">{stats.pending}</Text>
            </View>

            <View className="bg-slate-800/60 rounded-2xl p-4 w-36 border border-slate-700/50">
              <View className="bg-violet-500/20 w-10 h-10 rounded-xl items-center justify-center mb-3">
                <Truck size={20} color="#8B5CF6" />
              </View>
              <Text className="text-slate-400 text-xs font-medium">To Ship</Text>
              <Text className="text-white text-2xl font-bold mt-1">{stats.sold}</Text>
            </View>

            <View className="bg-slate-800/60 rounded-2xl p-4 w-36 border border-slate-700/50">
              <View className="bg-emerald-500/20 w-10 h-10 rounded-xl items-center justify-center mb-3">
                <CheckCircle size={20} color="#10B981" />
              </View>
              <Text className="text-slate-400 text-xs font-medium">Shipped</Text>
              <Text className="text-white text-2xl font-bold mt-1">{stats.completed}</Text>
            </View>
          </ScrollView>

          {/* Total Revenue Card */}
          <View className="px-5 mt-4">
            <View className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50 flex-row items-center">
              <View className="bg-cyan-500/20 w-12 h-12 rounded-xl items-center justify-center">
                <DollarSign size={24} color="#06B6D4" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-slate-400 text-xs font-medium">Total Revenue</Text>
                <Text className="text-cyan-400 text-2xl font-bold">
                  ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="px-5 mt-8">
            <Text className="text-white text-lg font-bold mb-4">Quick Actions</Text>
            <View className="flex-row gap-3">
              <Pressable
                className="flex-1 bg-cyan-500 rounded-2xl p-4 flex-row items-center justify-center gap-2 active:opacity-80"
                onPress={() => router.push('/add-item')}
              >
                <Camera size={20} color="#FFFFFF" />
                <Text className="text-white font-bold">Add Item</Text>
              </Pressable>
              <Pressable
                className="flex-1 bg-slate-700 rounded-2xl p-4 flex-row items-center justify-center gap-2 active:opacity-80"
                onPress={() => router.push('/(tabs)/search')}
              >
                <Search size={20} color="#FFFFFF" />
                <Text className="text-white font-bold">Find Item</Text>
              </Pressable>
            </View>
          </View>

          {/* To Ship Items */}
          <View className="px-5 mt-8 pb-8">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Text className="text-white text-lg font-bold">Ready to Ship</Text>
                {urgentCount > 0 && (
                  <View className="flex-row items-center ml-3 bg-amber-500/20 px-2 py-1 rounded-full">
                    <AlertTriangle size={12} color="#F59E0B" />
                    <Text className="text-amber-500 text-xs font-semibold ml-1">
                      {urgentCount} urgent
                    </Text>
                  </View>
                )}
              </View>
              <Pressable onPress={() => router.push('/(tabs)/ready-to-ship')}>
                <Text className="text-cyan-400 text-sm font-medium">View All</Text>
              </Pressable>
            </View>

            {isLoading ? (
              <View className="bg-slate-800/60 rounded-2xl p-8 items-center border border-slate-700/50">
                <Text className="text-slate-400">Loading...</Text>
              </View>
            ) : sortedToShipItems.length === 0 ? (
              <View className="bg-slate-800/60 rounded-2xl p-8 items-center border border-slate-700/50">
                <Truck size={40} color="#64748B" />
                <Text className="text-slate-400 mt-3 text-center">No items to ship</Text>
                <Text className="text-slate-500 text-sm mt-1 text-center">
                  Items marked as sold will appear here
                </Text>
              </View>
            ) : (
              sortedToShipItems.slice(0, 5).map((item) => {
                const urgency = getUrgencyInfo(item.shipByDate);
                return (
                  <Pressable
                    key={item.id}
                    className={`bg-slate-800/60 rounded-2xl p-4 mb-3 flex-row items-center border active:opacity-80 ${
                      urgency.urgent ? 'border-amber-500/50' : 'border-slate-700/50'
                    }`}
                    onPress={() => router.push(`/item/${item.id}`)}
                  >
                    <Image
                      source={{ uri: getImageUrl(item.imageUrl) }}
                      className="w-16 h-16 rounded-xl bg-slate-700"
                    />
                    <View className="flex-1 ml-4">
                      <Text className="text-white font-bold text-base" numberOfLines={1}>{item.name}</Text>
                      <View className="flex-row items-center mt-1">
                        <MapPin size={12} color="#64748B" />
                        <Text className="text-slate-400 text-xs ml-1">
                          Bin {item.binNumber || '—'} • Rack {item.rackNumber || '—'}
                        </Text>
                      </View>
                      <Text className="text-cyan-400 text-xs mt-1">{item.platform}</Text>
                    </View>
                    <View
                      className="px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: `${urgency.color}20` }}
                    >
                      <Text style={{ color: urgency.color }} className="text-xs font-semibold">
                        {urgency.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
