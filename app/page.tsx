// app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirige vers la page de login
    router.push('/login');
  }, [router]);

  return null; // Vous pouvez retourner un composant de chargement ici si besoin
}
