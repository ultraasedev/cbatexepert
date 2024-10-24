// app/expertises/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Box, Heading, Text, VStack, Spinner } from '@chakra-ui/react'
import Sidebar from '@/app/components/Sidebar';

interface ExpertisePlan {
  id: string;
  title: string;
  createdAt: string;
  status: 'En cours' | 'Terminé';
  details: {
    [key: string]: string | number;
  };
}

// Simulons une fonction qui récupère les données d'un plan d'expertise
const fetchExpertisePlan = async (id: string): Promise<ExpertisePlan> => {
  // Dans une vraie application, ceci serait un appel API
  await new Promise(resolve => setTimeout(resolve, 1000)) // Simule un délai réseau
  return {
    id,
    title: `Plan d'expertise #${id}`,
    createdAt: new Date().toISOString(),
    status: 'En cours',
    details: {
      'Type de logement': 'Appartement',
      'Superficie': 75,
      'Année de construction': 1998,
      'Etat général': 'Bon',
    }
  }
}

export default function ExpertisePlanDetail() {
  const { id } = useParams()
  const [plan, setPlan] = useState<ExpertisePlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const data = await fetchExpertisePlan(id as string)
        setPlan(data)
      } catch (error) {
        console.error('Erreur lors du chargement du plan:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPlan()
  }, [id])

  if (loading) {
    return (
      <Box display="flex">
        <Sidebar />
        <Box flex="1" p={8}>
          <Spinner />
        </Box>
      </Box>
    );
  }

  if (!plan) {
    return (
      <Box display="flex">
        <Sidebar />
        <Box flex="1" p={8}>
          <Text>Plan d'expertise non trouvé.</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex">
      <Sidebar />
      <Box flex="1" p={8}>
        <VStack spacing={4} align="stretch">
          <Heading>{plan.title}</Heading>
          <Text>Date de création: {new Date(plan.createdAt).toLocaleDateString()}</Text>
          <Text>Statut: {plan.status}</Text>
          <Heading size="md">Détails</Heading>
          {Object.entries(plan.details).map(([key, value]) => (
            <Text key={key}>
              <strong>{key}:</strong> {value}
            </Text>
          ))}
        </VStack>
      </Box>
    </Box>
  )
}