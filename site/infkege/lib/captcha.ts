import { jwtDecrypt } from 'jose';

const CAPTCHA_SECRET = new TextEncoder().encode(
  (process.env.CAPTCHA_SECRET || 'captcha-secret-key-change-in-production-32ch').slice(0, 32).padEnd(32, '0')
);

/**
 * Серверная проверка токена верификации капчи
 * Использовать в API routes при обработке форм
 */
export async function verifyCaptchaToken(token: string | null | undefined): Promise<{
  valid: boolean;
  error?: string;
}> {
  if (!token) {
    return { valid: false, error: 'Капча не пройдена' };
  }

  try {
    const { payload } = await jwtDecrypt(token, CAPTCHA_SECRET);
    
    if (!payload.verified) {
      return { valid: false, error: 'Недействительный токен капчи' };
    }

    const verifiedAt = payload.verifiedAt as number;
    if (Date.now() - verifiedAt > 2 * 60 * 1000) {
      return { valid: false, error: 'Токен капчи истёк' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Недействительный токен капчи' };
  }
}
