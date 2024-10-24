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
    <html lang="fr">
      <body className={`${inter.className}`}>
        <Providers>
            {children}
        </Providers>
      </body>
    </html>
  );
}
