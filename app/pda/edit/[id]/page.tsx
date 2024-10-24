'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  NumberInput,
  NumberInputField,
  useToast,
  Select,
  Text,
  Spinner
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import { useAuth } from '../../../lib/auth';

interface PdaFormData {
  title: string;
  status: 'En cours' | 'Terminé';
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
  };
}

export default function EditPdaPage({ params }: { params: { id: string } }) {
  const [formData, setFormData] = useState<PdaFormData>({
    title: '',
    status: 'En cours',
    details: {
      beneficiary: {
        name: '',
        address: '',
        phone: ''
      },
      typeOfImprovement: '',
      fiscalIncome: 0,
      estimatedCost: 0,
      grantAmount: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();

  // Charger les données du PDA
  useEffect(() => {
    const fetchPda = async () => {
      try {
        const response = await fetch(`/api/pda/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        });

        if (!response.ok) {
          throw new Error('Erreur lors du chargement du plan d\'aide');
        }

        const data = await response.json();
        setFormData(data.data);
      } catch (error) {
        setError('Impossible de charger les données du plan d\'aide');
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données du plan d\'aide',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPda();
    }
  }, [params.id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/pda/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du plan d\'aide');
      }

      toast({
        title: 'Succès',
        description: 'Le plan d\'aide a été mis à jour avec succès',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      router.push('/pda');
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (path: string, value: any) => {
    setFormData(prev => {
      const newFormData = { ...prev };
      const keys = path.split('.');
      let current: any = newFormData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newFormData;
    });
  };

  if (loading) {
    return (
      <Box display="flex">
        <Sidebar />
        <Box flex="1" p={8} display="flex" justifyContent="center" alignItems="center">
          <Spinner size="xl" />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex">
        <Sidebar />
        <Box flex="1" p={8}>
          <Text color="red.500">{error}</Text>
          <Button mt={4} onClick={() => router.push('/pda')}>Retour à la liste</Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex">
      <Sidebar />
      <Box flex="1" p={8}>
        <VStack spacing={6} align="stretch" as="form" onSubmit={handleSubmit}>
          <Heading>Modifier le plan d'aide</Heading>

          <FormControl isRequired>
            <FormLabel>Titre</FormLabel>
            <Input
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Statut</FormLabel>
            <Select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
            >
              <option value="En cours">En cours</option>
              <option value="Terminé">Terminé</option>
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Nom du bénéficiaire</FormLabel>
            <Input
              value={formData.details.beneficiary.name}
              onChange={(e) => handleInputChange('details.beneficiary.name', e.target.value)}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Adresse du bénéficiaire</FormLabel>
            <Input
              value={formData.details.beneficiary.address}
              onChange={(e) => handleInputChange('details.beneficiary.address', e.target.value)}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Téléphone du bénéficiaire</FormLabel>
            <Input
              value={formData.details.beneficiary.phone}
              onChange={(e) => handleInputChange('details.beneficiary.phone', e.target.value)}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Type d'amélioration</FormLabel>
            <Input
              value={formData.details.typeOfImprovement}
              onChange={(e) => handleInputChange('details.typeOfImprovement', e.target.value)}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Revenu fiscal</FormLabel>
            <NumberInput
              value={formData.details.fiscalIncome}
              onChange={(valueString) => handleInputChange('details.fiscalIncome', Number(valueString))}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Coût estimé</FormLabel>
            <NumberInput
              value={formData.details.estimatedCost}
              onChange={(valueString) => handleInputChange('details.estimatedCost', Number(valueString))}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Montant de l'aide</FormLabel>
            <NumberInput
              value={formData.details.grantAmount}
              onChange={(valueString) => handleInputChange('details.grantAmount', Number(valueString))}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>

          <Box display="flex" gap={4}>
            <Button colorScheme="blue" type="submit" isLoading={loading}>
              Enregistrer les modifications
            </Button>
            <Button onClick={() => router.push('/pda')}>
              Annuler
            </Button>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
}