// lib/config/packages.config.ts
// Серверный реэкспорт конфигурации пакетов
// 
// Вся конфигурация находится в packages.shared.ts
// Этот файл нужен для обратной совместимости серверных импортов

export {
  type PackageInfo,
  PACKAGE_CONFIG,
  COURSES_WITH_PACKAGES,
  isCourseWithPackages,
  getPackageConfig,
  getRequiredPackageForVariant,
  hasVariantAccess,
  extractVariantNumber,
} from './packages.shared';
