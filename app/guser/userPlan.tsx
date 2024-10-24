// app/guser/userPlan.tsx
'use client'

import { useState, useEffect } from 'react';
import { Box, Heading, List, ListItem, Text } from '@chakra-ui/react';
import { useParams } from 'next/navigation';

interface PDA {
  _id: string;
  title: string;
  status: string;
  details: {
    beneficiary: {
      name: string;
      address: string;
      phone: string;
    };
    typeOfImprovement: string;
    fiscalIncome: number;
    estimatedCost: number;
    grantAmount: number;
  }
}

export default function UserPlans() {
  const [plans, setPlans] = useState<PDA[]>([]);
  const params = useParams();
  const userId = params.userId as string;

  useEffect(() => {
    if (userId) {
      fetchUserPlans();
    }
  }, [userId]);

  const fetchUserPlans = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/plans`);
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      } else {
        throw new Error('Erreur lors de la récupération des plans');
      }
    } catch (error) {
      console.error('Erreur:', error instanceof Error ? error.message : 'Une erreur est survenue');
    }
  };

  return (
    <Box>
      <Heading as="h2" size="lg" mb={4}>Plans d'aide de l'utilisateur</Heading>
      <List spacing={3}>
        {plans.map((plan) => (
          <ListItem key={plan._id}>
            <Text><strong>Titre:</strong> {plan.title}</Text>
            <Text><strong>Statut:</strong> {plan.status}</Text>
            <Text><strong>Bénéficiaire:</strong> {plan.details.beneficiary.name}</Text>
            <Text><strong>Type d'amélioration:</strong> {plan.details.typeOfImprovement}</Text>
            <Text><strong>Revenu fiscal:</strong> {plan.details.fiscalIncome} €</Text>
            <Text><strong>Coût estimé:</strong> {plan.details.estimatedCost} €</Text>
            <Text><strong>Montant de l'aide:</strong> {plan.details.grantAmount} €</Text>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}