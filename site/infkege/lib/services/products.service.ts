// lib/services/products.service.ts
// Product catalog service — reads courses from JSON with caching
import 'server-only';
import fs from 'fs';
import path from 'path';
import { cache } from 'react';
import { cacheTag } from 'next/cache';
import type { Product, CourseProduct, VariantPackage, ProductType } from '@/lib/dao/types';

// Путь к каталогу курсов
const API_ROOT = process.env.LOCAL_API_PATH || path.join(process.cwd(), 'data/api');
const COURSES_FILE = path.join(API_ROOT, 'courses.json');

// Читаем курсы из JSON (внутренняя функция без кэша)
function loadCoursesFromDisk(): CourseProduct[] {
  try {
    if (!fs.existsSync(COURSES_FILE)) {
      console.warn('courses.json not found at', COURSES_FILE);
      return [];
    }
    
    const content = fs.readFileSync(COURSES_FILE, 'utf8');
    const rawCourses = JSON.parse(content);
    
    return rawCourses.map((course: any) => ({
      id: course.id,
      externalId: course.id,
      type: 'course' as const,
      slug: course.slug,
      title: course.title,
      description: course.description,
      price: course.price || 0,
      originalPrice: course.originalPrice || undefined,
      thumbnailUrl: course.thumbnailUrl,
      subtitle: course.subtitle,
      iconName: course.iconName,
      popular: course.popular,
      isPublic: course.isPublic,
      isPreorder: course.isPreorder,
      features: course.features,
      purchaseOptions: course.purchaseOptions,
    }));
  } catch (error) {
    console.error('Error loading courses:', error);
    return [];
  }
}

// Request-level deduplication with React cache
const loadCourses = cache((): CourseProduct[] => {
  return loadCoursesFromDisk();
});

export class ProductsService {
  
  // Получить все курсы
  static getAllCourses(): CourseProduct[] {
    return loadCourses().filter(c => c.isPublic !== false);
  }

  // Получить курс по ID или slug
  static getCourseById(idOrSlug: string): CourseProduct | null {
    const courses = loadCourses();
    return courses.find(c => c.id === idOrSlug || c.slug === idOrSlug) || null;
  }

  // Получить платные курсы (для магазина)
  static getPaidCourses(): CourseProduct[] {
    return this.getAllCourses().filter(c => c.price > 0);
  }

  // Получить бесплатные курсы
  static getFreeCourses(): CourseProduct[] {
    return this.getAllCourses().filter(c => c.price === 0);
  }

  // Получить пакеты для курса (если есть purchaseOptions)
  static getCoursePackages(courseId: string): VariantPackage[] {
    const course = this.getCourseById(courseId);
    if (!course?.purchaseOptions?.packages) return [];
    
    return course.purchaseOptions.packages.map(pkg => ({
      id: pkg.id,
      externalId: pkg.id,
      type: 'variant_pack' as const,
      title: pkg.title,
      description: pkg.description,
      price: pkg.price,
      courseSlug: course.slug,
      courseId: course.id,
      variantRange: this.parseVariantRange(pkg.title),
    }));
  }

  // Парсим диапазон вариантов из названия пакета
  private static parseVariantRange(title: string): { from: number; to: number } {
    const match = title.match(/(\d+)-(\d+)/);
    if (match) {
      return { from: parseInt(match[1]), to: parseInt(match[2]) };
    }
    return { from: 1, to: 50 };
  }

  // Получить bulk purchase для курса
  static getCourseBulkPurchase(courseId: string): VariantPackage | null {
    const course = this.getCourseById(courseId);
    if (!course?.purchaseOptions?.bulkPurchase) return null;
    
    const bulk = course.purchaseOptions.bulkPurchase;
    return {
      id: `${course.id}-bulk`,
      externalId: `${course.id}-bulk`,
      type: 'variant_pack',
      title: bulk.title,
      description: bulk.description,
      price: bulk.price,
      originalPrice: bulk.originalPrice,
      courseSlug: course.slug,
      courseId: course.id,
      variantRange: { from: 1, to: 50 },
    };
  }

  // Получить все продукты (курсы + пакеты)
  static getAllProducts(): Product[] {
    const courses = this.getAllCourses();
    const products: Product[] = [...courses];
    
    // Добавляем пакеты для курсов с purchaseOptions
    courses.forEach(course => {
      if (course.purchaseOptions) {
        products.push(...this.getCoursePackages(course.id));
        const bulk = this.getCourseBulkPurchase(course.id);
        if (bulk) products.push(bulk);
      }
    });
    
    return products;
  }

  // Получить продукт по ID
  static getProductById(productId: string): Product | null {
    // Сначала ищем среди курсов
    const course = this.getCourseById(productId);
    if (course) return course;
    
    // Ищем среди пакетов
    const allProducts = this.getAllProducts();
    return allProducts.find(p => p.id === productId || p.externalId === productId) || null;
  }

  // Рассчитать итоги корзины
  static calculateCartTotals(items: { productId: string; productType?: ProductType; quantity: number }[]): {
    subtotal: number;
    discount: number;
    total: number;
    itemsWithProducts: { productId: string; product: Product; quantity: number; lineTotal: number }[];
  } {
    const itemsWithProducts = items.map(item => {
      const product = this.getProductById(item.productId);
      return {
        productId: item.productId,
        product: product!,
        quantity: item.quantity,
        lineTotal: product ? product.price * item.quantity : 0,
      };
    }).filter(item => item.product);

    const total = itemsWithProducts.reduce((sum, item) => sum + item.lineTotal, 0);
    
    // Считаем экономию от старых цен
    const originalTotal = itemsWithProducts.reduce((sum, item) => {
      const original = item.product.originalPrice || item.product.price;
      return sum + original * item.quantity;
    }, 0);
    
    const discount = originalTotal - total;

    return {
      subtotal: originalTotal,
      discount,
      total,
      itemsWithProducts,
    };
  }

  // Форматирование цены
  static formatPrice(price: number): string {
    if (price === 0) return 'Бесплатно';
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  }

  // Процент скидки
  static getDiscountPercent(price: number, originalPrice?: number): number {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round((1 - price / originalPrice) * 100);
  }

  // Revalidate products cache
  static async revalidate(): Promise<void> {
    const { revalidateTag } = await import('next/cache');
    revalidateTag('products', 'max');
  }
}
