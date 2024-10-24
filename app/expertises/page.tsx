// app/expertises/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Box, Heading, Text, VStack, Spinner, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react'
import Link from 'next/link'
import Sidebar from '../components/Sidebar';

interface ExpertisePlanSummary {
  id: string;
  title: string;
  createdAt: string;
  status: 'En cours' | 'Terminé';
}

// Simulons une fonction qui récupère la liste des plans d'expertise
const fetchExpertisePlans = async (): Promise<ExpertisePlanSummary[]> => {
  // Dans une vraie application, ceci serait un appel API
  await new Promise(resolve => setTimeout(resolve, 1000)) // Simule un délai réseau
  return [
    { id: '1', title: 'Plan d\'expertise #1', createdAt: '2023-01-15', status: 'Terminé' },
    { id: '2', title: 'Plan d\'expertise #2', createdAt: '2023-02-20', status: 'En cours' },
    { id: '3', title: 'Plan d\'expertise #3', createdAt: '2023-03-10', status: 'Terminé' },
    // Ajoutez plus de plans ici pour simuler une plus grande liste
  ]
}

export default function ExpertisePlansList() {
  const [plans, setPlans] = useState<ExpertisePlanSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await fetchExpertisePlans()
        setPlans(data)
      } catch (error) {
        console.error('Erreur lors du chargement des plans:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPlans()
  }, [])

  if (loading) {
    return (
      <Box display="flex">
        <Sidebar />
        <Box flex="1" p={8}>
          <Spinner />
        </Box>
      </Box>
    )
  }

  return (
    

    <Box display="flex">
      <Sidebar />
      <Box flex="1" p={8}>
        <Heading mb={6}>Plans d'expertise réalisés</Heading>
        {plans.length === 0 ? (
          <Text>Aucun plan d'expertise n'a été réalisé pour le moment.</Text>
        ) : (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Titre</Th>
                <Th>Date de création</Th>
                <Th>Statut</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {plans.map((plan) => (
                <Tr key={plan.id}>
                  <Td>{plan.title}</Td>
                  <Td>{new Date(plan.createdAt).toLocaleDateString()}</Td>
                  <Td>{plan.status}</Td>
                  <Td>
                    <Link href={`/expertises/${plan.id}`}>
                      Voir les détails
                    </Link>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>
    </Box>
  )
}