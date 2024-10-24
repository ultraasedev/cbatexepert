// components/WelcomeHeader.tsx
'use client';

import { HStack, Avatar, Text, VStack } from '@chakra-ui/react';

interface WelcomeHeaderProps {
  user: {
    email: string;
    role: string;
  };
}

export default function WelcomeHeader({ user }: WelcomeHeaderProps) {
  const gravatarUrl = `https://www.gravatar.com/avatar/${user.email}?d=identicon`; // Générer l'URL Gravatar basé sur l'email

  return (
    <HStack spacing={3} justify="flex-end">
      <Avatar size="md" src={gravatarUrl} />
      <VStack spacing={0} align="flex-end">
        <Text fontSize="lg">Bonjour, {user.email}</Text>
        <Text fontSize="sm" color="gray.600">
          Rôle : {user.role}
        </Text>
      </VStack>
    </HStack>
  );
}
