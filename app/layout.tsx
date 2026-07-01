import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/AuthProvider";
import { SiteNav } from "@/components/SiteNav";

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
          <SiteNav />
          {children}
          {modal}
          <Toaster position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
