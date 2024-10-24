'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  Select, 
  VStack, 
  Text, 
  Heading, 
  Radio, 
  RadioGroup, 
  Stack, 
  Grid, 
  useColorModeValue,
  Icon, 
  Flex,
  NumberInput,
  NumberInputField,
  Checkbox,
  useToast,
  Card,
  CardBody,
  IconButton,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from '@chakra-ui/react';
import { FaHome, FaBuilding, FaPlus, FaTrash } from 'react-icons/fa';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useLoadScript, StandaloneSearchBox } from '@react-google-maps/api';
import { useRouter } from 'next/navigation';

interface Room {
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
}

interface FormData {
  buildingType: 'maison' | 'appartement' | '';
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
    rooms: Room[];
    facades: {
      type: string;
      thickness: number;
      lastMaintenance: Date | null;
      condition: 'Bon' | 'Moyen' | 'Mauvais';
    }[];
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
      maintenanceDate: Date | null;
      condition: 'Bon' | 'Moyen' | 'Mauvais';
    };
    roof: {
      type: string;
      ridgeType: string;
      maintenanceDate: Date | null;
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
      comment: string;
      condition: 'Favorable' | 'Correct' | 'Critique';
    };
  };
}

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

const initialFormData: FormData = {
  buildingType: '',
  details: {
    beneficiary: {
      firstName: '',
      lastName: '',
      address: '',
      phone: ''
    },
    construction: {
      year: new Date().getFullYear(),
      area: 0,
      floors: 1
    },
    rooms: [],
    facades: [],
    electrical: {
      type: 'Mono',
      installationYear: new Date().getFullYear(),
      hasLinky: false,
      upToStandards: false,
      condition: 'Bon'
    },
    insulation: {
      type: '',
      installation: '',
      thickness: 0,
      hasCondensation: false,
      condensationLocations: [],
      humidityRate: 0,
      condition: 'Bon'
    },
    framework: {
      type: '',
      hasBeam: false,
      hadMaintenance: false,
      maintenanceDate: null,
      condition: 'Bon'
    },
    roof: {
      type: '',
      ridgeType: '',
      maintenanceDate: null,
      maintenanceType: '',
      hasImpurities: false,
      installationYear: new Date().getFullYear(),
      condition: 'Bon'
    }
  },
  evaluations: {
    rooms: {},
    global: {
      score: 0,
      comment: '',
      condition: 'Correct'
    }
  }
};

