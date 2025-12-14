// app/api/payment/status/route.ts
// API для проверки статуса платежа
import { NextRequest, NextResponse } from 'next/server';
import { AuthRepository } from '@/lib/dao';
import { PaymentService, TransactionRepository } from '@/lib/payment';

// Валидация UUID
function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const linkPaymentId = searchParams.get('linkPaymentId');
    
    if (!paymentId && !linkPaymentId) {
      return NextResponse.json(
        { error: 'Missing paymentId or linkPaymentId' },
        { status: 400 }
      );
    }
    
    // Если это платёж по ссылке — проверяем без авторизации
    if (linkPaymentId) {
      // Валидация UUID
      if (!isValidUUID(linkPaymentId)) {
        return NextResponse.json(
          { error: 'Invalid linkPaymentId' },
          { status: 400 }
        );
      }
      
      const { PaymentLinkRepository } = await import('@/lib/dao/payment-link.repository');
      const payment = await PaymentLinkRepository.getPaymentById(linkPaymentId);
      
      if (!payment) {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        );
      }
      
      // Если есть providerPaymentId — проверяем у провайдера
      if (payment.providerPaymentId) {
        const result = await PaymentService.checkPaymentStatus(payment.providerPaymentId);
        
        // Обновляем статус в нашей БД если оплачено
        if (result.isPaid && payment.status !== 'completed') {
          await PaymentLinkRepository.updatePayment(linkPaymentId, {
            status: 'completed',
            paidAt: new Date(),
          });
          
          // Инкрементируем использования
          await PaymentLinkRepository.incrementUses(payment.linkId);
          
          // Проверяем лимит и обновляем статус ссылки
          const link = await PaymentLinkRepository.getById(payment.linkId);
          if (link) {
            const shouldExhaust = 
              (link.usageType === 'single' && link.currentUses >= 1) ||
              (link.usageType === 'limited' && link.maxUses && link.currentUses >= link.maxUses);
            
            if (shouldExhaust && link.status === 'active') {
              await PaymentLinkRepository.updateStatus(link.id, 'exhausted');
              console.log('[PaymentStatus] Link marked as exhausted:', link.id);
            }
          }
        }
        
        return NextResponse.json({
          success: true,
          isPaid: result.isPaid || payment.status === 'completed',
          status: payment.status,
        });
      }
      
      return NextResponse.json({
        success: true,
        isPaid: payment.status === 'completed',
        status: payment.status,
      });
    }
    
    // Обычный платёж — требуем авторизацию
    const user = await AuthRepository.getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const transaction = await TransactionRepository.getByPaymentId(paymentId!);
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    if (transaction.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    const result = await PaymentService.checkPaymentStatus(paymentId!);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Status check failed' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      status: result.status,
      transactionStatus: result.transactionStatus,
      isPaid: result.isPaid,
      orderId: transaction.orderId,
    });
    
  } catch (error) {
    console.error('[API] Payment status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
