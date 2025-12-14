// lib/config/packages.shared.ts
// Общие функции для работы с пакетами (можно использовать и на клиенте, и на сервере)
// 
// Конфигурация пакетов находится здесь, чтобы избежать дублирования.
// Если нужно добавить новый курс с пакетами — обнови PACKAGE_CONFIG.

export interface PackageInfo {
  id: string;
  name: string;
  price: number;
  variantRange: { from: number; to: number };
}

// Конфигурация пакетов для каждого курса
export const PACKAGE_CONFIG: Record<string, PackageInfo[]> = {
  'sbornik-variantov-urovnya-ege-ade8': [
    { id: 'pack-1', name: 'Пакет 1 (Варианты 1-25)', price: 2690, variantRange: { from: 1, to: 25 } },
    { id: 'pack-2', name: 'Пакет 2 (Варианты 26-40)', price: 1590, variantRange: { from: 26, to: 40 } },
    { id: 'pack-3', name: 'Пакет 3 (Варианты 41-50)', price: 1190, variantRange: { from: 41, to: 50 } },
  ],
};

// Курсы с пакетами
export const COURSES_WITH_PACKAGES = Object.keys(PACKAGE_CONFIG);

/**
 * Проверяет, является ли курс курсом с пакетами
 */
export function isCourseWithPackages(courseSlug: string): boolean {
  return COURSES_WITH_PACKAGES.some(slug => courseSlug.includes(slug));
}

/**
 * Получает конфигурацию пакетов для курса
 */
export function getPackageConfig(courseSlug: string): PackageInfo[] | null {
  for (const [slug, config] of Object.entries(PACKAGE_CONFIG)) {
    if (courseSlug.includes(slug)) {
      return config;
    }
  }
  return null;
}

/**
 * Определяет какой пакет нужен для варианта
 */
export function getRequiredPackageForVariant(courseSlug: string, variantNumber: number): PackageInfo | null {
  const packages = getPackageConfig(courseSlug);
  if (!packages) return null;
  
  return packages.find(pkg => 
    variantNumber >= pkg.variantRange.from && variantNumber <= pkg.variantRange.to
  ) || null;
}

/**
 * Проверяет доступ к варианту по списку пакетов пользователя
 */
export function hasVariantAccess(courseSlug: string, variantNumber: number, userPackages: string[]): boolean {
  // Полный доступ
  if (userPackages.includes('full')) return true;
  
  const requiredPackage = getRequiredPackageForVariant(courseSlug, variantNumber);
  if (!requiredPackage) return true; // Если пакет не найден — разрешаем доступ
  
  return userPackages.includes(requiredPackage.id);
}

/**
 * Извлекает номер варианта из lessonId (например "var-01" -> 1, "var-25" -> 25)
 */
export function extractVariantNumber(lessonId: string): number | null {
  const match = lessonId.match(/^var-(\d+)$/);
  if (match) return parseInt(match[1], 10);
  return null;
}
