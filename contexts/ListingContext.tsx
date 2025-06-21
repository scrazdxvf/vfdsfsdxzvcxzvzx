
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { Listing, ProductCondition, Category, SubCategory } from '../types';
import { CATEGORIES, UKRAINIAN_CITIES } from '../constants';
import { useAuth } from './AuthContext';

interface ListingContextType {
  listings: Listing[];
  loadingListings: boolean;
  addListing: (newListingData: Omit<Listing, 'id' | 'sellerId' | 'sellerUsername' | 'createdAt' | 'status'>) => Promise<Listing | null>;
  updateListingStatus: (listingId: string, status: Listing['status']) => Promise<void>;
  getListingById: (id: string) => Listing | undefined;
  getUserListings: (userId: string) => Listing[];
  fetchListings: () => void; // Added to refresh listings
  deleteListing: (listingId: string) => Promise<void>;
  updateListing: (listingId: string, updatedData: Partial<Omit<Listing, 'id' | 'sellerId' | 'sellerUsername' | 'createdAt' | 'status'>>) => Promise<Listing | null>;
}

const ListingContext = createContext<ListingContextType | undefined>(undefined);

const MOCK_LISTINGS_KEY = 'mockListingsSKR';

const generateInitialMockListings = (): Listing[] => {
  return [
    {
      id: '1',
      title: 'Крутое Худи Supreme',
      description: 'Оригинальное худи Supreme, почти новое. Размер L. Очень теплое и стильное.',
      price: 5000,
      condition: ProductCondition.USED_EXCELLENT,
      category: CATEGORIES[0],
      subcategory: CATEGORIES[0].subcategories[0],
      city: UKRAINIAN_CITIES[0], // Киев
      images: ['https://picsum.photos/seed/hoodie1/600/400', 'https://picsum.photos/seed/hoodie2/600/400'],
      sellerContact: '@supreme_seller',
      sellerId: 'user123',
      sellerUsername: 'TestUser',
      createdAt: Date.now() - 86400000 * 2, // 2 days ago
      status: 'active',
    },
    {
      id: '2',
      title: 'Жижа для Вейпа "Лесные Ягоды"',
      description: 'Вкусная жижа для вейпа, 30мл, 50мг никотина. Новая, запечатанная.',
      price: 350,
      condition: ProductCondition.NEW,
      category: CATEGORIES[1],
      subcategory: CATEGORIES[1].subcategories[0],
      city: UKRAINIAN_CITIES[1], // Харьков
      images: ['https://picsum.photos/seed/vape1/600/400'],
      sellerContact: '@vape_king',
      sellerId: 'admin456',
      sellerUsername: 'AdminBoss',
      createdAt: Date.now() - 86400000 * 1, // 1 day ago
      status: 'active',
    },
    {
      id: '3',
      title: 'Старый iPhone X на запчасти',
      description: 'Разбит экран, не включается. Подойдет на запчасти или под восстановление. iCloud чистый.',
      price: 800,
      condition: ProductCondition.FOR_PARTS,
      category: CATEGORIES[2],
      subcategory: CATEGORIES[2].subcategories[0],
      city: UKRAINIAN_CITIES[2], // Одесса
      images: ['https://picsum.photos/seed/iphoneX/600/400'],
      sellerContact: '0991234567',
      sellerId: 'user123',
      sellerUsername: 'TestUser',
      createdAt: Date.now() - 86400000 * 5, // 5 days ago
      status: 'active',
    },
     {
      id: '4',
      title: 'Стильный свитшот Nike Tech Fleece',
      description: 'Оригинальный свитшот Nike, состояние хорошее. Размер M. Идеален для спорта и повседневной носки.',
      price: 1200,
      condition: ProductCondition.USED_GOOD,
      category: CATEGORIES[0],
      subcategory: CATEGORIES[0].subcategories[2], // Свитшоты
      city: UKRAINIAN_CITIES[3], // Днепр
      images: ['https://picsum.photos/seed/nike1/600/400', 'https://picsum.photos/seed/nike2/600/400'],
      sellerContact: '@nike_lover',
      sellerId: 'user789', // Some other user
      sellerUsername: 'NikeFan',
      createdAt: Date.now() - 86400000 * 3, // 3 days ago
      status: 'pending_moderation', // Example for admin panel
    },
  ];
};


