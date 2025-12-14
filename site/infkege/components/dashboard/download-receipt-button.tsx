'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

// Lazy load heavy PDF libraries only when user clicks (~500KB saved from initial bundle)
type JsPDFType = typeof import('jspdf').jsPDF;
type Html2CanvasType = typeof import('html2canvas').default;

let jsPDFModule: JsPDFType | null = null;
let html2canvasModule: Html2CanvasType | null = null;

async function loadPdfLibraries() {
  if (!jsPDFModule || !html2canvasModule) {
    const [jspdfMod, h2cMod] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);
    jsPDFModule = jspdfMod.jsPDF;
    html2canvasModule = h2cMod.default;
  }
  return { jsPDF: jsPDFModule, html2canvas: html2canvasModule };
}

interface DownloadReceiptButtonProps {
  orderId: string;
  orderNumber: string;
  className?: string;
  showText?: boolean;
}

export function DownloadReceiptButton({
  orderId,
  orderNumber,
  className = '',
  showText = false,
}: DownloadReceiptButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);

    try {
      // Load PDF libraries on demand
      const { jsPDF, html2canvas } = await loadPdfLibraries();

      // 1. Получаем HTML чека
      const response = await fetch(`/api/receipt/${orderId}?format=html`);
      if (!response.ok) throw new Error('Failed to fetch receipt');
      const html = await response.text();

      // 2. Создаём временный iframe для рендеринга
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:absolute;left:-9999px;width:600px;height:900px';
      document.body.appendChild(iframe);

      // 3. Записываем HTML в iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('Cannot access iframe');
      
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      // 4. Ждём загрузки
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 5. Конвертируем в canvas
      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // 6. Создаём PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;

      pdf.addImage(imgData, 'PNG', imgX, 10, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`receipt-${orderNumber}.pdf`);

      // 7. Удаляем iframe
      document.body.removeChild(iframe);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback — открываем HTML версию
      window.open(`/api/receipt/${orderId}?format=html`, '_blank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={`${className} ${loading ? 'opacity-50 cursor-wait' : ''}`}
      title="Скачать чек"
    >
      {loading ? (
        <Loader2 className={showText ? 'w-3 h-3 animate-spin' : 'w-4 h-4 animate-spin'} />
      ) : (
        <Download className={showText ? 'w-3 h-3' : 'w-4 h-4'} />
      )}
      {showText && <span className="ml-1">Чек</span>}
    </button>
  );
}
