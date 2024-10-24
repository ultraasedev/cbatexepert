// app/expertises/edit/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Spinner,
  Button,
  useToast,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  Radio,
  RadioGroup,
  Stack,
  Checkbox,
  IconButton,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Flex,
  Badge,
  Divider,
  FormControl,
  FormLabel,
  Textarea,
  useBreakpointValue,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { FaPlus, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import Sidebar from '../../../../components/Sidebar';
import { useAuth } from '../../../../lib/auth';

// Types et constantes (les mêmes que pour le formulaire de création)
const ROOM_TYPES = [
  'Salon',
  'Cuisine',
  'Chambre',
  'Salle de bain',
  'WC',
  'Bureau',
  'Buanderie',
  'Cave',
  'Garage'
];

const HEATING_TYPES = [
  'Électrique',
  'Gaz',
  'Fioul',
  'Bois',
  'Poêle',
  'Pompe à chaleur'
];

const VENTILATION_TYPES = [
  'VMC Simple flux',
  'Double Flux',
  'VMI',
  'VPH'
];

const FACADE_TYPES = [
  'Enduit',
  'Peinture',
  'Pierre'
];

const INSULATION_TYPES = [
  'Ouate de cellulose',
  'Laine de Roche',
  'Laine de Verre',
  'Isolation Minerales'
];

interface ExpertiseFormData {
  buildingType: 'maison' | 'appartement';
  details: {
    beneficiary: {
      firstName: string;
      lastName: string;
      address: string;
      phone: string;
    };
    construction: {
      year: number;
      area: number;
      floors: number;
    };
    rooms: Array<{
      id: string;
      type: string;
      floor: number;
      windows: {
        count: number;
        type: 'simple' | 'double';
        installationYear: number;
      };
      heating: {
        types: string[];
        installationYear: number;
      };
      ventilation: string[];
      humidity: number;
    }>;
    facades: Array<{
      type: string;
      thickness: number;
      lastMaintenance: string;
      condition: 'Bon' | 'Moyen' | 'Mauvais';
    }>;
    electrical: {
      type: 'Mono' | 'Triphasé';
      installationYear: number;
      hasLinky: boolean;
      upToStandards: boolean;
      condition: 'Bon' | 'Moyen' | 'Mauvais';
    };
    insulation: {
      type: string;
      installation: string;
      thickness: number;
      hasCondensation: boolean;
      condensationLocations: string[];
      humidityRate: number;
      condition: 'Bon' | 'Moyen' | 'Mauvais';
    };
    framework: {
      type: string;
      hasBeam: boolean;
      hadMaintenance: boolean;
      maintenanceDate: string | null;
      condition: 'Bon' | 'Moyen' | 'Mauvais';
    };
    roof: {
      type: string;
      ridgeType: string;
      maintenanceDate: string;
      maintenanceType: string;
      hasImpurities: boolean;
      installationYear: number;
      condition: 'Bon' | 'Moyen' | 'Mauvais';
    };
  };
  evaluations: {
    rooms: {
      [key: string]: {
        windows: number;
        heating: number;
        humidity: number;
        ventilation: number;
      };
    };
    global: {
      score: number;
      condition: 'Favorable' | 'Correct' | 'Critique';
      comment: string;
    };
  };
}

export default function EditExpertise({ params }: { params: { id: string } }) {
  const [formData, setFormData] = useState<ExpertiseFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();

  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    const fetchExpertise = async () => {
      try {
        const response = await fetch(`/api/expertise/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des données');
        }

        const data = await response.json();
        setFormData(data.data);
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données de l\'expertise',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        router.push('/expertises');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchExpertise();
    }
  }, [params.id, router, toast]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      if (!prev) return prev;

      const newData = { ...prev };
      const keys = field.split('.');
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
    setHasChanges(true);
  };

  const handleRoomUpdate = (index: number, field: string, value: any) => {
    setFormData(prev => {
      if (!prev) return prev;

      const newRooms = [...prev.details.rooms];
      newRooms[index] = {
        ...newRooms[index],
        [field]: value
      };

      return {
        ...prev,
        details: {
          ...prev.details,
          rooms: newRooms
        }
      };
    });
    setHasChanges(true);
  };

  const addRoom = () => {
    if (!formData) return;

    setFormData(prev => {
      if (!prev) return prev;

      const newRoom = {
        id: Date.now().toString(),
        type: '',
        floor: 0,
        windows: {
          count: 0,
          type: 'simple' as const,
          installationYear: new Date().getFullYear()
        },
        heating: {
          types: [],
          installationYear: new Date().getFullYear()
        },
        ventilation: [],
        humidity: 0
      };

      return {
        ...prev,
        details: {
          ...prev.details,
          rooms: [...prev.details.rooms, newRoom]
        }
      };
    });
    setHasChanges(true);
  };

  const removeRoom = (index: number) => {
    setFormData(prev => {
      if (!prev) return prev;

      const newRooms = prev.details.rooms.filter((_, i) => i !== index);
      return {
        ...prev,
        details: {
          ...prev.details,
          rooms: newRooms
        }
      };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!formData) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/expertise/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      toast({
        title: 'Succès',
        description: 'Expertise mise à jour avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setHasChanges(false);
      router.push('/expertises');
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'expertise',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('Voulez-vous vraiment annuler ? Les modifications seront perdues.')) {
        router.push('/expertises');
      }
    } else {
      router.push('/expertises');
    }
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

  if (!formData) {
    return (
      <Box display="flex">
        <Sidebar />
        <Box flex="1" p={8}>
          <Alert status="error">
            <AlertIcon />
            Impossible de charger les données de l'expertise
          </Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex">
      <Sidebar />
      <Box flex="1" p={4} maxW="1400px" margin="0 auto">
        <VStack spacing={6} align="stretch">
          {/* En-tête */}
          <Flex justifyContent="space-between" alignItems="center" wrap="wrap" gap={4}>
            <Heading size="lg">Modifier l'expertise</Heading>
            <HStack spacing={4}>
              <Button
                leftIcon={<FaTimes />}
                variant="ghost"
                onClick={handleCancel}
              >
                Annuler
              </Button>
              <Button
                leftIcon={<FaSave />}
                colorScheme="blue"
                onClick={handleSave}
                isLoading={saving}
                disabled={!hasChanges}
              >
                Enregistrer
              </Button>
            </HStack>
          </Flex>

          {hasChanges && (
            <Alert status="info">
              <AlertIcon />
              Des modifications non enregistrées sont en cours.
            </Alert>
          )}

          {/* Contenu principal */}
          <Accordion 
            defaultIndex={[0]} 
            allowMultiple 
            width="100%"
          >
            {/* Section Informations de base */}
            <AccordionItem>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <Heading size="md">Informations de base</Heading>
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel>
                <Grid 
                  templateColumns={isMobile ? "1fr" : "repeat(2, 1fr)"}
                  gap={6}
                >
                  <Card>
                    <CardHeader>
                      <Heading size="sm">Type de bâtiment</Heading>
                    </CardHeader>
                    <CardBody>
                      <RadioGroup
                        value={formData.buildingType}
                        onChange={(value) => handleInputChange('buildingType', value)}
                      >
                        <Stack direction="row">
                          <Radio value="maison">Maison</Radio>
                          <Radio value="appartement">Appartement</Radio>
                        </Stack>
                      </RadioGroup>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="sm">Bénéficiaire</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4}>
                        <FormControl>
                          <FormLabel>Prénom</FormLabel>
                          <Input
                            value={formData.details.beneficiary.firstName}
                            onChange={(e) => handleInputChange('details.beneficiary.firstName', e.target.value)}
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Nom</FormLabel>
                          <Input
                            value={formData.details.beneficiary.lastName}
                            onChange={(e) => handleInputChange('details.beneficiary.lastName', e.target.value)}
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Adresse</FormLabel>
                          <Input
                            value={formData.details.beneficiary.address}
                            onChange={(e) => handleInputChange('details.beneficiary.address', e.target.value)}
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Téléphone</FormLabel>
                          <Input
                            value={formData.details.beneficiary.phone}
                            onChange={(e) => handleInputChange('details.beneficiary.phone', e.target.value)}
                          />
                        </FormControl>
                      </VStack>
                    </CardBody>
                  </Card>
                </Grid>
              </AccordionPanel>
            </AccordionItem>
{/* Section Configuration des pièces */}
<AccordionItem>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <Heading size="md">Configuration des pièces</Heading>
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel>
                <VStack spacing={4}>
                  <Button
                    leftIcon={<FaPlus />}
                    colorScheme="blue"
                    onClick={addRoom}
                  >
                    Ajouter une pièce
                  </Button>

                  {formData.details.rooms.map((room, index) => (
                    <Card key={room.id} width="100%">
                      <CardHeader>
                        <Flex justify="space-between" align="center">
                          <Heading size="sm">
                            {room.type || 'Nouvelle pièce'} {room.floor > 0 ? `(Étage ${room.floor})` : '(RDC)'}
                          </Heading>
                          <IconButton
                            aria-label="Supprimer la pièce"
                            icon={<FaTrash />}
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => removeRoom(index)}
                          />
                        </Flex>
                      </CardHeader>
                      <CardBody>
                        <Grid 
                          templateColumns={isMobile ? "1fr" : "repeat(2, 1fr)"} 
                          gap={4}
                        >
                          <FormControl>
                            <FormLabel>Type de pièce</FormLabel>
                            <Select
                              value={room.type}
                              onChange={(e) => handleRoomUpdate(index, 'type', e.target.value)}
                            >
                              <option value="">Sélectionnez un type</option>
                              {ROOM_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </Select>
                          </FormControl>

                          <FormControl>
                            <FormLabel>Étage</FormLabel>
                            <NumberInput
                              value={room.floor}
                              min={0}
                              max={formData.details.construction.floors}
                              onChange={(value) => handleRoomUpdate(index, 'floor', parseInt(value))}
                            >
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>

                          <FormControl>
                            <FormLabel>Nombre d'ouvertures</FormLabel>
                            <NumberInput
                              value={room.windows.count}
                              min={0}
                              onChange={(value) => handleRoomUpdate(index, 'windows', {
                                ...room.windows,
                                count: parseInt(value)
                              })}
                            >
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>

                          {room.windows.count > 0 && (
                            <>
                              <FormControl>
                                <FormLabel>Type de vitrage</FormLabel>
                                <RadioGroup
                                  value={room.windows.type}
                                  onChange={(value) => handleRoomUpdate(index, 'windows', {
                                    ...room.windows,
                                    type: value
                                  })}
                                >
                                  <Stack direction="row">
                                    <Radio value="simple">Simple</Radio>
                                    <Radio value="double">Double</Radio>
                                  </Stack>
                                </RadioGroup>
                              </FormControl>

                              <FormControl>
                                <FormLabel>Année d'installation</FormLabel>
                                <NumberInput
                                  value={room.windows.installationYear}
                                  min={1950}
                                  max={new Date().getFullYear()}
                                  onChange={(value) => handleRoomUpdate(index, 'windows', {
                                    ...room.windows,
                                    installationYear: parseInt(value)
                                  })}
                                >
                                  <NumberInputField />
                                </NumberInput>
                              </FormControl>
                            </>
                          )}

                          <FormControl>
                            <FormLabel>Types de chauffage</FormLabel>
                            <Stack>
                              {HEATING_TYPES.map(type => (
                                <Checkbox
                                  key={type}
                                  isChecked={room.heating.types.includes(type)}
                                  onChange={(e) => {
                                    const types = e.target.checked
                                      ? [...room.heating.types, type]
                                      : room.heating.types.filter(t => t !== type);
                                    handleRoomUpdate(index, 'heating', {
                                      ...room.heating,
                                      types
                                    });
                                  }}
                                >
                                  {type}
                                </Checkbox>
                              ))}
                            </Stack>
                          </FormControl>

                          {room.heating.types.length > 0 && (
                            <FormControl>
                              <FormLabel>Année d'installation du chauffage</FormLabel>
                              <NumberInput
                                value={room.heating.installationYear}
                                min={1950}
                                max={new Date().getFullYear()}
                                onChange={(value) => handleRoomUpdate(index, 'heating', {
                                  ...room.heating,
                                  installationYear: parseInt(value)
                                })}
                              >
                                <NumberInputField />
                              </NumberInput>
                            </FormControl>
                          )}

                          <FormControl>
                            <FormLabel>Types de ventilation</FormLabel>
                            <Stack>
                              {VENTILATION_TYPES.map(type => (
                                <Checkbox
                                  key={type}
                                  isChecked={room.ventilation.includes(type)}
                                  onChange={(e) => {
                                    const types = e.target.checked
                                      ? [...room.ventilation, type]
                                      : room.ventilation.filter(t => t !== type);
                                    handleRoomUpdate(index, 'ventilation', types);
                                  }}
                                >
                                  {type}
                                </Checkbox>
                              ))}
                            </Stack>
                          </FormControl>

                          <FormControl>
                            <FormLabel>Taux d'humidité (%)</FormLabel>
                            <NumberInput
                              value={room.humidity}
                              min={0}
                              max={100}
                              onChange={(value) => handleRoomUpdate(index, 'humidity', parseInt(value))}
                            >
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                        </Grid>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </AccordionPanel>
            </AccordionItem>


