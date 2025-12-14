import { NextRequest, NextResponse } from 'next/server';
import { jwtDecrypt, EncryptJWT } from 'jose';

const CAPTCHA_SECRET = new TextEncoder().encode(
  (process.env.CAPTCHA_SECRET || 'captcha-secret-key-change-in-production-32ch').slice(0, 32).padEnd(32, '0')
);

const MIN_SOLVE_TIME = 1500;

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  isTarget: boolean;
}

interface CaptchaPayload {
  boundingBoxes: BoundingBox[];
  targetCount: number;
  canvasSize: number;
  createdAt: number;
}

interface ClickPoint {
  x: number;
  y: number;
}

// Проверяет, попадает ли точка в bounding box
function isPointInBox(point: ClickPoint, box: BoundingBox): boolean {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, clicks, honeypot, behavior } = body;

    // Honeypot
    if (honeypot && (honeypot.email || honeypot.phone || honeypot.website)) {
      console.warn('Captcha: Honeypot triggered');
      return NextResponse.json({ 
        valid: false, 
        error: 'Ошибка проверки безопасности' 
      }, { status: 400 });
    }

    // Поведенческая проверка (мягкая — только логирование)
    // В продакшене можно включить строгую проверку или rate limiting
    if (behavior?.hash) {
      try {
        const decoded = JSON.parse(atob(behavior.hash));
        if (decoded.moveCount < 3) {
          console.warn('Captcha: Low mouse movement detected (suspicious)');
          // Не блокируем, но логируем для анализа
        }
        if (decoded.teleports > 5) {
          console.warn('Captcha: Many teleportations detected (suspicious)');
          // Можно добавить в rate limiting или блокировать при повторах
        }
      } catch {
        // Игнорируем невалидный hash
      }
    }

    if (!token || !clicks || !Array.isArray(clicks)) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Неверный запрос' 
      }, { status: 400 });
    }

    // Расшифровываем токен
    let payload: CaptchaPayload;
    try {
      const { payload: p } = await jwtDecrypt(token, CAPTCHA_SECRET);
      payload = p as unknown as CaptchaPayload;
    } catch {
      return NextResponse.json({ 
        valid: false, 
        error: 'Капча истекла. Обновите страницу.' 
      }, { status: 400 });
    }

    // Проверка времени
    const solveTime = Date.now() - payload.createdAt;
    if (solveTime < MIN_SOLVE_TIME) {
      console.warn(`Captcha: Solved too fast - ${solveTime}ms`);
      return NextResponse.json({ 
        valid: false, 
        error: 'Слишком быстро' 
      }, { status: 400 });
    }

    const { boundingBoxes, targetCount, canvasSize } = payload;
    const targetBoxes = boundingBoxes.filter(b => b.isTarget);
    const nonTargetBoxes = boundingBoxes.filter(b => !b.isTarget);

    // Валидация координат кликов
    const validClicks = (clicks as ClickPoint[]).filter(click => 
      click.x >= 0 && click.x <= canvasSize &&
      click.y >= 0 && click.y <= canvasSize
    );

    if (validClicks.length !== clicks.length) {
      console.warn('Captcha: Invalid click coordinates');
      return NextResponse.json({ 
        valid: false, 
        error: 'Неверные координаты' 
      }, { status: 400 });
    }

    // Проверяем каждый клик
    let correctHits = 0;
    let wrongHits = 0;
    const hitTargets = new Set<number>();

    for (const click of validClicks) {
      // Проверяем попадание в целевые фигуры
      let hitTarget = false;
      for (let i = 0; i < targetBoxes.length; i++) {
        if (isPointInBox(click, targetBoxes[i])) {
          hitTarget = true;
          hitTargets.add(i);
          break;
        }
      }

      if (hitTarget) {
        correctHits++;
      } else {
        // Проверяем попадание в нецелевые фигуры
        for (const box of nonTargetBoxes) {
          if (isPointInBox(click, box)) {
            wrongHits++;
            break;
          }
        }
      }
    }

    // Успех: все целевые фигуры кликнуты, нет кликов по неправильным
    const allTargetsHit = hitTargets.size === targetCount;
    const noWrongHits = wrongHits === 0;

    if (allTargetsHit && noWrongHits) {
      const verificationToken = await new EncryptJWT({
        verified: true,
        verifiedAt: Date.now(),
        solveTime,
        accuracy: correctHits / validClicks.length,
      })
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
        .setExpirationTime('2m')
        .encrypt(CAPTCHA_SECRET);

      return NextResponse.json({ 
        valid: true,
        verificationToken,
      });
    }

    // Формируем сообщение об ошибке
    let errorMsg = 'Неверный выбор';
    if (!allTargetsHit && wrongHits === 0) {
      errorMsg = `Выбрано ${hitTargets.size} из ${targetCount}`;
    } else if (wrongHits > 0) {
      errorMsg = 'Выбраны неправильные фигуры';
    }

    return NextResponse.json({ 
      valid: false, 
      error: errorMsg,
    });

  } catch (error) {
    console.error('Captcha verification error:', error);
    return NextResponse.json({ 
      valid: false, 
      error: 'Ошибка проверки' 
    }, { status: 500 });
  }
}
