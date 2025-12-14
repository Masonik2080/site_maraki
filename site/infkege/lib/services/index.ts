// lib/services/index.ts
// Export all services

// Server-side services
export { ProductsService } from './products.service';

// Client-side services
export { AuthClientService } from './auth.client';
export { CartClientService, subscribeToCart } from './cart.client';
export { ProductsClientService } from './products.client';
export { PaymentClientService } from './payment.client';
