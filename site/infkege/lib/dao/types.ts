// lib/dao/types.ts
// Domain types — чистые интерфейсы, не зависят от БД

// ============ AUTH ============
export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  session?: AuthSession;
  error?: string;
  needsEmailConfirmation?: boolean;
}

// ============ USER ============
export interface UserProfile {
  id: string;
  userId: string;
  email?: string;
  fullName: string | null;
  username: string | null;
  avatarUrl: string | null;
  balance: number;
  role: string;
}

// ============ PRODUCTS ============
export type ProductType = 'course' | 'package' | 'variant_pack' | 'consultation';

export interface Product {
  id: string;
  externalId: string;
  type: ProductType;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  thumbnailUrl?: string;
  metadata?: Record<string, unknown>;
}

// Курс из каталога
export interface CourseProduct extends Product {
  type: 'course';
  slug: string;
  subtitle?: string;
  iconName?: string;
  popular?: boolean;
  isPublic?: boolean;
  isPreorder?: boolean;
  features?: { text: string }[];
  purchaseOptions?: {
    type: 'sequential';
    packages: PackageOption[];
    bulkPurchase?: {
      title: string;
      price: number;
      description: string;
      originalPrice?: number;
    };
  };
}

// Пакет внутри курса (например, пакеты вариантов)
export interface PackageOption {
  id: string;
  title: string;
  description: string;
  price: number;
}

// Пакет вариантов (для покупки)
export interface VariantPackage extends Product {
  type: 'variant_pack';
  variantRange: { from: number; to: number };
  courseSlug: string;
  courseId: string;
}

// ============ CART ============
export interface CartItem {
  id: string;
  productId: string;
  productType: ProductType;
  quantity: number;
  product?: Product;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
}

// ============ ORDERS ============
export type OrderStatus = 'awaiting_payment' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'requires_action' | 'authorized';

export interface OrderItem {
  id: string;
  productId: string;
  productType: ProductType;
  productTitle: string;
  priceAtPurchase: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  total: number;
  items: OrderItem[];
  createdAt: Date;
  paidAt?: Date;
}

// ============ ACCESS ============
export interface CourseAccess {
  userId: string;
  courseId: string;
  packageId?: string;
  grantedAt: Date;
  expiresAt?: Date;
}
