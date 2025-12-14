// app/layout.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Manrope } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { GlobalShell } from "@/components/ui/layout/global-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Show fallback font immediately
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"], // Removed 800 - rarely used
  display: "swap", // Show fallback font immediately
});

export const metadata: Metadata = {
  title: "INFKEGE - Подготовка к ЕГЭ по информатике",
  description: "Онлайн-курсы и материалы для подготовки к ЕГЭ по информатике. Задания, теория, практика.",
  keywords: ["ЕГЭ", "информатика", "подготовка", "курсы", "задания", "теория"],
  authors: [{ name: "INFKEGE" }],
  creator: "INFKEGE",
  publisher: "INFKEGE",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://infkege.ru",
    siteName: "INFKEGE",
    title: "INFKEGE - Подготовка к ЕГЭ по информатике",
    description: "Онлайн-курсы и материалы для подготовки к ЕГЭ по информатике",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "INFKEGE",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "INFKEGE - Подготовка к ЕГЭ по информатике",
    description: "Онлайн-курсы и материалы для подготовки к ЕГЭ по информатике",
    images: ["/twitter-image.png"],
  },
  verification: {
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

const NoFlashScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
      (function() {
        try {
          var theme = localStorage.getItem('theme');
          if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.setAttribute('data-theme', 'light');
          }
        } catch (e) {}
      })();
    `,
    }}
  />
);

// Analytics IDs (в продакшене загружать из БД/env)
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const YM_ID = process.env.NEXT_PUBLIC_YM_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning> 
      <head>
        <NoFlashScript />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#1a1a2e" />
      </head>
      <body className={`${geistSans.variable} ${manrope.variable}`}>
        <ThemeProvider>
          <AuthProvider>
            {/* Global loading indicator for slow networks */}
            <Suspense fallback={null}>
              <LoadingIndicator />
            </Suspense>
            <Suspense>
              <GlobalShell>
                {children}
              </GlobalShell>
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
        
        {/* Google Analytics */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
        
        {/* Yandex Metrika */}
        {YM_ID && (
          <Script id="yandex-metrika" strategy="afterInteractive">
            {`
              (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
              (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
              ym(${YM_ID}, "init", {
                clickmap:true,
                trackLinks:true,
                accurateTrackBounce:true,
                webvisor:true
              });
            `}
          </Script>
        )}
      </body>
    </html>
  );
}