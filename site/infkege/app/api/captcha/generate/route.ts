import { NextResponse } from 'next/server';
import { EncryptJWT } from 'jose';
import sharp from 'sharp';

const CAPTCHA_SECRET = new TextEncoder().encode(
  (process.env.CAPTCHA_SECRET || 'captcha-secret-key-change-in-production-32ch').slice(0, 32).padEnd(32, '0')
);

const SHAPE_TYPES = [
  { type: 'star', name: 'звёзды' },
  { type: 'heart', name: 'сердца' },
  { type: 'circle', name: 'круги' },
  { type: 'square', name: 'квадраты' },
  { type: 'triangle', name: 'треугольники' },
  { type: 'diamond', name: 'ромбы' },
];

const COLORS = [
  { hex: '#ef4444', name: 'красные' },
  { hex: '#3b82f6', name: 'синие' },
  { hex: '#22c55e', name: 'зелёные' },
  { hex: '#facc15', name: 'жёлтые' },
  { hex: '#8b5cf6', name: 'фиолетовые' },
  { hex: '#f97316', name: 'оранжевые' },
];

type TaskType = 'shape' | 'color' | 'both';

const CANVAS_SIZE = 280;
const SHAPE_SIZE = 32;

// Bounding box для проверки кликов
interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  isTarget: boolean;
}