export default function ExpertiseForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const toast = useToast();
  const router = useRouter();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });

  const highlightBg = useColorModeValue('blue.100', 'blue.700');
  const normalBg = useColorModeValue('gray.100', 'gray.700');

  const handleInputChange = (path: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleBuildingTypeSelect = (type: 'maison' | 'appartement') => {
    setFormData(prev => ({
      ...prev,
      buildingType: type
    }));
  };

  const handlePlacesChanged = () => {
    if (searchBoxRef.current) {
      const places = searchBoxRef.current.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        handleInputChange('details.beneficiary.address', place.formatted_address || '');
      }
    }
  };

  const addRoom = () => {
    const newRoom: Room = {
      id: Date.now().toString(),
      type: '',
      floor: 0,
      windows: {
        count: 0,
        type: 'simple',
        installationYear: new Date().getFullYear()
      },
      heating: {
        types: [],
        installationYear: new Date().getFullYear()
      },
      ventilation: [],
      humidity: 0
    };

    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        rooms: [...prev.details.rooms, newRoom]
      }
    }));
  };

  const removeRoom = (id: string) => {
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        rooms: prev.details.rooms.filter(room => room.id !== id)
      }
    }));
  };

  const calculateRoomScore = (room: Room): number => {
    let score = 0;
    // Logique de calcul du score à implémenter
    return score;
  };

  const calculateGlobalScore = (): void => {
    const roomScores = formData.details.rooms.map(calculateRoomScore);
    const averageScore = roomScores.reduce((a, b) => a + b, 0) / roomScores.length;
    
    let condition: 'Favorable' | 'Correct' | 'Critique' = 'Correct';
    if (averageScore >= 4) condition = 'Favorable';
    if (averageScore <= 2) condition = 'Critique';

    setFormData(prev => ({
      ...prev,
      evaluations: {
        ...prev.evaluations,
        global: {
          score: averageScore,
          condition,
          comment: generateGlobalComment(averageScore)
        }
      }
    }));
  };

  const generateGlobalComment = (score: number): string => {
    if (score >= 4) return "L'état général du bâtiment est très satisfaisant.";
    if (score >= 2.5) return "L'état général du bâtiment est correct mais nécessite quelques améliorations.";
    return "L'état général du bâtiment nécessite des travaux importants.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      calculateGlobalScore();

      const response = await fetch('/api/expertise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Erreur lors de la sauvegarde');

      toast({
        title: "Expertise enregistrée",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      router.push('/expertises');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'expertise",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Le rendu des étapes sera ajouté ici
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Grid templateColumns="repeat(2, 1fr)" gap={6}>
            <Box
              p={8}
              borderWidth="2px"
              borderRadius="lg"
              cursor="pointer"
              bg={formData.buildingType === 'maison' ? highlightBg : normalBg}
              onClick={() => handleBuildingTypeSelect('maison')}
              _hover={{ transform: 'scale(1.02)', borderColor: 'blue.500' }}
              transition="all 0.2s"
            >
              <VStack spacing={4}>
                <Icon as={FaHome} w={16} h={16} color={formData.buildingType === 'maison' ? 'blue.500' : 'gray.500'} />
                <Text fontSize="2xl" fontWeight="bold">Maison</Text>
              </VStack>
            </Box>
            <Box
              p={8}
              borderWidth="2px"
              borderRadius="lg"
              cursor="pointer"
              bg={formData.buildingType === 'appartement' ? highlightBg : normalBg}
              onClick={() => handleBuildingTypeSelect('appartement')}
              _hover={{ transform: 'scale(1.02)', borderColor: 'blue.500' }}
              transition="all 0.2s"
            >
              <VStack spacing={4}>
                <Icon as={FaBuilding} w={16} h={16} color={formData.buildingType === 'appartement' ? 'blue.500' : 'gray.500'} />
                <Text fontSize="2xl" fontWeight="bold">Appartement</Text>
              </VStack>
            </Box>
          </Grid>
        );
  
      case 2:
        return (
          <VStack spacing={6}>
            <Grid templateColumns="repeat(2, 1fr)" gap={6} width="100%">
              <FormControl isRequired>
                <FormLabel>Prénom</FormLabel>
                <Input
                  value={formData.details.beneficiary.firstName}
                  onChange={(e) => handleInputChange('details.beneficiary.firstName', e.target.value)}
                  placeholder="Entrez le prénom"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Nom</FormLabel>
                <Input
                  value={formData.details.beneficiary.lastName}
                  onChange={(e) => handleInputChange('details.beneficiary.lastName', e.target.value)}
                  placeholder="Entrez le nom"
                />
              </FormControl>
            </Grid>
            
            <FormControl isRequired>
              <FormLabel>Adresse</FormLabel>
              {isLoaded ? (
                <StandaloneSearchBox
                  onLoad={ref => (searchBoxRef.current = ref)}
                  onPlacesChanged={handlePlacesChanged}
                >
                  <Input
                    value={formData.details.beneficiary.address}
                    onChange={(e) => handleInputChange('details.beneficiary.address', e.target.value)}
                    placeholder="Rechercher une adresse..."
                  />
                </StandaloneSearchBox>
              ) : (
                <Input placeholder="Chargement de la recherche d'adresse..." disabled />
              )}
            </FormControl>
  
            <FormControl isRequired>
              <FormLabel>Téléphone</FormLabel>
              <PhoneInput
                country={'fr'}
                value={formData.details.beneficiary.phone}
                onChange={(phone) => handleInputChange('details.beneficiary.phone', phone)}
                inputStyle={{ width: '100%' }}
                specialLabel=""
                inputProps={{
                  required: true,
                  placeholder: "Numéro de téléphone"
                }}
              />
            </FormControl>
          </VStack>
        );
  
      case 3:
        return (
          <VStack spacing={6}>
            <Grid templateColumns="repeat(3, 1fr)" gap={6}>
              <FormControl isRequired>
                <FormLabel>Année de construction</FormLabel>
                <NumberInput
                  min={1800}
                  max={new Date().getFullYear()}
                  value={formData.details.construction.year}
                  onChange={(valueString) => handleInputChange('details.construction.year', Number(valueString))}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
  
              <FormControl isRequired>
                <FormLabel>Superficie (m²)</FormLabel>
                <NumberInput
                  min={1}
                  value={formData.details.construction.area}
                  onChange={(valueString) => handleInputChange('details.construction.area', Number(valueString))}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
  
              <FormControl isRequired>
                <FormLabel>Nombre d'étages</FormLabel>
                <NumberInput
                  min={0}
                  max={10}
                  value={formData.details.construction.floors}
                  onChange={(valueString) => handleInputChange('details.construction.floors', Number(valueString))}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            </Grid>
          </VStack>
        );
  
      case 4:
        return (
          <VStack spacing={6}>
            <Flex justifyContent="space-between" width="100%" alignItems="center">
              <Heading size="md">Configuration des pièces</Heading>
              <Button 
                leftIcon={<FaPlus />} 
                colorScheme="blue" 
                onClick={addRoom}
                size="lg"
              >
                Ajouter une pièce
              </Button>
            </Flex>
            
            {formData.details.rooms.map((room, index) => (
              <Card key={room.id} width="100%" variant="outline">
                <CardBody>
                  <VStack spacing={4}>
                    <Grid templateColumns="1fr auto" gap={4} width="100%" alignItems="start">
                      <VStack spacing={4} width="100%">
                        <Grid templateColumns="2fr 1fr" gap={4} width="100%">
                          <FormControl isRequired>
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
                              min={0}
                              max={formData.details.construction.floors}
                              value={room.floor}
                              onChange={(value) => handleRoomUpdate(index, 'floor', Number(value))}
                            >
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                        </Grid>
                      </VStack>
  
                      <IconButton
                        aria-label="Supprimer la pièce"
                        icon={<FaTrash />}
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => removeRoom(room.id)}
                      />
                    </Grid>
                  </VStack>
                </CardBody>
              </Card>
            ))}
            
            {formData.details.rooms.length === 0 && (
              <Text color="gray.500" fontSize="lg" textAlign="center" p={8}>
                Aucune pièce n'a été ajoutée. Commencez par ajouter une pièce.
              </Text>
            )}
          </VStack>
        );
  
      case 5:
        return (
          <VStack spacing={6}>
            <Heading size="md">Configuration des ouvertures par pièce</Heading>
            
            {formData.details.rooms.map((room, index) => (
              <Card key={room.id} width="100%" variant="outline">
                <CardBody>
                  <VStack spacing={4}>
                    <Flex justifyContent="space-between" width="100%" alignItems="center">
                      <Heading size="sm">
                        {room.type} {room.floor > 0 ? `(Étage ${room.floor})` : '(RDC)'}
                      </Heading>
                      <Badge colorScheme={room.windows.count > 0 ? 'green' : 'gray'}>
                        {room.windows.count} ouverture(s)
                      </Badge>
                    </Flex>
  
                    <Grid templateColumns="repeat(3, 1fr)" gap={4} width="100%">
                      <FormControl>
                        <FormLabel>Nombre d'ouvertures</FormLabel>
                        <NumberInput
                          min={0}
                          value={room.windows.count}
                          onChange={(value) => handleWindowsUpdate(index, 'count', Number(value))}
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
                              onChange={(value) => handleWindowsUpdate(index, 'type', value as 'simple' | 'double')}
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
                              min={1950}
                              max={new Date().getFullYear()}
                              value={room.windows.installationYear}
                              onChange={(value) => handleWindowsUpdate(index, 'installationYear', Number(value))}
                            >
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                        </>
                      )}
                    </Grid>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        );
        case 6:
      return (
        <VStack spacing={6}>
          <Heading size="md">Configuration du chauffage par pièce</Heading>
          
          {formData.details.rooms.map((room, index) => (
            <Card key={room.id} width="100%" variant="outline">
              <CardBody>
                <VStack spacing={4}>
                  <Flex justifyContent="space-between" width="100%" alignItems="center">
                    <Heading size="sm">
                      {room.type} {room.floor > 0 ? `(Étage ${room.floor})` : '(RDC)'}
                    </Heading>
                  </Flex>

                  <FormControl>
                    <FormLabel>Types de chauffage</FormLabel>
                    <Select
                      isMulti
                      value={room.heating.types.map(type => ({ value: type, label: type }))}
                      onChange={(selected) => {
                        const types = selected ? selected.map(option => option.value) : [];
                        handleHeatingUpdate(index, 'types', types);
                      }}
                      options={HEATING_TYPES.map(type => ({ value: type, label: type }))}
                      placeholder="Sélectionnez le(s) type(s) de chauffage"
                    />
                  </FormControl>

                  {room.heating.types.length > 0 && (
                    <FormControl>
                      <FormLabel>Année d'installation</FormLabel>
                      <NumberInput
                        min={1950}
                        max={new Date().getFullYear()}
                        value={room.heating.installationYear}
                        onChange={(value) => handleHeatingUpdate(index, 'installationYear', Number(value))}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                  )}
                </VStack>
              </CardBody>
            </Card>
          ))}
        </VStack>
      );

    case 7:
      return (
        <VStack spacing={6}>
          <Heading size="md">Taux d'humidité</Heading>
          
          {Array.from({ length: formData.details.construction.floors + 1 }).map((_, floor) => (
            <Card key={floor} width="100%" variant="outline">
              <CardBody>
                <VStack spacing={4}>
                  <Heading size="sm">
                    {floor === 0 ? 'Rez-de-chaussée' : `Étage ${floor}`}
                  </Heading>

                  {formData.details.rooms
                    .filter(room => room.floor === floor)
                    .map((room, index) => (
                      <FormControl key={room.id}>
                        <FormLabel>{room.type}</FormLabel>
                        <NumberInput
                          min={0}
                          max={100}
                          value={room.humidity}
                          onChange={(value) => handleRoomUpdate(index, 'humidity', Number(value))}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    ))}
                </VStack>
              </CardBody>
            </Card>
          ))}
        </VStack>
      );

    case 8:
      return (
        <VStack spacing={6}>
          <Heading size="md">Configuration de la façade</Heading>
          
          <FormControl isRequired>
            <FormLabel>Type de façade</FormLabel>
            <Select
              value={formData.details.facades[0]?.type || ''}
              onChange={(e) => handleFacadeUpdate('type', e.target.value)}
            >
              <option value="">Sélectionnez un type</option>
              {FACADE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Épaisseur des murs (cm)</FormLabel>
            <NumberInput
              min={1}
              value={formData.details.facades[0]?.thickness || 0}
              onChange={(value) => handleFacadeUpdate('thickness', Number(value))}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Date du dernier entretien</FormLabel>
            <Input
              type="date"
              value={formData.details.facades[0]?.lastMaintenance?.toISOString().split('T')[0] || ''}
              onChange={(e) => handleFacadeUpdate('lastMaintenance', new Date(e.target.value))}
            />
          </FormControl>
        </VStack>
      );

    case 9:
      return (
        <VStack spacing={6}>
          <Heading size="md">Tableau électrique</Heading>

          <FormControl isRequired>
            <FormLabel>Type de tableau</FormLabel>
            <RadioGroup
              value={formData.details.electrical.type}
              onChange={(value) => handleElectricalUpdate('type', value as 'Mono' | 'Triphasé')}
            >
              <Stack direction="row">
                <Radio value="Mono">Mono</Radio>
                <Radio value="Triphasé">Triphasé</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Année de pose</FormLabel>
            <NumberInput
              min={1950}
              max={new Date().getFullYear()}
              value={formData.details.electrical.installationYear}
              onChange={(value) => handleElectricalUpdate('installationYear', Number(value))}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Présence d'un compteur Linky</FormLabel>
            <RadioGroup
              value={formData.details.electrical.hasLinky.toString()}
              onChange={(value) => handleElectricalUpdate('hasLinky', value === 'true')}
            >
              <Stack direction="row">
                <Radio value="true">Oui</Radio>
                <Radio value="false">Non</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Tableau aux normes NF-2012</FormLabel>
            <RadioGroup
              value={formData.details.electrical.upToStandards.toString()}
              onChange={(value) => handleElectricalUpdate('upToStandards', value === 'true')}
            >
              <Stack direction="row">
                <Radio value="true">Oui</Radio>
                <Radio value="false">Non</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>
        </VStack>
      );

    case 10:
      return (
        <VStack spacing={6}>
          <Heading size="md">Configuration de la ventilation</Heading>
          
          {formData.details.rooms.map((room, index) => (
            <Card key={room.id} width="100%" variant="outline">
              <CardBody>
                <VStack spacing={4}>
                  <Heading size="sm">
                    {room.type} {room.floor > 0 ? `(Étage ${room.floor})` : '(RDC)'}
                  </Heading>

                  <FormControl>
                    <FormLabel>Types de ventilation</FormLabel>
                    <Select
                      isMulti
                      value={room.ventilation.map(type => ({ value: type, label: type }))}
                      onChange={(selected) => {
                        const types = selected ? selected.map(option => option.value) : [];
                        handleRoomUpdate(index, 'ventilation', types);
                      }}
                      options={VENTILATION_TYPES.map(type => ({ value: type, label: type }))}
                      placeholder="Sélectionnez le(s) type(s) de ventilation"
                    />
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </VStack>
      );
      case 11:
        return (
          <VStack spacing={6}>
            <Heading size="md">Configuration de l'isolation</Heading>
  
            <FormControl isRequired>
              <FormLabel>Type d'isolation</FormLabel>
              <Select
                value={formData.details.insulation.type}
                onChange={(e) => handleInsulationUpdate('type', e.target.value)}
              >
                <option value="">Sélectionnez un type</option>
                {INSULATION_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
            </FormControl>
  
            <FormControl isRequired>
              <FormLabel>Installation</FormLabel>
              <RadioGroup
                value={formData.details.insulation.installation}
                onChange={(value) => handleInsulationUpdate('installation', value)}
              >
                <Stack direction="column">
                  <Radio value="Sous rampants">Sous rampants</Radio>
                  <Radio value="En soufflage">En soufflage</Radio>
                  <Radio value="En rouleau">En rouleau</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
  
            <FormControl isRequired>
              <FormLabel>Épaisseur (cm)</FormLabel>
              <NumberInput
                min={1}
                value={formData.details.insulation.thickness}
                onChange={(value) => handleInsulationUpdate('thickness', Number(value))}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
  
            <FormControl isRequired>
              <FormLabel>Présence de condensation</FormLabel>
              <RadioGroup
                value={formData.details.insulation.hasCondensation.toString()}
                onChange={(value) => handleInsulationUpdate('hasCondensation', value === 'true')}
              >
                <Stack direction="row">
                  <Radio value="true">Oui</Radio>
                  <Radio value="false">Non</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
  
            {formData.details.insulation.hasCondensation && (
              <FormControl isRequired>
                <FormLabel>Localisation de la condensation</FormLabel>
                <Select
                  isMulti
                  value={formData.details.rooms
                    .filter(room => formData.details.insulation.condensationLocations.includes(room.id))
                    .map(room => ({ value: room.id, label: `${room.type} (${room.floor > 0 ? `Étage ${room.floor}` : 'RDC'})` }))}
                  onChange={(selected) => {
                    const locations = selected ? selected.map(option => option.value) : [];
                    handleInsulationUpdate('condensationLocations', locations);
                  }}
                  options={formData.details.rooms.map(room => ({
                    value: room.id,
                    label: `${room.type} (${room.floor > 0 ? `Étage ${room.floor}` : 'RDC'})`
                  }))}
                />
              </FormControl>
            )}
  
            <FormControl isRequired>
              <FormLabel>Taux d'humidité dans les combles (%)</FormLabel>
              <NumberInput
                min={0}
                max={100}
                value={formData.details.insulation.humidityRate}
                onChange={(value) => handleInsulationUpdate('humidityRate', Number(value))}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
          </VStack>
        );
  
      case 12:
        return (
          <VStack spacing={6}>
            <Heading size="md">Configuration de la charpente</Heading>
  
            <FormControl isRequired>
              <FormLabel>Type de charpente</FormLabel>
              <Select
                value={formData.details.framework.type}
                onChange={(e) => handleFrameworkUpdate('type', e.target.value)}
              >
                <option value="">Sélectionnez un type</option>
                <option value="Fermette">Fermette</option>
                <option value="Traditionnelle">Traditionnelle</option>
                <option value="Metalique">Metalique</option>
              </Select>
            </FormControl>
  
            <FormControl isRequired>
              <FormLabel>Présence de poutre</FormLabel>
              <RadioGroup
                value={formData.details.framework.hasBeam.toString()}
                onChange={(value) => handleFrameworkUpdate('hasBeam', value === 'true')}
              >
                <Stack direction="row">
                  <Radio value="true">Oui</Radio>
                  <Radio value="false">Non</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
  
            <FormControl isRequired>
              <FormLabel>Entretien effectué</FormLabel>
              <RadioGroup
                value={formData.details.framework.hadMaintenance.toString()}
                onChange={(value) => handleFrameworkUpdate('hadMaintenance', value === 'true')}
              >
                <Stack direction="row">
                  <Radio value="true">Oui</Radio>
                  <Radio value="false">Non</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
  
            {formData.details.framework.hadMaintenance && (
              <FormControl isRequired>
                <FormLabel>Date de l'entretien</FormLabel>
                <Input
                  type="date"
                  value={formData.details.framework.maintenanceDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleFrameworkUpdate('maintenanceDate', new Date(e.target.value))}
                />
              </FormControl>
            )}
          </VStack>
        );
  
      case 13:
        return (
          <VStack spacing={6}>
            <Heading size="md">Configuration de la toiture</Heading>
  
            <FormControl isRequired>
              <FormLabel>Type de toiture</FormLabel>
              <Select
                value={formData.details.roof.type}
                onChange={(e) => handleRoofUpdate('type', e.target.value)}
              >
                <option value="">Sélectionnez un type</option>
                <option value="Ardoise Naturelle">Ardoise Naturelle</option>
                <option value="Ardoise Fibrociment">Ardoise Fibrociment</option>
                <option value="Tuiles">Tuiles</option>
                <option value="Tuiles Béton">Tuiles Béton</option>
                <option value="Acier">Acier</option>
              </Select>
            </FormControl>
  
            <FormControl isRequired>
              <FormLabel>Type de faîtage</FormLabel>
              <RadioGroup
                value={formData.details.roof.ridgeType}
                onChange={(value) => handleRoofUpdate('ridgeType', value)}
              >
                <Stack direction="row">
                  <Radio value="Cimente">Cimenté</Radio>
                  <Radio value="En Boîte">En Boîte</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
  
            <FormControl isRequired>
              <FormLabel>Date d'entretien</FormLabel>
              <Input
                type="date"
                value={formData.details.roof.maintenanceDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => handleRoofUpdate('maintenanceDate', new Date(e.target.value))}
              />
            </FormControl>
  
            <FormControl isRequired>
              <FormLabel>Type d'entretien effectué</FormLabel>
              <Input
                value={formData.details.roof.maintenanceType}
                onChange={(e) => handleRoofUpdate('maintenanceType', e.target.value)}
              />
            </FormControl>
  
            <FormControl isRequired>
              <FormLabel>Présence d'impuretés</FormLabel>
              <RadioGroup
                value={formData.details.roof.hasImpurities.toString()}
                onChange={(value) => handleRoofUpdate('hasImpurities', value === 'true')}
              >
                <Stack direction="row">
                  <Radio value="true">Oui</Radio>
                  <Radio value="false">Non</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
          </VStack>
        );
  
      case 14:
        return (
          <VStack spacing={6}>
            <Heading size="md">Évaluation globale</Heading>
  
            {formData.details.rooms.map((room, index) => (
              <Card key={room.id} width="100%" variant="outline">
                <CardBody>
                  <VStack spacing={4}>
                    <Heading size="sm">
                      {room.type} {room.floor > 0 ? `(Étage ${room.floor})` : '(RDC)'}
                    </Heading>
  
                    {room.windows.count > 0 && (
                      <FormControl>
                        <FormLabel>État des ouvrants</FormLabel>
                        <RadioGroup
                          value={formData.evaluations.rooms[room.id]?.windows.toString() || '3'}
                          onChange={(value) => handleRoomEvaluation(room.id, 'windows', Number(value))}
                        >
                          <Stack direction="row">
                            <Radio value="1">Mauvais</Radio>
                            <Radio value="3">Moyen</Radio>
                            <Radio value="5">Bon</Radio>
                          </Stack>
                        </RadioGroup>
                      </FormControl>
                    )}
  
                    {room.heating.types.length > 0 && (
                      <FormControl>
                        <FormLabel>État du chauffage</FormLabel>
                        <RadioGroup
                          value={formData.evaluations.rooms[room.id]?.heating.toString() || '3'}
                          onChange={(value) => handleRoomEvaluation(room.id, 'heating', Number(value))}
                        >
                          <Stack direction="row">
                            <Radio value="1">Mauvais</Radio>
                            <Radio value="3">Moyen</Radio>
                            <Radio value="5">Bon</Radio>
                          </Stack>
                        </RadioGroup>
                      </FormControl>
                    )}
  
                    <FormControl>
                      <FormLabel>État de l'humidité</FormLabel>
                      <RadioGroup
                        value={formData.evaluations.rooms[room.id]?.humidity.toString() || '3'}
                        onChange={(value) => handleRoomEvaluation(room.id, 'humidity', Number(value))}
                      >
                        <Stack direction="row">
                          <Radio value="1">Mauvais</Radio>
                          <Radio value="3">Moyen</Radio>
                          <Radio value="5">Bon</Radio>
                        </Stack>
                      </RadioGroup>
                    </FormControl>
  
                    {room.ventilation.length > 0 && (
                      <FormControl>
                        <FormLabel>État de la ventilation</FormLabel>
                        <RadioGroup
                          value={formData.evaluations.rooms[room.id]?.ventilation.toString() || '3'}
                          onChange={(value) => handleRoomEvaluation(room.id, 'ventilation', Number(value))}
                        >
                          <Stack direction="row">
                            <Radio value="1">Mauvais</Radio>
                            <Radio value="3">Moyen</Radio>
                            <Radio value="5">Bon</Radio>
                          </Stack>
                        </RadioGroup>
                      </FormControl>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            ))}
  
            <Card width="100%">
              <CardBody>
                <VStack spacing={4}>
                  <Heading size="sm">Diagnostic global</Heading>
                  <Text fontSize="lg" fontWeight="bold">
                    Note globale: {calculateGlobalScore()}/5
                  </Text>
                  <Badge 
                    colorScheme={
                      formData.evaluations.global.score >= 4 ? 'green' : 
                      formData.evaluations.global.score >= 2.5 ? 'yellow' : 'red'
                    }
                    fontSize="md"
                    p={2}
                  >
                    {formData.evaluations.global.condition}
                  </Badge>
                  <Text>{formData.evaluations.global.comment}</Text>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        );
  
      default:
        return <Text>Étape non trouvée</Text>;
    }
  };

  return (
    <Box maxWidth="800px" margin="auto" mt={8}>
      <form onSubmit={handleSubmit}>
        <VStack spacing={6} align="stretch">
          <Heading size="lg">Expertise Habitat - Étape {currentStep}/14</Heading>
          {renderStep()}
          <Flex justify="space-between" mt={4}>
            {currentStep > 1 && (
              <Button 
                onClick={() => setCurrentStep(prev => prev - 1)}
                isDisabled={loading}
              >
                Précédent
              </Button>
            )}
            {currentStep < 14 ? (
              <Button 
                onClick={() => setCurrentStep(prev => prev + 1)}
                isDisabled={loading}
              >
                Suivant
              </Button>
            ) : (
              <Button 
                type="submit" 
                colorScheme="blue"
                isLoading={loading}
              >
                Soumettre
              </Button>
            )}
          </Flex>
        </VStack>
      </form>
    </Box>
  );
}