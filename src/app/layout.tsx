import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "SalonSoft Pro — Salon Management System",
  description: "World-class salon & barbershop management SaaS for Indian salons. Billing, CRM, GST, WhatsApp — all in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn("antialiased min-h-screen bg-background text-foreground")}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
