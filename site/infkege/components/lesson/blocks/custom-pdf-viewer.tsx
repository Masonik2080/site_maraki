"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PDFDocumentProxy = any;
import { 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Loader2, 
  RotateCw,
  Maximize,
  Minimize,
  Expand,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Настройка воркера
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface CustomPdfViewerProps {
  fileUrl: string;
  title?: string;
}

export default function CustomPdfViewer({ fileUrl, title }: CustomPdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const [pageWidth, setPageWidth] = useState<number>(800);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const isMountedRef = useRef(true);
  
  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Cleanup PDF document on unmount
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy().catch(() => {});
        pdfDocRef.current = null;
      }
    };
  }, []);
  
  // Reset state when fileUrl changes
  useEffect(() => {
    // Destroy previous document before loading new one
    if (pdfDocRef.current) {
      pdfDocRef.current.destroy().catch(() => {});
      pdfDocRef.current = null;
    }
    setNumPages(0);
    setIsReady(false);
  }, [fileUrl]);

  // Расчет ширины
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setPageWidth(containerRef.current.clientWidth - 48); 
      }
    };

    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    
    window.addEventListener('resize', updateWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  // Выход по Esc
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const onDocumentLoadSuccess = useCallback((pdf: PDFDocumentProxy) => {
    if (!isMountedRef.current) {
      pdf.destroy().catch(() => {});
      return;
    }
    // Store reference for cleanup
    pdfDocRef.current = pdf;
    setNumPages(pdf.numPages);
    setIsReady(true);
  }, []);

  // Suppress AbortException and transport destroyed warnings
  const handleRenderError = useCallback((error: unknown) => {
    // Silently ignore expected errors during cleanup/navigation
    const err = error as Error | null;
    if (
      err?.name === 'AbortException' || 
      err?.message?.includes('cancelled') ||
      err?.message?.includes('sendWithStream') ||
      err?.message?.includes('Transport destroyed')
    ) {
      return;
    }
    console.error('PDF render error:', error);
  }, []);

  const changeScale = (delta: number) => {
    setScale((prev) => Math.min(Math.max(0.5, prev + delta), 3.0));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setScale(1.0);
  };

  return (
    <div className={cn("flex flex-col gap-4 transition-all duration-300", isFullscreen && "fixed inset-0 z-[100] h-screen w-screen bg-[--color-page-bg]")}>
      
      {/* --- ПЛАШКА-УВЕДОМЛЕНИЕ --- */}
      {!isFullscreen && (
        <div 
          onClick={toggleFullscreen}
          className="cursor-pointer bg-[--color-zinc-50] border border-[--color-border-main] p-4 rounded-xl flex items-center justify-between transition-all hover:bg-[--color-zinc-100] group shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="bg-[--color-page-bg] p-2.5 rounded-full border border-[--color-border-main] text-[--color-text-secondary] group-hover:text-[--color-action] group-hover:border-[--color-action]/30 transition-colors shadow-sm">
              <Expand size={20} />
            </div>
            <div>
              <h4 className="font-medium text-text-primary text-sm sm:text-base group-hover:text-action transition-colors">
                Развернуть документ
              </h4>
              <p className="text-xs text-text-secondary hidden sm:block mt-0.5">
                Нажмите, чтобы открыть на весь экран для удобного чтения
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="pointer-events-none bg-[--color-page-bg] group-hover:border-[--color-action]/30 group-hover:text-[--color-action]">
            Открыть
          </Button>
        </div>
      )}

      {/* --- ГЛАВНЫЙ КОНТЕЙНЕР --- */}
      <div className={cn(
        "flex flex-col bg-[--color-zinc-50] border border-[--color-border-main] overflow-hidden",
        isFullscreen ? "h-full border-0" : "rounded-xl h-[600px]"
      )}>
        
        {/* --- ТУЛБАР --- */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[--color-page-bg] border-b border-[--color-border-main] shrink-0 z-20">
          
          {/* Инфо */}
          <div className="flex items-center gap-3 min-w-0">
             <div className="text-sm font-medium text-text-primary truncate max-w-[150px] sm:max-w-[300px]" title={title}>
               {title || "Документ"}
             </div>
             <div className="text-[11px] font-mono text-text-secondary bg-zinc-100 px-2 py-1 rounded-md border border-border-main/50">
               {numPages > 0 ? `${numPages} стр.` : "..."}
             </div>
          </div>

          {/* Инструменты */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-zinc-50 border border-border-main rounded-md p-0.5">
              <button onClick={() => changeScale(-0.1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded transition-all text-text-secondary hover:text-text-primary">
                <ZoomOut size={16} />
              </button>
              <span className="text-xs w-9 text-center select-none font-mono text-text-primary pt-0.5">
                {Math.round(scale * 100)}%
              </span>
              <button onClick={() => changeScale(0.1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded transition-all text-text-secondary hover:text-text-primary">
                <ZoomIn size={16} />
              </button>
            </div>

            <div className="w-[1px] h-6 bg-border-main/60 mx-1 hidden sm:block" />

            <button 
              onClick={() => setRotation((prev) => (prev + 90) % 360)} 
              className="p-2 hover:bg-zinc-100 rounded-md transition-colors text-text-secondary border border-transparent hover:border-border-main"
              title="Повернуть"
            >
              <RotateCw size={18} />
            </button>

            <a 
              href={fileUrl} 
              download 
              target="_blank"
              className="p-2 hover:bg-zinc-100 rounded-md transition-colors text-text-secondary border border-transparent hover:border-border-main"
              title="Скачать PDF"
            >
              <Download size={18} />
            </a>

            {isFullscreen && (
              <button 
                onClick={toggleFullscreen} 
                className="ml-2 p-2 bg-zinc-100 hover:bg-zinc-200 text-text-primary rounded-md transition-colors border border-border-main"
                title="Выйти из полноэкранного режима"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* --- ОБЛАСТЬ ПРОСМОТРА --- */}
        <div 
          ref={containerRef}
          className="flex-1 w-full overflow-auto relative bg-zinc-100/50 p-4 sm:p-8 custom-scrollbar scroll-smooth"
        >
          <Document
            key={fileUrl}
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-text-secondary min-h-[300px]">
                <Loader2 className="animate-spin text-action" size={32} />
                <p className="text-sm">Загрузка документа...</p>
              </div>
            }
            error={
              <div className="w-full h-full flex flex-col items-center justify-center text-red-500 gap-3 min-h-[300px]">
                <p>Не удалось отобразить PDF</p>
                <Button asChild variant="outline" size="sm">
                  <a href={fileUrl} download>Скачать файл</a>
                </Button>
              </div>
            }
            className="flex flex-col gap-6 items-center w-full"
          >
            {isReady && Array.from(new Array(numPages), (el, index) => (
              <div 
                  key={`page_${index + 1}`} 
                  className="shadow-md border border-border-main/40 relative bg-white transition-transform duration-200 origin-top"
              >
                 <Page 
                    pageNumber={index + 1} 
                    width={pageWidth ? pageWidth * scale : 600} 
                    rotate={rotation}
                    loading={
                      <div className="bg-white animate-pulse" style={{ 
                          width: (pageWidth || 600) * scale, 
                          height: (pageWidth || 600) * 1.41 * scale
                      }} />
                    }
                    className="bg-white block"
                    renderAnnotationLayer={true}
                    renderTextLayer={true}
                    devicePixelRatio={2}
                    
                    // --- ИСПРАВЛЕНИЕ ОШИБКИ ---
                    // Глушим ошибки отмены рендера (AbortException), чтобы не спамили в консоль
                    onRenderTextLayerError={handleRenderError}
                    onRenderAnnotationLayerError={handleRenderError}
                    onRenderError={handleRenderError}
                 />
                 
                 <div className="absolute top-2 right-[-35px] text-[10px] text-text-secondary font-mono hidden xl:block select-none">
                   {index + 1}
                 </div>
              </div>
            ))}
          </Document>
        </div>
      </div>
    </div>
  );
}