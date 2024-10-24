// components/StatsCard.tsx
'use client';

import { Box, Text, VStack, HStack, Icon, Heading } from '@chakra-ui/react';
import { FaChartLine, FaCalendarAlt, FaUserShield } from 'react-icons/fa';

export default function StatsCard() {
  return (
    <Box
      w="100%"
      p={6}
      borderWidth={1}
      borderRadius="md"
      boxShadow="md"
      bg="white"
    >
      <Heading size="md" mb={4}>
        Statistiques
      </Heading>
      <VStack spacing={4} align="stretch">
        <HStack spacing={3}>
          <Icon as={FaCalendarAlt} color="blue.500" />
          <Text fontSize="lg">Diagnostics mensuels : </Text>
          <Text fontWeight="bold">25</Text>
        </HStack>
        <HStack spacing={3}>
          <Icon as={FaChartLine} color="green.500" />
          <Text fontSize="lg">Diagnostics annuels : </Text>
          <Text fontWeight="bold">300</Text>
        </HStack>
        <HStack spacing={3}>
          <Icon as={FaUserShield} color="purple.500" />
          <Text fontSize="lg">Plans d’aide : </Text>
          <Text fontWeight="bold">10</Text>
        </HStack>
      </VStack>
    </Box>
  );
}
