import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Plus, Trash2, Pencil, X, Check, ShoppingBag, Package, Heart, Shirt, Tag, Users, Sparkles, MessageCircle, Store, Palette } from 'lucide-react-native';
import { usePlatforms, type Platform } from '@/lib/platforms';
import { cn } from '@/lib/cn';

const iconOptions = [
  { name: 'ShoppingBag', component: ShoppingBag },
  { name: 'Package', component: Package },
  { name: 'Heart', component: Heart },
  { name: 'Shirt', component: Shirt },
  { name: 'Tag', component: Tag },
  { name: 'Users', component: Users },
  { name: 'Sparkles', component: Sparkles },
  { name: 'MessageCircle', component: MessageCircle },
  { name: 'Store', component: Store },
];

const colorOptions = [
  '#E53238', // eBay red
  '#FF9900', // Amazon orange
  '#F56400', // Etsy orange
  '#7F0353', // Poshmark pink
  '#FF0211', // Mercari red
  '#1877F2', // Facebook blue
  '#FF2300', // Depop red
  '#00AB80', // OfferUp green
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#EC4899', // Pink
];

export default function PlatformSettingsScreen() {
  const router = useRouter();
  const { platforms, isLoaded, loadPlatforms, updatePlatform, addPlatform, removePlatform } = usePlatforms();

  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('Store');
  const [editColor, setEditColor] = useState('#6366F1');

  useEffect(() => {
    loadPlatforms();
  }, []);

  const handleEditPlatform = (platform: Platform) => {
    setEditingPlatform(platform);
    setEditName(platform.name);
    setEditIcon(platform.icon);
    setEditColor(platform.color);
  };

  const handleSaveEdit = async () => {
    if (editingPlatform && editName.trim()) {
      await updatePlatform(editingPlatform.id, {
        name: editName.trim(),
        icon: editIcon,
        color: editColor,
      });
      setEditingPlatform(null);
    }
  };

  const handleTogglePlatform = async (platform: Platform) => {
    await updatePlatform(platform.id, { enabled: !platform.enabled });
  };

  const handleRemovePlatform = (platform: Platform) => {
    Alert.alert(
      'Remove Platform',
      `Are you sure you want to remove "${platform.name}"? This will not affect existing items.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removePlatform(platform.id),
        },
      ]
    );
  };

  const handleAddPlatform = async () => {
    await addPlatform();
  };

  const getIconComponent = (iconName: string) => {
    const icon = iconOptions.find((i) => i.name === iconName);
    return icon?.component || Store;
  };

  if (!isLoaded) {
    return (
      <View className="flex-1 bg-neutral-900 items-center justify-center">
        <Text className="text-white">Loading...</Text>
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
        {/* Header */}
        <View className="px-5 pt-4 pb-4 flex-row items-center justify-between">
          <Pressable
            className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center active:opacity-80"
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color="#F8FAFC" />
          </Pressable>
          <Text className="text-white text-lg font-bold">Listing Platforms</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Description */}
          <View className="px-5 mb-6">
            <View className="bg-cyan-500/10 rounded-2xl p-4 border border-cyan-500/30">
              <View className="flex-row items-center mb-2">
                <Tag size={18} color="#06B6D4" />
                <Text className="text-cyan-400 font-semibold ml-2">Customize Your Platforms</Text>
              </View>
              <Text className="text-slate-400 text-sm">
                Add the selling platforms you use. Select a platform when marking items to track where each sale comes from.
              </Text>
            </View>
          </View>

          {/* Platform List */}
          <View className="px-5">
            <Text className="text-white font-bold text-lg mb-3">Platforms</Text>

            {platforms.map((platform) => {
              const Icon = getIconComponent(platform.icon);
              return (
                <View
                  key={platform.id}
                  className={cn(
                    'bg-slate-800/60 rounded-2xl p-4 mb-3 border',
                    platform.enabled ? 'border-slate-700/50' : 'border-slate-800 opacity-60'
                  )}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: `${platform.color}20` }}
                      >
                        <Icon size={20} color={platform.color} />
                      </View>
                      <Text className="text-white font-semibold flex-1">{platform.name}</Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                      <Pressable
                        className="w-9 h-9 rounded-lg bg-slate-700/50 items-center justify-center active:opacity-80"
                        onPress={() => handleEditPlatform(platform)}
                      >
                        <Pencil size={16} color="#06B6D4" />
                      </Pressable>
                      <Pressable
                        className={cn(
                          'w-9 h-9 rounded-lg items-center justify-center active:opacity-80',
                          platform.enabled ? 'bg-cyan-500' : 'bg-slate-700/50'
                        )}
                        onPress={() => handleTogglePlatform(platform)}
                      >
                        <Check size={16} color={platform.enabled ? '#FFFFFF' : '#64748B'} />
                      </Pressable>
                      <Pressable
                        className="w-9 h-9 rounded-lg bg-red-500/20 items-center justify-center active:opacity-80"
                        onPress={() => handleRemovePlatform(platform)}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Add New Platform Button */}
            <Pressable
              className="bg-slate-800/40 rounded-2xl p-4 border border-dashed border-slate-600 flex-row items-center justify-center active:opacity-80"
              onPress={handleAddPlatform}
            >
              <Plus size={20} color="#06B6D4" />
              <Text className="text-cyan-400 font-semibold ml-2">Add Platform</Text>
            </Pressable>
          </View>

          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>

      {/* Edit Platform Modal */}
      <Modal
        visible={editingPlatform !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingPlatform(null)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-slate-900 rounded-t-3xl p-5">
            <View className="flex-row items-center justify-between mb-6">
              <Pressable
                className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center"
                onPress={() => setEditingPlatform(null)}
              >
                <X size={20} color="#F8FAFC" />
              </Pressable>
              <Text className="text-white text-lg font-bold">Edit Platform</Text>
              <Pressable
                className="w-10 h-10 rounded-full bg-cyan-500 items-center justify-center"
                onPress={handleSaveEdit}
              >
                <Check size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* Platform Name */}
            <View className="mb-5">
              <Text className="text-slate-400 text-sm mb-2">Platform Name</Text>
              <TextInput
                className="bg-slate-800 rounded-xl px-4 py-3 text-white border border-slate-700"
                value={editName}
                onChangeText={setEditName}
                placeholder="e.g., eBay"
                placeholderTextColor="#64748B"
              />
            </View>

            {/* Icon Selection */}
            <View className="mb-5">
              <Text className="text-slate-400 text-sm mb-2">Icon</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0 }}
                contentContainerStyle={{ gap: 8 }}
              >
                {iconOptions.map((icon) => {
                  const IconComp = icon.component;
                  const isSelected = editIcon === icon.name;
                  return (
                    <Pressable
                      key={icon.name}
                      className={cn(
                        'w-12 h-12 rounded-xl items-center justify-center',
                        isSelected ? 'bg-cyan-500' : 'bg-slate-800'
                      )}
                      onPress={() => setEditIcon(icon.name)}
                    >
                      <IconComp size={24} color={isSelected ? '#FFFFFF' : editColor} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Color Selection */}
            <View className="mb-6">
              <View className="flex-row items-center mb-2">
                <Palette size={14} color="#94A3B8" />
                <Text className="text-slate-400 text-sm ml-1">Color</Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {colorOptions.map((color) => {
                  const isSelected = editColor === color;
                  return (
                    <Pressable
                      key={color}
                      className={cn(
                        'w-10 h-10 rounded-full items-center justify-center',
                        isSelected ? 'border-2 border-white' : ''
                      )}
                      style={{ backgroundColor: color }}
                      onPress={() => setEditColor(color)}
                    >
                      {isSelected && <Check size={16} color="#FFFFFF" />}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Preview */}
            <View className="bg-slate-800/60 rounded-xl p-4 items-center">
              <Text className="text-slate-500 text-xs mb-2">Preview</Text>
              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: `${editColor}20` }}
                >
                  {React.createElement(getIconComponent(editIcon), { size: 20, color: editColor })}
                </View>
                <Text className="text-white font-semibold">{editName || 'Platform Name'}</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