interface ShapeData {
  shapeType: string;
  color: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  isTarget: boolean;
  boundingBox: BoundingBox;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function generateCaptchaData() {
  const taskTypes: TaskType[] = ['shape', 'color', 'both'];
  const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
  
  const shuffledShapes = shuffle(SHAPE_TYPES);
  const shuffledColors = shuffle(COLORS);
  
  const targetShape = shuffledShapes[0];
  const targetColor = shuffledColors[0];
  const otherShapes = shuffledShapes.slice(1, 4);
  const otherColors = shuffledColors.slice(1, 4);
  
  // Генерируем 7-10 фигур в случайных позициях (не сетка!)
  const shapeCount = 7 + Math.floor(Math.random() * 4);
  const targetCount = 3 + Math.floor(Math.random() * 2); // 3-4 целевых
  
  const shapes: ShapeData[] = [];
  const margin = 35;
  const minDistance = 50; // Минимальное расстояние между центрами
  
  // Функция проверки пересечения
  const isTooClose = (x: number, y: number): boolean => {
    return shapes.some(s => {
      const dx = s.x - x;
      const dy = s.y - y;
      return Math.sqrt(dx * dx + dy * dy) < minDistance;
    });
  };
  
  // Генерируем позиции
  const generatePosition = (): { x: number; y: number } | null => {
    for (let attempt = 0; attempt < 50; attempt++) {
      const x = margin + Math.random() * (CANVAS_SIZE - margin * 2);
      const y = margin + Math.random() * (CANVAS_SIZE - margin * 2);
      if (!isTooClose(x, y)) {
        return { x, y };
      }
    }
    return null;
  };
  
  // Создаём целевые фигуры
  for (let i = 0; i < targetCount; i++) {
    const pos = generatePosition();
    if (!pos) continue;
    
    let shapeType: string;
    let color: string;
    
    if (taskType === 'shape') {
      shapeType = targetShape.type;
      color = shuffle([...COLORS])[0].hex;
    } else if (taskType === 'color') {
      shapeType = shuffle([...SHAPE_TYPES])[0].type;
      color = targetColor.hex;
    } else {
      shapeType = targetShape.type;
      color = targetColor.hex;
    }
    
    const size = SHAPE_SIZE * (0.8 + Math.random() * 0.4);
    const rotation = Math.random() * 60 - 30;
    
    shapes.push({
      shapeType,
      color,
      x: pos.x,
      y: pos.y,
      size,
      rotation,
      isTarget: true,
      boundingBox: {
        x: pos.x - size / 2 - 5,
        y: pos.y - size / 2 - 5,
        width: size + 10,
        height: size + 10,
        isTarget: true,
      },
    });
  }
  
  // Создаём остальные фигуры
  for (let i = shapes.length; i < shapeCount; i++) {
    const pos = generatePosition();
    if (!pos) continue;
    
    let shapeType: string;
    let color: string;
    
    if (taskType === 'shape') {
      shapeType = otherShapes[Math.floor(Math.random() * otherShapes.length)].type;
      color = shuffle([...COLORS])[0].hex;
    } else if (taskType === 'color') {
      shapeType = shuffle([...SHAPE_TYPES])[0].type;
      color = otherColors[Math.floor(Math.random() * otherColors.length)].hex;
    } else {
      if (Math.random() > 0.5) {
        shapeType = otherShapes[Math.floor(Math.random() * otherShapes.length)].type;
        color = shuffle([...COLORS])[0].hex;
      } else {
        shapeType = shuffle([...SHAPE_TYPES])[0].type;
        color = otherColors[Math.floor(Math.random() * otherColors.length)].hex;
      }
    }
    
    const size = SHAPE_SIZE * (0.8 + Math.random() * 0.4);
    const rotation = Math.random() * 60 - 30;
    
    shapes.push({
      shapeType,
      color,
      x: pos.x,
      y: pos.y,
      size,
      rotation,
      isTarget: false,
      boundingBox: {
        x: pos.x - size / 2 - 5,
        y: pos.y - size / 2 - 5,
        width: size + 10,
        height: size + 10,
        isTarget: false,
      },
    });
  }

  let taskText: string;
  if (taskType === 'shape') {
    taskText = `Кликните на все ${targetShape.name}`;
  } else if (taskType === 'color') {
    taskText = `Кликните на все ${targetColor.name} фигуры`;
  } else {
    taskText = `Кликните на все ${targetColor.name} ${targetShape.name}`;
  }

  return {
    shapes,
    targetCount: shapes.filter(s => s.isTarget).length,
    boundingBoxes: shapes.map(s => s.boundingBox),
    taskText,
  };
}

function getShapePath(type: string, cx: number, cy: number, size: number): string {
  const half = size / 2;
  const noise = () => (Math.random() - 0.5) * 3;
  
  switch (type) {
    case 'star': {
      const points: string[] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? half : half * 0.4;
        const angle = (Math.PI / 5) * i - Math.PI / 2 + (Math.random() - 0.5) * 0.1;
        points.push(`${cx + r * Math.cos(angle) + noise()},${cy + r * Math.sin(angle) + noise()}`);
      }
      return `M${points.join('L')}Z`;
    }
    case 'heart': {
      const n = noise;
      return `M${cx + n()},${cy + half * 0.3 + n()} 
        C${cx + n()},${cy - half * 0.3 + n()} ${cx - half + n()},${cy - half * 0.3 + n()} ${cx - half + n()},${cy + half * 0.1 + n()}
        C${cx - half + n()},${cy + half * 0.5 + n()} ${cx + n()},${cy + half + n()} ${cx + n()},${cy + half + n()}
        C${cx + n()},${cy + half + n()} ${cx + half + n()},${cy + half * 0.5 + n()} ${cx + half + n()},${cy + half * 0.1 + n()}
        C${cx + half + n()},${cy - half * 0.3 + n()} ${cx + n()},${cy - half * 0.3 + n()} ${cx + n()},${cy + half * 0.3 + n()}Z`;
    }
    case 'circle': {
      const points: string[] = [];
      const segments = 10 + Math.floor(Math.random() * 4);
      for (let i = 0; i < segments; i++) {
        const angle = (Math.PI * 2 / segments) * i;
        const r = half + noise() * 1.5;
        points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      return `M${points.join('L')}Z`;
    }
    case 'square': {
      const h = half * 0.75;
      return `M${cx - h + noise()},${cy - h + noise()} L${cx + h + noise()},${cy - h + noise()} L${cx + h + noise()},${cy + h + noise()} L${cx - h + noise()},${cy + h + noise()}Z`;
    }
    case 'triangle':
      return `M${cx + noise()},${cy - half + noise()} L${cx + half + noise()},${cy + half * 0.7 + noise()} L${cx - half + noise()},${cy + half * 0.7 + noise()}Z`;
    case 'diamond':
      return `M${cx + noise()},${cy - half + noise()} L${cx + half * 0.7 + noise()},${cy + noise()} L${cx + noise()},${cy + half + noise()} L${cx - half * 0.7 + noise()},${cy + noise()}Z`;
    default:
      return '';
  }
}

function generateNoise(): string {
  const elements: string[] = [];
  
  const gradId = `grad_${Math.random().toString(36).slice(2, 8)}`;
  const angle = Math.random() * 360;
  elements.push(`
    <defs>
      <linearGradient id="${gradId}" gradientTransform="rotate(${angle})">
        <stop offset="0%" stop-color="#f5f5f5"/>
        <stop offset="50%" stop-color="#ebebeb"/>
        <stop offset="100%" stop-color="#e0e0e0"/>
      </linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="4"/></filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#${gradId})"/>
  `);
  
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * CANVAS_SIZE;
    const y = Math.random() * CANVAS_SIZE;
    const r = Math.random() * 3 + 0.5;
    const opacity = Math.random() * 0.1 + 0.02;
    elements.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(0,0,0,${opacity})"/>`);
  }
  
