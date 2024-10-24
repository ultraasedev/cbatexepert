// app/housing-plans/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Box, Heading, Text, VStack, Spinner, Button, Badge } from '@chakra-ui/react'
import { expertisePlansAPI } from '../../lib/api'
import { EXPERTISE_STATUS } from '../../config/constant'

interface HousingPlan {
  id: string;
  beneficiary: {
    name: string;
    address: string;
    phone: string;
  };
  typeOfImprovement: string;
  fiscalIncome: number;
  estimatedCost: number;
  grantAmount: number;
  status: typeof EXPERTISE_STATUS[keyof typeof EXPERTISE_STATUS];
  createdAt: string;
}

export default function HousingPlanDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [plan, setPlan] = useState<HousingPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true)
        // Remplacez ceci par un appel API réel
        const data = await expertisePlansAPI.getById(id as string) as unknown as HousingPlan
        setPlan(data)
      } catch (error) {
        console.error('Erreur lors du chargement du plan:', error)
        // Gérer l'erreur (par exemple, afficher un message à l'utilisateur)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchPlan()
    }
  }, [id])

  if (loading) {
    return <Spinner />
  }

  if (!plan) {
    return <Text>Plan d'aide non trouvé.</Text>
  }

  return (
    <Box maxWidth="800px" margin="auto" mt={8} p={5} shadow="md" borderWidth="1px" borderRadius="md">
      <VStack spacing={4} align="stretch">
        <Heading size="lg">Plan d'aide à l'habitat #{plan.id}</Heading>
        <Badge colorScheme={plan.status === EXPERTISE_STATUS.TERMINE ? 'green' : 'orange'}>
          {plan.status}
        </Badge>
        
        <Box>
          <Heading size="md">Bénéficiaire</Heading>
          <Text><strong>Nom :</strong> {plan.beneficiary.name}</Text>
          <Text><strong>Adresse :</strong> {plan.beneficiary.address}</Text>
          <Text><strong>Téléphone :</strong> {plan.beneficiary.phone}</Text>
        </Box>

        <Box>
          <Heading size="md">Détails du plan</Heading>
          <Text><strong>Type d'amélioration :</strong> {plan.typeOfImprovement}</Text>
          <Text><strong>Revenu fiscal de référence :</strong> {plan.fiscalIncome.toLocaleString()} €</Text>
          <Text><strong>Coût estimé des travaux :</strong> {plan.estimatedCost.toLocaleString()} €</Text>
          <Text><strong>Montant de l'aide :</strong> {plan.grantAmount.toLocaleString()} €</Text>
        </Box>

        <Text><strong>Date de création :</strong> {new Date(plan.createdAt).toLocaleDateString()}</Text>

        <Button colorScheme="blue" onClick={() => router.push('/housing-plans')}>
          Retour à la liste
        </Button>
      </VStack>
    </Box>
  )
}