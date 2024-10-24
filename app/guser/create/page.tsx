'use client'

import { Box, Heading } from '@chakra-ui/react';
import CreateUser from '../../components/CreateUser';
import Sidebar from '../../components/Sidebar';

export default function CreateUserPage() {
  return (
    <Box display="flex">
      <Sidebar />
      <Box flex="1" p={8}>
        <Heading mb={6}>Créer un nouvel utilisateur</Heading>
        <CreateUser />
      </Box>
    </Box>
  );
}