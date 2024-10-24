// app/expertises/new/page.tsx
'use client';

import ExpertiseForm from '@/app/components/ExpertiseForm';
import { Box, Heading, IconButton } from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
export default function NewExpertise() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/dashboard');
  };

  return (
    <Box display="flex">
    <Sidebar />
    <Box flex="1" p={8}>
      <Heading as="h1" size="xl" mb={6}>
        
      </Heading>
      <ExpertiseForm />
    </Box>
  </Box>
   
  );
}
