import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { ValidationProvider } from "@/hooks/use-validation";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fiscal Copilot AI",
  description: "Valida el crédito fiscal antes del registro contable.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <ValidationProvider>
              {children}
              <Toaster position="top-right" richColors />
            </ValidationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
