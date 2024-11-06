// app/layout.tsx
import { Providers } from '../app/providers';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Expertise Habitat',
  description: "Application d'expertise habitat",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning={true}>
      <head><link rel="icon" href="/favicon.ico" sizes="any" /></head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <Providers>
            {children}
        </Providers>
      </body>
    </html>
  );
}
