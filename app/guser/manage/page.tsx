'use client'

import { Box, Heading } from '@chakra-ui/react';
import ManageUsers from '../../components/ManageUser';
import Sidebar from '../../components/Sidebar';

export default function ManageUsersPage() {
  return (
    <Box display="flex">
      <Sidebar />
      <Box flex="1" p={8}>
        <Heading mb={6}>Gérer les utilisateurs</Heading>
        <ManageUsers />
      </Box>
    </Box>
  );
}