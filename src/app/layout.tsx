import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import { PwaInstallPrompt } from "@/components/common/PwaInstallPrompt";
import "./globals.css";

const themeScript = `
(function() {
  try {
    var key = 'inventory-theme';
    var storedTheme = window.localStorage.getItem(key);
    var theme = storedTheme === 'dark' || storedTheme === 'light'
      ? storedTheme
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.style.colorScheme = theme;
  } catch (e) {
    // ignore
  }
})();
`;

export const metadata: Metadata = {
  title: "E310 Inventory",
  description: "EThree10 department equipment, custody, and support ticket management hub",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "E310 Inventory",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Script id="theme-mode" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
