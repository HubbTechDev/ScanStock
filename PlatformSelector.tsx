import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Settings, Check, ShoppingBag, Package, Heart, Shirt, Tag, Users, Sparkles, MessageCircle, Store } from 'lucide-react-native';
import { usePlatforms, type Platform } from '@/lib/platforms';
import { cn } from '@/lib/cn';

interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onSelectPlatforms: (platformNames: string[]) => void;
  showCustomizeLink?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  ShoppingBag,
  Package,
  Heart,
  Shirt,
  Tag,
  Users,
  Sparkles,
  MessageCircle,
  Store,
};

const getIconComponent = (iconName: string) => {
  return iconMap[iconName] || Store;
};

export function PlatformSelector({
  selectedPlatforms,
  onSelectPlatforms,
  showCustomizeLink = true
}: PlatformSelectorProps) {
  const router = useRouter();
  const platforms = usePlatforms((s) => s.platforms);

  const enabledPlatforms = platforms.filter((p) => p.enabled);

  const handleSelect = (platform: Platform) => {
    const isSelected = selectedPlatforms.includes(platform.name);
    if (isSelected) {
      // Remove from selection
      onSelectPlatforms(selectedPlatforms.filter((p) => p !== platform.name));
    } else {
      // Add to selection
      onSelectPlatforms([...selectedPlatforms, platform.name]);
    }
  };

  return (
    <View>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-slate-400 text-xs">
          Platforms (Optional){selectedPlatforms.length > 0 && ` · ${selectedPlatforms.length} selected`}
        </Text>
        {showCustomizeLink && (
          <Pressable
            className="flex-row items-center gap-1 active:opacity-80"
            onPress={() => router.push('/platform-settings')}
          >
            <Settings size={14} color="#06B6D4" />
            <Text className="text-cyan-400 text-xs">Customize</Text>
          </Pressable>
        )}
      </View>

      {enabledPlatforms.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ gap: 10 }}
        >
          {enabledPlatforms.map((platform) => {
            const Icon = getIconComponent(platform.icon);
            const isSelected = selectedPlatforms.includes(platform.name);

            return (
              <Pressable
                key={platform.id}
                className={cn(
                  'items-center justify-center px-4 py-3 rounded-xl border active:opacity-80',
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/20'
                    : 'border-slate-700/50 bg-slate-800/60'
                )}
                onPress={() => handleSelect(platform)}
                style={{ minWidth: 80 }}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mb-2"
                  style={{ backgroundColor: isSelected ? '#06B6D420' : `${platform.color}20` }}
                >
                  {isSelected ? (
                    <Check size={20} color="#06B6D4" />
                  ) : (
                    <Icon size={20} color={platform.color} />
                  )}
                </View>
                <Text
                  className={cn(
                    'text-xs font-medium text-center',
                    isSelected ? 'text-cyan-400' : 'text-slate-300'
                  )}
                  numberOfLines={1}
                >
                  {platform.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <Pressable
          className="bg-slate-800/40 rounded-xl p-4 border border-dashed border-slate-600 items-center active:opacity-80"
          onPress={() => router.push('/platform-settings')}
        >
          <Text className="text-slate-400 text-sm">No platforms configured</Text>
          <Text className="text-cyan-400 text-xs mt-1">Tap to add platforms</Text>
        </Pressable>
      )}
    </View>
  );
}
