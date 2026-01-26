import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { DollarSign, TrendingUp, Package, Calendar, Search, CheckCircle } from 'lucide-react-native';
import { api, BACKEND_URL } from '@/lib/api';
import type { GetInventoryResponse } from '@/shared/contracts';

export default function SoldScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.get<GetInventoryResponse>('/api/inventory'),
  });

  // Show completed (shipped) items
  const completedItems = data?.items?.filter((item) => item.status === 'completed') ?? [];
  const totalRevenue = completedItems.reduce((sum, item) => sum + (item.soldPrice ?? 0), 0);

  const filteredItems = completedItems.filter((item) => {
    if (!searchQuery) return true;
    return (
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.platform?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    );
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
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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
          <View className="px-5 pt-4 pb-4">
            <Text className="text-white text-2xl font-bold">Shipped Items</Text>
            <Text className="text-slate-400 text-sm mt-1">Your completed sales history</Text>
          </View>

          {/* Stats Cards */}
          <View className="px-5 flex-row gap-3 mb-4">
            <View className="flex-1 bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
              <View className="bg-emerald-500/20 w-10 h-10 rounded-xl items-center justify-center mb-3">
                <DollarSign size={20} color="#10B981" />
              </View>
              <Text className="text-slate-400 text-xs font-medium">Total Revenue</Text>
              <Text className="text-white text-xl font-bold mt-1">
                {formatCurrency(totalRevenue)}
              </Text>
            </View>
            <View className="flex-1 bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
              <View className="bg-cyan-500/20 w-10 h-10 rounded-xl items-center justify-center mb-3">
                <TrendingUp size={20} color="#06B6D4" />
              </View>
              <Text className="text-slate-400 text-xs font-medium">Items Shipped</Text>
              <Text className="text-white text-xl font-bold mt-1">{completedItems.length}</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View className="px-5 mb-4">
            <View className="bg-slate-800/60 rounded-xl flex-row items-center px-4 border border-slate-700/50">
              <Search size={20} color="#64748B" />
              <TextInput
                className="flex-1 py-3 px-3 text-white"
                placeholder="Search shipped items..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Shipped Items List */}
          <View className="px-5">
            <Text className="text-white font-bold text-lg mb-4">Sales History</Text>

            {isLoading ? (
              <View className="bg-slate-800/60 rounded-2xl p-8 items-center border border-slate-700/50">
                <Text className="text-slate-400">Loading...</Text>
              </View>
            ) : filteredItems.length === 0 ? (
              <View className="bg-slate-800/60 rounded-2xl p-8 items-center border border-slate-700/50">
                <Package size={40} color="#64748B" />
                <Text className="text-slate-400 mt-3 text-center">
                  {searchQuery ? 'No matching items' : 'No shipped items yet'}
                </Text>
                <Text className="text-slate-500 text-sm mt-1 text-center">
                  Items marked as shipped will appear here
                </Text>
              </View>
            ) : (
              filteredItems.map((item) => (
                <Pressable
                  key={item.id}
                  className="bg-slate-800/60 rounded-2xl p-4 mb-3 border border-emerald-500/30 active:opacity-80"
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
                      <View className="flex-row items-center mt-2">
                        <Calendar size={14} color="#64748B" />
                        <Text className="text-slate-400 text-xs ml-1.5">
                          Shipped {formatDate(item.updatedAt)}
                        </Text>
                      </View>
                      <Text className="text-cyan-400 text-xs mt-1">
                        {item.platform}
                      </Text>
                    </View>
                    <View className="items-end">
                      {item.soldPrice ? (
                        <Text className="text-emerald-400 font-bold text-lg">
                          {formatCurrency(item.soldPrice)}
                        </Text>
                      ) : (
                        <Text className="text-slate-500 text-sm">No price</Text>
                      )}
                      <View className="flex-row items-center mt-2">
                        <CheckCircle size={14} color="#10B981" />
                        <Text className="text-emerald-400 text-xs ml-1">Shipped</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </View>

          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
