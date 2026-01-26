import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PLATFORMS_KEY = 'listing_platforms_config';

export interface Platform {
  id: string;
  name: string;
  icon: string; // lucide icon name
  color: string; // hex color
  enabled: boolean;
}

interface PlatformsState {
  platforms: Platform[];
  isLoaded: boolean;
  loadPlatforms: () => Promise<void>;
  updatePlatform: (id: string, updates: Partial<Platform>) => Promise<void>;
  addPlatform: () => Promise<void>;
  removePlatform: (id: string) => Promise<void>;
  reorderPlatforms: (platforms: Platform[]) => Promise<void>;
}

const defaultPlatforms: Platform[] = [
  { id: 'ebay', name: 'eBay', icon: 'ShoppingBag', color: '#E53238', enabled: true },
  { id: 'amazon', name: 'Amazon', icon: 'Package', color: '#FF9900', enabled: true },
  { id: 'etsy', name: 'Etsy', icon: 'Heart', color: '#F56400', enabled: true },
  { id: 'poshmark', name: 'Poshmark', icon: 'Shirt', color: '#7F0353', enabled: true },
  { id: 'mercari', name: 'Mercari', icon: 'Tag', color: '#FF0211', enabled: true },
  { id: 'facebook', name: 'Facebook', icon: 'Users', color: '#1877F2', enabled: true },
  { id: 'depop', name: 'Depop', icon: 'Sparkles', color: '#FF2300', enabled: true },
  { id: 'offerup', name: 'OfferUp', icon: 'MessageCircle', color: '#00AB80', enabled: true },
];

export const usePlatforms = create<PlatformsState>((set, get) => ({
  platforms: defaultPlatforms,
  isLoaded: false,

  loadPlatforms: async () => {
    try {
      const saved = await AsyncStorage.getItem(PLATFORMS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Platform[];
        set({ platforms: parsed, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch (error) {
      console.error('Error loading platforms:', error);
      set({ isLoaded: true });
    }
  },

  updatePlatform: async (id, updates) => {
    const { platforms } = get();
    const updatedPlatforms = platforms.map((platform) =>
      platform.id === id ? { ...platform, ...updates } : platform
    );
    set({ platforms: updatedPlatforms });
    await AsyncStorage.setItem(PLATFORMS_KEY, JSON.stringify(updatedPlatforms));
  },

  addPlatform: async () => {
    const { platforms } = get();
    const newId = `custom_${Date.now()}`;
    const newPlatform: Platform = {
      id: newId,
      name: 'New Platform',
      icon: 'Store',
      color: '#6366F1',
      enabled: true,
    };
    const updatedPlatforms = [...platforms, newPlatform];
    set({ platforms: updatedPlatforms });
    await AsyncStorage.setItem(PLATFORMS_KEY, JSON.stringify(updatedPlatforms));
  },

  removePlatform: async (id) => {
    const { platforms } = get();
    const updatedPlatforms = platforms.filter((platform) => platform.id !== id);
    set({ platforms: updatedPlatforms });
    await AsyncStorage.setItem(PLATFORMS_KEY, JSON.stringify(updatedPlatforms));
  },

  reorderPlatforms: async (platforms) => {
    set({ platforms });
    await AsyncStorage.setItem(PLATFORMS_KEY, JSON.stringify(platforms));
  },
}));
