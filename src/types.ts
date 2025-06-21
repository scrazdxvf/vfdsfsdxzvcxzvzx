import { Timestamp } from 'firebase/firestore';

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export interface User {
  id: string; // Firebase UID
  email: string | null;
  username?: string;
  telegram?: string;
  city?: string;
  isAdmin?: boolean;
}

export enum ProductCondition {
  NEW = 'Новое',
  USED_EXCELLENT = 'Б/У - Отличное',
  USED_GOOD = 'Б/У - Хорошее',
  USED_FAIR = 'Б/У - Удовлетворительное',
  FOR_PARTS = 'На запчасти',
}

export interface Category {
  id: string;
  name: string;
  subcategories: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
}

export interface Listing {
  id: string; // Firestore document ID
  title: string;
  description: string;
  price: number;
  condition: ProductCondition;
  category: Category; // Store as object, or just IDs and reconstruct
  subcategory: SubCategory; // Store as object, or just IDs and reconstruct
  city: string;
  images: string[]; // URLs of images from Firebase Storage
  sellerContact: string; // e.g., Telegram username
  sellerId: string; // Firebase UID of the seller
  sellerUsername?: string; // Denormalized from user's profile
  createdAt: Timestamp; // Firestore Timestamp
  status: 'active' | 'pending_moderation' | 'rejected' | 'sold';
}

export interface FilterState {
  searchTerm: string;
  priceMin: number | null;
  priceMax: number | null;
  city: string;
  condition: ProductCondition | '';
  category: string; // category id
}