  for (let i = 0; i < 20; i++) {
    const x1 = Math.random() * CANVAS_SIZE;
    const y1 = Math.random() * CANVAS_SIZE;
    const length = Math.random() * 60 + 15;
    const angle = Math.random() * Math.PI * 2;
    const x2 = x1 + Math.cos(angle) * length;
    const y2 = y1 + Math.sin(angle) * length;
    const opacity = Math.random() * 0.06 + 0.02;
    elements.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(0,0,0,${opacity})" stroke-width="${Math.random() * 2 + 0.5}"/>`);
  }
  
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * CANVAS_SIZE;
    const y = Math.random() * CANVAS_SIZE;
    const r = Math.random() * 30 + 15;
    const opacity = Math.random() * 0.05 + 0.02;
    elements.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(100,100,100,${opacity})" filter="url(#blur)"/>`);
  }
  
  return elements.join('');
}

function generateSVG(shapes: ShapeData[]): string {
  const shapePaths = shapes.map(shape => {
    const path = getShapePath(shape.shapeType, shape.x, shape.y, shape.size);
    
    const shadowPath = getShapePath(shape.shapeType, shape.x + 2, shape.y + 2, shape.size);
    
    return `
      <path d="${shadowPath}" fill="rgba(0,0,0,0.12)" transform="rotate(${shape.rotation} ${shape.x} ${shape.y})"/>
      <path d="${path}" fill="${shape.color}" transform="rotate(${shape.rotation} ${shape.x} ${shape.y})" stroke="rgba(0,0,0,0.15)" stroke-width="1"/>
    `;
  });

  const noise = generateNoise();

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}">
    ${noise}
    ${shapePaths.join('')}
  </svg>`;
}

export async function GET() {
  try {
    const data = generateCaptchaData();
    const svg = generateSVG(data.shapes);
    
    const pngBuffer = await sharp(Buffer.from(svg))
      .png({ quality: 90 })
      .toBuffer();
    
    const pngBase64 = pngBuffer.toString('base64');
    const imageData = `data:image/png;base64,${pngBase64}`;

    // Зашифрованный токен с bounding boxes
    const token = await new EncryptJWT({
      boundingBoxes: data.boundingBoxes,
      targetCount: data.targetCount,
      canvasSize: CANVAS_SIZE,
      createdAt: Date.now(),
    })
      .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
      .setExpirationTime('5m')
      .encrypt(CAPTCHA_SECRET);

    return NextResponse.json({
      image: imageData,
      token,
      task: data.taskText,
      canvasSize: CANVAS_SIZE,
      targetCount: data.targetCount,
    });
  } catch (error) {
    console.error('Captcha generation error:', error);
    return NextResponse.json({ error: 'Failed to generate captcha' }, { status: 500 });
  }
}
