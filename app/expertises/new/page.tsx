// app/expertises/new/page.tsx
'use client';

import ExpertiseForm from '../../components/ExpertiseForm';
import { Box, Heading } from '@chakra-ui/react';
import Sidebar from '../../components/Sidebar';

export default function NewExpertise() {
  return (
    <Box display="flex">
      <Sidebar />
      <Box flex="1" p={8}>
        <Heading mb={6}>Nouvelle expertise</Heading>
        <ExpertiseForm />
      </Box>
    </Box>
  );
}
