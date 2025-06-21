
export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export interface User {
  id: string;
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
  id: string;
  title: string;
  description: string;
  price: number;
  condition: ProductCondition;
  category: Category;
  subcategory: SubCategory;
  city: string;
  images: string[]; // URLs of images
  sellerContact: string; // e.g., Telegram username
  sellerId: string;
  sellerUsername?: string;
  createdAt: number; // timestamp
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
    