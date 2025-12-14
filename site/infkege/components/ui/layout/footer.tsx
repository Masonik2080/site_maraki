import Link from "next/link";
import { TelegramLogo } from "@phosphor-icons/react/dist/ssr";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-auto pb-24 md:pb-8 pt-12">
      <div className="layout-container">
        <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-2xl px-6 py-5 text-sm text-text-secondary">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Левая часть — копирайт и ссылки */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2">
              <span className="opacity-60">© {currentYear} INFKEGE</span>
              <Link href="/legal" className="hover:text-text-primary transition-colors">
                Оферта
              </Link>
            </div>
            
            {/* Правая часть — поддержка */}
            <div className="flex items-center gap-2 text-center md:text-right">
              <span className="opacity-60">Не работает сайт? Нашли ошибку? Остались вопросы?</span>
              <a 
                href="https://t.me/kegeDV" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-text-primary hover:opacity-80 transition-opacity font-medium"
              >
                <TelegramLogo weight="fill" className="w-4 h-4" />
                @kegeDV
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
