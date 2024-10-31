// app/expertises/new/page.tsx
'use client';

import ExpertiseForm from '../../components/ExpertiseForm';
import { Box, Heading } from '@chakra-ui/react';
import Sidebar from '../../components/Sidebar';

export default function NewExpertise() {
  return (
    <Box display="flex" flexDir={{ base: 'column', md: 'row' }}>
      <Sidebar />
      <Box 
        flex="1" 
        p={{ base: 4, md: 8 }}
        width={{ base: '100%', md: 'auto' }}
      >
        <Heading 
          mb={{ base: 4, md: 6 }}
          size={{ base: 'md', md: 'lg' }}
        >
          Nouvelle expertise
        </Heading>
        <ExpertiseForm />
      </Box>
    </Box>
  );
}
