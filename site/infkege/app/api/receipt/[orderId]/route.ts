// app/api/receipt/[orderId]/route.ts
// API для скачивания чека в формате PDF
import { NextRequest, NextResponse } from 'next/server';
import { AuthRepository, OrderRepository, UserRepository } from '@/lib/dao';
import { ReceiptService } from '@/lib/receipt';
import { PdfService } from '@/lib/receipt/pdf.service';

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

/**
 * GET /api/receipt/[orderId]
 * Возвращает PDF чека для скачивания
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { orderId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format'); // 'html' для просмотра в браузере

    // 1. Проверяем авторизацию
    const authUser = await AuthRepository.getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Получаем заказ
    const order = await OrderRepository.getOrderById(orderId);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 3. Проверяем, что заказ принадлежит пользователю
    if (order.userId !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. Проверяем, что заказ оплачен
    if (order.status !== 'completed' && order.status !== 'authorized') {
      return NextResponse.json({ error: 'Order not paid' }, { status: 400 });
    }

    // 5. Получаем профиль пользователя
    const userProfile = await UserRepository.getProfile(authUser.id);

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // 6. Генерируем HTML чека
    const receiptData = ReceiptService.getReceiptData(order, userProfile);
    const html = ReceiptService.generateReceiptHtml(receiptData);
    const orderNumber = order.id.split('-')[0].toUpperCase();

    // 7. Если запрошен HTML формат — возвращаем HTML
    if (format === 'html') {
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    // 8. Генерируем PDF
    try {
      const pdfBuffer = await PdfService.generatePdf(html);

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="receipt-${orderNumber}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
    } catch (pdfError) {
      console.error('[Receipt API] PDF generation error:', pdfError);
      // Fallback на HTML если PDF не сгенерировался
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="receipt-${orderNumber}.html"`,
        },
      });
    }
  } catch (error) {
    console.error('[Receipt API] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
