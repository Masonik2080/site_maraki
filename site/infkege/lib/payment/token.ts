// lib/payment/token.ts
// Генерация токена для подписи запросов Тбанк
import crypto from 'crypto';
import { getSecretKey } from './config';

/**
 * Генерирует токен для подписи запроса к API Тбанк
 * 
 * Алгоритм:
 * 1. Собрать все параметры запроса (кроме Token, Receipt, DATA, Shops)
 * 2. Добавить Password (секретный ключ)
 * 3. Отсортировать по ключам в алфавитном порядке
 * 4. Конкатенировать значения
 * 5. Вычислить SHA-256 хеш
 */
export function generateToken(params: Record<string, unknown>): string {
  const secretKey = getSecretKey();
  
  // Исключаем поля, которые не участвуют в подписи
  const excludeFields = ['Token', 'Receipt', 'DATA', 'Shops'];
  
  // Собираем параметры для подписи
  const signParams: Record<string, string> = {
    Password: secretKey,
  };
  
  for (const [key, value] of Object.entries(params)) {
    if (excludeFields.includes(key)) continue;
    if (value === undefined || value === null) continue;
    
    // Преобразуем значение в строку
    if (typeof value === 'boolean') {
      signParams[key] = value ? 'true' : 'false';
    } else if (typeof value === 'number') {
      signParams[key] = String(value);
    } else if (typeof value === 'string') {
      signParams[key] = value;
    }
  }
  
  // Сортируем по ключам
  const sortedKeys = Object.keys(signParams).sort();
  
  // Конкатенируем значения
  const concatenated = sortedKeys.map(key => signParams[key]).join('');
  
  // Вычисляем SHA-256
  const hash = crypto.createHash('sha256').update(concatenated).digest('hex');
  
  return hash;
}

/**
 * Проверяет токен из нотификации
 */
export function verifyNotificationToken(
  params: Record<string, unknown>,
  receivedToken: string
): boolean {
  const calculatedToken = generateToken(params);
  return calculatedToken === receivedToken;
}
