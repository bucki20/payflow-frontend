import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/i18n/provider";
import { WalletProvider } from "@/lib/wallet";
import { WalletLayoutInner } from "@/components/WalletLayoutInner";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const cspContent =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_DISABLE_CSP !== "1"
    ? [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "form-action 'self'",
        "img-src 'self' data: blob: https://*.walletconnect.com https://*.walletconnect.org",
        "font-src 'self' data:",
        "style-src 'self' 'unsafe-inline'",
        `connect-src 'self' ws://localhost:3000 ${process.env.NEXT_PUBLIC_CSP_CONNECT_SRC ?? ""}`,
        "frame-src 'self' https://verify.walletconnect.com",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      ].join("; ")
    : null;

export const metadata: Metadata = {
  title: "Payflow — recurring payments on Stellar",
  description:
    "Pull-based recurring payments for Stellar. Subscribers authorize a bounded, revocable mandate once; anyone can settle it when it falls due.",
  manifest: `${basePath}/manifest.webmanifest`,
  icons: {
    icon: `${basePath}/icon-192.png`,
    apple: `${basePath}/icon-192.png`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The inline script below sets `data-theme` on this element before the
    // first paint, so the server markup (no attribute) and the DOM can differ
    // by design. Suppressing the warning is the documented pattern for a
    // pre-paint theme script.
    <html lang="en" suppressHydrationWarning>
      <head>
        {cspContent && (
          <meta
            httpEquiv="Content-Security-Policy"
            content={cspContent}
          />
        )}
        <meta name="theme-color" content="#0b0e14" />
        <link rel="apple-touch-icon" href={`${basePath}/icon-192.png`} />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <I18nProvider>
        <WalletProvider>
          <WalletLayoutInner>{children}</WalletLayoutInner>
        </WalletProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
