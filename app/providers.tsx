// app/providers.tsx
'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { ChakraCacheProvider } from './lib/with-chakra';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ChakraCacheProvider>
      <ChakraProvider>{children}</ChakraProvider>
    </ChakraCacheProvider>
  );
}
