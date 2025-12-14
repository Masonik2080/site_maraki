import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Standalone output for Docker
  output: 'standalone',
  
  // Enable Next.js 16 cache components with 'use cache' directive
  cacheComponents: true,
  
  turbopack: {
    root: path.resolve(__dirname),
  },
  
  // Experimental optimizations
  experimental: {
    // Optimize package imports - tree-shake heavy packages
    optimizePackageImports: [
      'lucide-react',
      '@phosphor-icons/react',
      'framer-motion',
    ],
  },
  
  // Compiler optimizations for production
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Security headers (применяются в production)
  async headers() {
    return [
      {
        // Применить ко всем маршрутам
        source: '/:path*',
        headers: [
          // Защита от кликджекинга - запрет встраивания в iframe
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Запрет браузеру угадывать MIME-тип
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Контроль информации в Referer
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Изоляция окна от других вкладок
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          // Разрешения браузера (отключаем ненужные API)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
