'use client'

import { Box, Heading } from '@chakra-ui/react';
import ManageUsers from '../../components/ManageUser';
import Sidebar from '../../components/Sidebar';

export default function ManageUsersPage() {
  return (
    <Box display="flex" flexDir={{ base: 'column', md: 'row' }}>
      <Sidebar />
      <Box 
        flex="1" 
        p={{ base: 4, sm: 6, md: 8 }}
        width={{ base: '100%', md: 'auto' }}
      >
        <Heading 
          mb={{ base: 4, md: 6 }}
          size={{ base: 'md', md: 'lg' }}
        >
          Gérer les utilisateurs
        </Heading>
        <ManageUsers />
      </Box>
    </Box>
  );
}