// app/login/page.tsx
'use client';

import { Box, VStack, Image, Text, Link, useToast } from '@chakra-ui/react';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();

  const handleSubmit = async (email: string, password: string) => {
    try {
      await login(email, password);
    } catch (error) {
      toast({
        title: 'Erreur de connexion',
        description: 'Email ou mot de passe incorrect',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box maxWidth="400px" margin="auto" mt={16}>
      <VStack spacing={8} align="center">
        <Image src="/path-to-your-logo.svg" alt="Logo" width="48px" height="48px" />
        <LoginForm onSubmit={handleSubmit} />
      </VStack>
    </Box>
  );
}