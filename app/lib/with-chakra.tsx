// lib/with-chakra.tsx
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { ReactNode } from 'react';

// Création du cache Emotion avec une clé spécifique pour Chakra UI
const chakraEmotionCache = createCache({ key: 'chakra', prepend: true });

interface ChakraCacheProviderProps {
  children: ReactNode;
}

export function ChakraCacheProvider({ children }: ChakraCacheProviderProps) {
  return <CacheProvider value={chakraEmotionCache}>{children}</CacheProvider>;
}
