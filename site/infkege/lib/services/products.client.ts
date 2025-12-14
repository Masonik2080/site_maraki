// lib/services/products.client.ts
// Client-side products service
'use client';

import type { Product, CourseProduct, VariantPackage } from '@/lib/dao/types';

export class ProductsClientService {
  
  // Get all courses
  static async getCourses(): Promise<CourseProduct[]> {
    try {
      const res = await fetch('/api/products?type=courses');
      if (!res.ok) return [];
      const data = await res.json();
      return data.products || [];
    } catch {
      return [];
    }
  }

  // Get paid courses
  static async getPaidCourses(): Promise<CourseProduct[]> {
    try {
      const res = await fetch('/api/products?type=paid');
      if (!res.ok) return [];
      const data = await res.json();
      return data.products || [];
    } catch {
      return [];
    }
  }

  // Get all products
  static async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) return [];
      const data = await res.json();
      return data.products || [];
    } catch {
      return [];
    }
  }

  // Format price
  static formatPrice(price: number): string {
    if (price === 0) return 'Бесплатно';
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  }

  // Calculate discount percentage
  static getDiscountPercent(price: number, originalPrice?: number): number {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round((1 - price / originalPrice) * 100);
  }
}
