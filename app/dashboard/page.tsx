// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { Box, VStack, Flex, Spinner, Center } from '@chakra-ui/react';
import WelcomeHeader from '../components/WelcomeHeader';
import Sidebar from '../components/Sidebar';
import StatsCard from '../components/StatsCard';

export default function Dashboard() {
  const { user, loading, requireAuth } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    requireAuth(() => {
      console.log('Utilisateur authentifié accédant au dashboard');
      setIsReady(true);
    });
  }, [requireAuth]);

  if (loading || !isReady) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="purple.500" />
      </Center>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Box display="flex">
      <Sidebar />
      <Box ml="250px" p={8} flex="1">
        <VStack spacing={6} align="stretch">
          <Flex justify="space-between" align="center">
            <WelcomeHeader user={user} />
          </Flex>
          <StatsCard />
        </VStack>
      </Box>
    </Box>
  );
}