export const ListingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const { user } = useAuth();

  const fetchListings = useCallback(() => {
    setLoadingListings(true);
    // Simulate API call
    setTimeout(() => {
      const storedListings = localStorage.getItem(MOCK_LISTINGS_KEY);
      if (storedListings) {
        setListings(JSON.parse(storedListings));
      } else {
        const initialListings = generateInitialMockListings();
        setListings(initialListings);
        localStorage.setItem(MOCK_LISTINGS_KEY, JSON.stringify(initialListings));
      }
      setLoadingListings(false);
    }, 500);
  },[]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const saveListingsToStorage = (updatedListings: Listing[]) => {
    localStorage.setItem(MOCK_LISTINGS_KEY, JSON.stringify(updatedListings));
  };

  const addListing = async (newListingData: Omit<Listing, 'id' | 'sellerId' | 'sellerUsername' | 'createdAt' | 'status'>): Promise<Listing | null> => {
    if (!user) {
      console.error("User not logged in");
      return null;
    }
    setLoadingListings(true);
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const newListing: Listing = {
          ...newListingData,
          id: `listing-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          sellerId: user.id,
          sellerUsername: user.username,
          createdAt: Date.now(),
          status: 'pending_moderation', // New listings require moderation
        };
        const updatedListings = [newListing, ...listings];
        setListings(updatedListings);
        saveListingsToStorage(updatedListings);
        setLoadingListings(false);
        resolve(newListing);
      }, 1000);
    });
  };

  const updateListingStatus = async (listingId: string, status: Listing['status']): Promise<void> => {
    setLoadingListings(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        const updatedListings = listings.map(l => 
          l.id === listingId ? { ...l, status } : l
        );
        setListings(updatedListings);
        saveListingsToStorage(updatedListings);
        setLoadingListings(false);
        resolve();
      }, 500);
    });
  };

  const deleteListing = async (listingId: string): Promise<void> => {
    setLoadingListings(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        const updatedListings = listings.filter(l => l.id !== listingId);
        setListings(updatedListings);
        saveListingsToStorage(updatedListings);
        setLoadingListings(false);
        resolve();
      }, 500);
    });
  };

  const updateListing = async (
    listingId: string, 
    updatedData: Partial<Omit<Listing, 'id' | 'sellerId' | 'sellerUsername' | 'createdAt' | 'status'>>
  ): Promise<Listing | null> => {
     if (!user) {
      console.error("User not logged in");
      return null;
    }
    setLoadingListings(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        let foundListing: Listing | null = null;
        const updatedListings = listings.map(l => {
          if (l.id === listingId && l.sellerId === user.id) { // Ensure user owns the listing
            foundListing = { ...l, ...updatedData, status: 'pending_moderation' }; // Re-moderate on edit
            return foundListing;
          }
          return l;
        });
        if (foundListing) {
          setListings(updatedListings);
          saveListingsToStorage(updatedListings);
        }
        setLoadingListings(false);
        resolve(foundListing);
      }, 1000);
    });
  };


  const getListingById = (id: string): Listing | undefined => {
    return listings.find(l => l.id === id);
  };

  const getUserListings = (userId: string): Listing[] => {
    return listings.filter(l => l.sellerId === userId);
  };

  return (
    <ListingContext.Provider value={{ listings, loadingListings, addListing, updateListingStatus, getListingById, getUserListings, fetchListings, deleteListing, updateListing }}>
      {children}
    </ListingContext.Provider>
  );
};

export const useListings = (): ListingContextType => {
  const context = useContext(ListingContext);
  if (!context) {
    throw new Error('useListings must be used within a ListingProvider');
  }
  return context;
};
    