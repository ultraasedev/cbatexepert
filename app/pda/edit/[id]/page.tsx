// app/pda/edit/[id]/page.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  AlertIcon,
  FormControl,
  FormLabel,
  Input,
  Select,
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { useAuth } from '../../../lib/auth';
import Sidebar from '../../../components/Sidebar';
import type { IPDA } from '../../../../models/pda';

interface EditablePDA extends Omit<IPDA, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

export default function EditPdaPage() {
  const [pda, setPda] = useState<EditablePDA | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isInitialMount = useRef(true);

  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { user, getAuthHeaders } = useAuth();

  // Charger les données du PDA
   // Charger les données du PDA une seule fois au montage
   useEffect(() => {
    const loadPda = async () => {
      if (!params.id || !user || !isInitialMount.current) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/pda/${params.id}`, {
          headers: getAuthHeaders()
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération du plan d\'aide');
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          if (user.role !== 'admin' && result.data.createdBy !== user.id) {
            throw new Error('Vous n\'avez pas l\'autorisation de modifier ce plan d\'aide');
          }
          setPda(result.data);
        } else {
          throw new Error(result.message || 'Erreur inconnue');
        }
      } catch (error: any) {
        console.error('Erreur de chargement:', error);
        setError(error.message);
        toast({
          title: "Erreur",
          description: error.message || "Impossible de charger le plan d'aide",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
        isInitialMount.current = false;
      }
    };

    loadPda();
  }, [params.id, user]);

 // Pour les fonctions handleChange et handleSubmit, ajoutez un useCallback
 const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value } = e.target;
  setPda(prevPda => {
    if (!prevPda) return null;
    const newPda = JSON.parse(JSON.stringify(prevPda)); // Deep clone
    
    // Gestion des champs imbriqués
    const keys = name.split('.');
    let current = newPda;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    // Calcul automatique du montant de l'aide si nécessaire
    if (name === 'details.estimatedCost') {
      const estimatedCost = parseFloat(value);
      if (!isNaN(estimatedCost)) {
        newPda.details.grantAmount = Math.round(estimatedCost * 0.4 * 100) / 100;
      }
    }

    return newPda;
  });
}, []);

const handleSubmit = useCallback(async () => {
  if (!pda || saving) return;

  try {
    setSaving(true);
    const response = await fetch(`/api/pda/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(pda)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la mise à jour');
    }

    toast({
      title: "Succès",
      description: "Le plan d'aide a été mis à jour avec succès",
      status: "success",
      duration: 3000,
      isClosable: true,
    });

    router.push('/pda');
  } catch (error: any) {
    toast({
      title: "Erreur",
      description: error.message || "Impossible de mettre à jour le plan d'aide",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  } finally {
    setSaving(false);
  }
}, [pda, params.id, getAuthHeaders, router, toast]);

const handleCancel = useCallback(() => {
  router.push('/pda');
}, [router]);


  if (loading) {
    return (
      <Box display="flex" flexDir={{ base: 'column', md: 'row' }}>
        <Sidebar />
        <Box flex="1">
          <Container maxW="7xl" py={{ base: 4, md: 8 }}>
            <VStack spacing={8} align="center" justify="center" minH="60vh">
              <Spinner size="xl" thickness="4px" speed="0.65s" />
              <Heading size={{ base: 'sm', md: 'md' }} color="gray.500">
                Chargement du plan d'aide...
              </Heading>
            </VStack>
          </Container>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" flexDir={{ base: 'column', md: 'row' }}>
        <Sidebar />
        <Box flex="1">
          <Container maxW="7xl" py={{ base: 4, md: 8 }}>
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

  if (!pda) return null;

  return (
    <Box display="flex" flexDir={{ base: 'column', md: 'row' }}>
      <Sidebar />
      <Box flex="1">
        <Container 
          maxW="7xl" 
          py={{ base: 4, md: 8 }}
          px={{ base: 2, sm: 4, md: 8 }}
        >
          <VStack spacing={{ base: 4, md: 8 }} align="stretch">
            {/* En-tête */}
            <HStack 
              justify="space-between" 
              align={{ base: 'flex-start', sm: 'center' }}
              flexDir={{ base: 'column', sm: 'row' }}
              gap={4}
            >
              <VStack align="stretch" spacing={{ base: 2, md: 4 }}>
                <Breadcrumb 
                  spacing='8px' 
                  separator={<ChevronRightIcon color='gray.500' />}
                  fontSize={{ base: 'sm', md: 'md' }}
                >
                  <BreadcrumbItem>
                    <BreadcrumbLink onClick={handleCancel}>
                      Plans d'aide
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbItem isCurrentPage>
                    <BreadcrumbLink>Modifier</BreadcrumbLink>
                  </BreadcrumbItem>
                </Breadcrumb>
                <Heading 
                  size={{ base: 'md', md: 'lg' }}
                  wordBreak="break-word"
                >
                  Modifier le plan d'aide pour {pda.details.beneficiary.name}
                </Heading>
              </VStack>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                width={{ base: '100%', sm: 'auto' }}
              >
                Annuler
              </Button>
            </HStack>

            {/* Formulaire */}
            <Box 
              bg="white" 
              p={{ base: 4, md: 8 }} 
              borderRadius="lg" 
              shadow="sm"
            >
              <VStack spacing={6} align="stretch">
                {/* Informations du bénéficiaire */}
                <Box>
                  <Heading size="md" mb={4}>Informations du bénéficiaire</Heading>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Nom</FormLabel>
                      <Input
                        name="details.beneficiary.name"
                        value={pda.details.beneficiary.name}
                        onChange={handleChange}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Adresse</FormLabel>
                      <Input
                        name="details.beneficiary.address"
                        value={pda.details.beneficiary.address}
                        onChange={handleChange}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Téléphone</FormLabel>
                      <Input
                        name="details.beneficiary.phone"
                        value={pda.details.beneficiary.phone}
                        onChange={handleChange}
                        type="tel"
                      />
                    </FormControl>
                  </VStack>
                </Box>

                {/* Informations du projet */}
                <Box>
                  <Heading size="md" mb={4}>Informations du projet</Heading>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Type d'amélioration</FormLabel>
                      <Select
                        name="details.typeOfImprovement"
                        value={pda.details.typeOfImprovement}
                        onChange={handleChange}
                      >
                        <option value="isolation">Isolation</option>
                        <option value="chauffage">Chauffage</option>
                        <option value="ventilation">Ventilation</option>
                        <option value="energie_renouvelable">Énergie renouvelable</option>
                      </Select>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Revenu fiscal</FormLabel>
                      <Input
                        name="details.fiscalIncome"
                        value={pda.details.fiscalIncome}
                        onChange={handleChange}
                        type="number"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Coût estimé</FormLabel>
                      <Input
                        name="details.estimatedCost"
                        value={pda.details.estimatedCost}
                        onChange={handleChange}
                        type="number"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Montant de l'aide (calculé automatiquement)</FormLabel>
                      <Input
                        value={pda.details.grantAmount}
                        isReadOnly
                        bg="gray.50"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Statut</FormLabel>
                      <Select
                        name="status"
                        value={pda.status}
                        onChange={handleChange}
                      >
                        <option value="En cours">En cours</option>
                        <option value="Terminé">Terminé</option>
                      </Select>
                    </FormControl>
                  </VStack>
                </Box>

                <HStack justify="flex-end" spacing={4}>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Annuler
                  </Button>
                  <Button
                    colorScheme="blue"
                    onClick={handleSubmit}
                    isLoading={saving}
                  >
                    Sauvegarder
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}