'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Spinner,
  useToast,
  VStack,
  Button,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  HStack,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { useAuth } from '../../../lib/auth';
import ExpertiseForm from '../../../components/ExpertiseForm';
import Sidebar from '../../../components/Sidebar';
import type { Expertise } from '../../../types';

export default function EditExpertisePage() {
  const [expertise, setExpertise] = useState<Expertise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { user, getAuthHeaders } = useAuth();

  useEffect(() => {
    const loadExpertise = async () => {
      if (!params.id || !user) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/expertises/${params.id}`, {
          headers: getAuthHeaders()
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération de l\'expertise');
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          // Vérifier les permissions
          if (user.role !== 'admin' && result.data.createdBy !== user.id) {
            throw new Error('Vous n\'avez pas l\'autorisation de modifier cette expertise');
          }

          setExpertise(result.data);
        } else {
          throw new Error(result.message || 'Erreur inconnue');
        }
      } catch (error: any) {
        console.error('Erreur de chargement:', error);
        setError(error.message);
        toast({
          title: "Erreur",
          description: error.message || "Impossible de charger l'expertise",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    loadExpertise();
  }, [params.id, user]);

  const handleCancel = () => {
    router.push('/expertises');
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (formData: any) => {
    try {
      const response = await fetch(`/api/expertises/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de l\'expertise');
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Succès",
          description: "L'expertise a été mise à jour avec succès",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        // Pas de redirection automatique
      } else {
        throw new Error(result.message || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      console.error('Erreur de mise à jour:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour l'expertise",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex">
        <Sidebar />
        <Box flex="1">
          <Container maxW="7xl" py={8}>
            <VStack spacing={8} align="center" justify="center" minH="60vh">
              <Spinner size="xl" thickness="4px" speed="0.65s" />
              <Heading size="md" color="gray.500">
                Chargement de l'expertise...
              </Heading>
            </VStack>
          </Container>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex">
        <Sidebar />
        <Box flex="1">
          <Container maxW="7xl" py={8}>
            <VStack spacing={8} align="center" justify="center" minH="60vh">
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
              <Button onClick={handleCancel}>
                Retour à la liste
              </Button>
            </VStack>
          </Container>
        </Box>
      </Box>
    );
  }

  if (!expertise) {
    return null;
  }

  return (
    <Box display="flex">
      <Sidebar />
      <Box flex="1">
        <Container maxW="7xl" py={8}>
          <VStack spacing={8} align="stretch">
            <HStack justify="space-between" align="center">
              <VStack align="stretch" spacing={4}>
                <Breadcrumb 
                  spacing='8px' 
                  separator={<ChevronRightIcon color='gray.500' />}
                >
                  <BreadcrumbItem>
                    <BreadcrumbLink onClick={handleCancel}>
                      Expertises
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbItem isCurrentPage>
                    <BreadcrumbLink>Modifier</BreadcrumbLink>
                  </BreadcrumbItem>
                </Breadcrumb>
                <Heading size="lg">
                  Modifier l'expertise pour {`${expertise.beneficiaire?.nom || 'le bénéficiaire'}`}
                </Heading>
              </VStack>
              <Button 
                variant="outline" 
                onClick={handleCancel}
              >
                Annuler
              </Button>
            </HStack>

            <ExpertiseForm 
              isEditing={true}
              initialData={expertise}
              onSubmit={handleSubmit}
            />
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}