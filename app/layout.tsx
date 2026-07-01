import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/AuthProvider";

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <a
            href="/"
            aria-label="Home"
            title="Home"
            className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-apb shadow-sm backdrop-blur transition hover:bg-apb hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 9.5 12 3l9 6.5" />
              <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" />
            </svg>
          </a>
          {children}
          {modal}
          <Toaster position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
