'use client';

import React, { useState, useEffect } from 'react';
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
  NumberInput,
  NumberInputField,
  Grid,
  Card,
  CardBody,
  CardHeader,
  IconButton,
  Checkbox,
  useToast,
  useBreakpointValue,
  Flex,
  Icon,
  Badge,
  useColorModeValue,
  Progress,
  HStack,
  Divider,
  List,
  ListItem
} from '@chakra-ui/react';
import { FaPlus, FaTrash, FaHome, FaBuilding } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useAuth, User } from '../lib/auth';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import type { 
  Expertise, 
  ConditionType, 
  RoomEvaluation, 
  GlobalEvaluation,
  ExpertiseFormProps
} from '../types';

// Constantes pour les types d'énumération
const ROOM_TYPES = [
  'Entree',
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

const ETATS = ['Bon', 'Moyen', 'Mauvais'] as const;

const HEATING_TYPES = [
  'Électrique',
  'Gaz',
  'Fioul',
  'Bois',
  'Poêle',
  'Pac'
];

const VENTILATION_TYPES = ['VMC Simple flux', 'Double Flux', 'VMI', 'VPH'] as const;

const FACADE_TYPES = ['Enduit', 'Peinture', 'Pierre'] as const;

const TYPE_ISOLATION = [
  'Ouate de cellulose',
  'Laine de Roche',
  'Laine de Verre',
  'Isolation Minerales'
] as const;

const TYPE_CHARPENTE = ['Fermette', 'Traditionnelle', 'Metalique'] as const;

const TYPE_TOITURE = [
  'Ardoise Naturelle',
  'Ardoise Fibrociment',
  'Tuiles',
  'Tuiles Béton',
  'Acier'
] as const;

const TYPE_FAITAGE = ['Cimente', 'En Boîte'] as const;

// Helper functions
const normalizeHeatingType = (type: string): string => {
  const typeMap: { [key: string]: string } = {
    'Électrique': 'Électrique',
    'Gaz': 'Gaz',
    'Fioul': 'Fioul',
    'Bois': 'Bois',
    'Poêle': 'Poêle',
    'Pompe à chaleur': 'Pac'
  };
  return typeMap[type] || 'Électrique';
};

interface Room {
  id: string;
  type: string;
  name: string;
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
  typeLogement: 'maison' | 'appartement' | '';
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
    facades: Array<{
      type: string;
      thickness: number;
      lastMaintenance: string;
      condition: typeof ETATS[number];
    }>;
    electrical: {
      type: 'Mono' | 'Triphasé';
      installationYear: number;
      hasLinky: boolean;
      upToStandards: boolean;
      condition: typeof ETATS[number];
    };
    isolation: {
      type: string;
      installation: string;
      thickness: number;
      hasCondensation: boolean;
      condensationLocations: string[];
      humidityRate: number;
      condition: typeof ETATS[number];
    };
    framework: {
      type: string;
      hasBeam: boolean;
      hadMaintenance: boolean;
      maintenanceDate: string | null;
      condition: typeof ETATS[number];
    };
    roof: {
      type: string;
      ridgeType: string;
      maintenanceDate: string;
      maintenanceType: string;
      hasImpurities: boolean;
      installationYear: number;
      condition: typeof ETATS[number];
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

const transformInitialData = (data: Expertise): FormData => {
  // Transformer les évaluations en s'assurant que tous les champs requis sont présents
  const transformedEvaluations = {
    rooms: Object.entries(data.evaluations?.rooms || {}).reduce((acc, [roomId, evaluation]) => ({
      ...acc,
      [roomId]: {
        windows: evaluation?.windows || 3,
        heating: evaluation?.heating || 3,
        humidity: evaluation?.humidity || 3,
        ventilation: evaluation?.ventilation || 3
      }
    }), {}),
    global: {
      score: data.evaluations?.global?.score || 0,
      condition: data.evaluations?.global?.condition || 'Correct',
      comment: data.evaluations?.global?.comment || ''
    }
  };

  return {
    typeLogement: data.typeLogement as 'maison' | 'appartement',
    details: {
      beneficiary: {
        firstName: data.beneficiaire.nom.split(' ')[0] || '',
        lastName: data.beneficiaire.nom.split(' ')[1] || '',
        address: data.beneficiaire.adresse,
        phone: data.beneficiaire.telephone
      },
      construction: {
        year: data.details.anneeConstruction,
        area: data.details.superficie,
        floors: data.details.nombreEtages
      },
      rooms: [], // Vous devrez adapter cette partie selon vos besoins
      facades: [{
        type: data.facade.type,
        thickness: data.facade.epaisseurMurs,
        lastMaintenance: data.facade.dernierEntretien.toString(),
        condition: data.facade.etat as typeof ETATS[number]
      }],
      electrical: {
        type: data.tableauElectrique.type,
        installationYear: data.tableauElectrique.anneePose,
        hasLinky: data.tableauElectrique.presenceLinky,
        upToStandards: data.tableauElectrique.auxNormes,
        condition: data.tableauElectrique.etat as typeof ETATS[number]
      },
      isolation: {
        type: data.isolation.type,
        installation: data.isolation.pose,
        thickness: data.isolation.epaisseur,
        hasCondensation: data.isolation.presenceCondensation,
        condensationLocations: [],
        humidityRate: data.isolation.tauxHumiditeCombles,
        condition: data.isolation.etat as typeof ETATS[number]
      },
      framework: {
        type: data.charpente.type,
        hasBeam: data.charpente.presenceArtive,
        hadMaintenance: data.charpente.entretienEffectue,
        maintenanceDate: data.charpente.dateEntretien?.toString() || null,
        condition: data.charpente.etat as typeof ETATS[number]
      },
      roof: {
        type: data.toiture.type,
        ridgeType: data.toiture.typeFaitage,
        maintenanceDate: data.toiture.dateEntretien.toString(),
        maintenanceType: data.toiture.typeEntretien,
        hasImpurities: data.toiture.presenceImpuretes,
        installationYear: data.toiture.annee,
        condition: data.toiture.etat as typeof ETATS[number]
      }
    },
    evaluations: transformedEvaluations
  };
};

const initialFormData: FormData = {
  typeLogement: '',
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
    facades: [{
      type: '',
      thickness: 0,
      lastMaintenance: new Date().toISOString().split('T')[0],
      condition: 'Moyen'
    }],
    electrical: {
      type: 'Mono',
      installationYear: new Date().getFullYear(),
      hasLinky: false,
      upToStandards: false,
      condition: 'Moyen'
    },
    isolation: {
      type: '',
      installation: '',
      thickness: 0,
      hasCondensation: false,
      condensationLocations: [],
      humidityRate: 0,
      condition: 'Moyen'
    },
    framework: {
      type: '',
      hasBeam: false,
      hadMaintenance: false,
      maintenanceDate: null,
      condition: 'Moyen'
    },
    roof: {
      type: '',
      ridgeType: '',
      maintenanceDate: new Date().toISOString().split('T')[0],
      maintenanceType: '',
      hasImpurities: false,
      installationYear: new Date().getFullYear(),
      condition: 'Moyen'
    }
  },
  evaluations: {
    rooms: {},
    global: {
      score: 0,
      condition: 'Correct',
      comment: ''
    }
  }
};

const ExpertiseForm: React.FC<ExpertiseFormProps> = ({ isEditing = false, initialData, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [evaluationScore, setEvaluationScore] = useState(0);
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{label: string; context: string}>>([]);
  const [agents, setAgents] = useState<User[]>([]);

  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const highlightBg = useColorModeValue('blue.100', 'blue.700');
  const normalBg = useColorModeValue('gray.100', 'gray.700');

  // Effet pour initialiser les données en mode édition
  useEffect(() => {
    if (isEditing && initialData) {
      const transformedData = transformInitialData(initialData);
      setFormData(transformedData);
    }
  }, [isEditing, initialData]);

// Effects
useEffect(() => {
  if (currentStep === 14) {
    calculateNewScore();
  }
}, [currentStep, formData.details.rooms, formData.evaluations.rooms]);

// Handlers
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

const handleTypeLogementSelect = (type: 'maison' | 'appartement') => {
  handleInputChange('typeLogement', type);
};

const fetchAddressSuggestions = async (input: string) => {
  if (input.length > 2) {
    try {
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(input)}&limit=5`
      );
      const data = await response.json();
      setAddressSuggestions(
        data.features.map((feature: any) => ({
          label: feature.properties.label,
          context: feature.properties.context,
        }))
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des suggestions d\'adresse:', error);
      setAddressSuggestions([]);
    }
  } else {
    setAddressSuggestions([]);
  }
};

const handleRoomUpdate = (index: number, field: string, value: any) => {
  setFormData(prev => {
    const newRooms = [...prev.details.rooms];
    if (field.includes('.')) {
      const [mainField, subField] = field.split('.') as [keyof Room, string];
      newRooms[index] = {
        ...newRooms[index],
        [mainField]: {
          ...(newRooms[index][mainField] as any),
          [subField]: value
        }
      };
    } else {
      newRooms[index] = {
        ...newRooms[index],
        [field]: value
      };
    }
    return {
      ...prev,
      details: {
        ...prev.details,
        rooms: newRooms
      }
    };
  });
};

const addRoom = () => {
  setFormData(prev => ({
    ...prev,
    details: {
      ...prev.details,
      rooms: [
        ...prev.details.rooms,
        {
          id: Date.now().toString(),
          type: '',
          name: '',
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
        }
      ]
    }
  }));
};

const removeRoom = (index: number) => {
  setFormData(prev => ({
    ...prev,
    details: {
      ...prev.details,
      rooms: prev.details.rooms.filter((_, i) => i !== index)
    }
  }));
};

const handleWindowsUpdate = (index: number, field: string, value: any) => {
  setFormData(prev => {
    const newRooms = [...prev.details.rooms];
    newRooms[index] = {
      ...newRooms[index],
      windows: {
        ...newRooms[index].windows,
        [field]: value
      }
    };
    return {
      ...prev,
      details: {
        ...prev.details,
        rooms: newRooms
      }
    };
  });
};

const handleHeatingUpdate = (index: number, field: string, value: any) => {
  setFormData(prev => {
    const newRooms = [...prev.details.rooms];
    newRooms[index] = {
      ...newRooms[index],
      heating: {
        ...newRooms[index].heating,
        [field]: value
      }
    };
    return {
      ...prev,
      details: {
        ...prev.details,
        rooms: newRooms
      }
    };
  });
};

const handleVentilationUpdate = (index: number, ventilation: string[]) => {
  setFormData(prev => {
    const newRooms = [...prev.details.rooms];
    newRooms[index] = {
      ...newRooms[index],
      ventilation
    };
    return {
      ...prev,
      details: {
        ...prev.details,
        rooms: newRooms
      }
    };
  });
};

const handleRoomEvaluation = (roomId: string, field: string, value: number) => {
  setFormData(prev => ({
    ...prev,
    evaluations: {
      ...prev.evaluations,
      rooms: {
        ...prev.evaluations.rooms,
        [roomId]: {
          ...prev.evaluations.rooms[roomId],
          [field]: value
        }
      }
    }
  }));
};

const calculateNewScore = () => {
  const roomScores = formData.details.rooms.map(room => {
    const scores = [];
    if (room.windows.count > 0) {
      scores.push(formData.evaluations.rooms[room.id]?.windows || 3);
    }
    if (room.heating.types.length > 0) {
      scores.push(formData.evaluations.rooms[room.id]?.heating || 3);
    }
    scores.push(formData.evaluations.rooms[room.id]?.humidity || 3);
    if (room.ventilation.length > 0) {
      scores.push(formData.evaluations.rooms[room.id]?.ventilation || 3);
    }
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  });
  
  const newScore = roomScores.reduce((a, b) => a + b, 0) / roomScores.length || 3;
  setEvaluationScore(newScore);

  const condition = newScore >= 4 ? 'Favorable' : 
                   newScore >= 2.5 ? 'Correct' : 'Critique';
  const comment = generateGlobalComment(newScore);
  
  handleInputChange('evaluations.global', {
    score: newScore,
    condition,
    comment
  });
};

const generateGlobalComment = (score: number): string => {
  if (score >= 4) {
    return "L'état général du bâtiment est très satisfaisant. Les installations sont bien entretenues et performantes.";
  } else if (score >= 2.5) {
    return "L'état général du bâtiment est correct mais nécessite quelques améliorations ciblées pour optimiser son confort et ses performances.";
  } else {
    return "L'état général du bâtiment nécessite des travaux de rénovation importants. Une intervention est recommandée pour améliorer le confort et l'efficacité énergétique.";
  }
};

const validateExpertiseData = (formData: FormData) => {
  const errors: string[] = [];

  // Validation des champs obligatoires de base
  if (!formData.typeLogement) errors.push('Le type de logement est requis');
  
  // Validation du bénéficiaire
  if (!formData.details.beneficiary.firstName) errors.push('Le prénom du bénéficiaire est requis');
  if (!formData.details.beneficiary.lastName) errors.push('Le nom du bénéficiaire est requis');
  if (!formData.details.beneficiary.address) errors.push('L\'adresse du bénéficiaire est requise');
  if (!formData.details.beneficiary.phone) errors.push('Le téléphone du bénéficiaire est requis');

  // Validation de la construction
  if (!formData.details.construction.year) errors.push('L\'année de construction est requise');
  if (!formData.details.construction.area) errors.push('La superficie est requise');
  if (formData.details.construction.floors < 0) errors.push('Le nombre d\'étages doit être positif');

  // Validation des pièces
  if (!formData.details.rooms.length) errors.push('Au moins une pièce est requise');
  formData.details.rooms.forEach((room, index) => {
    if (!room.type) errors.push(`Le type de la pièce ${index + 1} est requis`);
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    calculateNewScore();
    
    const validation = validateExpertiseData(formData);
    if (!validation.isValid) {
      throw new Error(`Validation échouée: ${validation.errors.join(', ')}`);
    }

    // Préparation des données pour l'envoi
    const dataToSend = {
      typeLogement: formData.typeLogement,
      beneficiaire: {
        nom: `${formData.details.beneficiary.firstName.trim()} ${formData.details.beneficiary.lastName.trim()}`.trim(),
        adresse: formData.details.beneficiary.address.trim(),
        telephone: formData.details.beneficiary.phone.trim()
      },
      details: {
        anneeConstruction: Number(formData.details.construction.year),
        superficie: Number(formData.details.construction.area),
        nombreEtages: Number(formData.details.construction.floors)
      },
      ouvertures: {
        nombre: formData.details.rooms.reduce((acc, room) => acc + (Number(room.windows.count) || 0), 0),
        typeVitrage: formData.details.rooms[0]?.windows.type || 'simple',
        etat: "Bon",
        anneeInstallation: Number(formData.details.rooms[0]?.windows.installationYear) || new Date().getFullYear()
      },
      chauffage: {
        type: normalizeHeatingType(formData.details.rooms[0]?.heating.types[0] || 'Électrique'),
        nombre: 1,
        etat: formData.details.electrical.condition || 'Bon',
        anneeInstallation: Number(formData.details.rooms[0]?.heating.installationYear) || new Date().getFullYear()
      },
      humidite: {
        taux: Number(formData.details.rooms.reduce((acc, room) => acc + (room.humidity || 0), 0) / 
              Math.max(formData.details.rooms.length, 1)) || 0,
        etat: formData.details.electrical.condition || 'Bon'
      },
      facade: {
        type: formData.details.facades[0]?.type || '',
        epaisseurMurs: Number(formData.details.facades[0]?.thickness) || 0,
        dernierEntretien: Number(new Date(formData.details.facades[0]?.lastMaintenance || new Date()).getFullYear()),
        etat: formData.details.facades[0]?.condition || 'Moyen'
      },
      tableauElectrique: {
        type: formData.details.electrical.type || 'Mono',
        anneePose: Number(formData.details.electrical.installationYear) || new Date().getFullYear(),
        presenceLinky: Boolean(formData.details.electrical.hasLinky),
        auxNormes: Boolean(formData.details.electrical.upToStandards),
        etat: formData.details.electrical.condition || 'Moyen'
      },
      ventilation: {
        type: formData.details.rooms[0]?.ventilation[0] || 'VMC Simple flux',
        nombreBouches: 1,
        piecesEquipees: formData.details.rooms[0]?.type || '',
        ventilationNaturelle: false,
        anneePose: new Date().getFullYear(),
        etat: formData.details.electrical.condition || 'Bon'
      },
      isolation: {
        type: formData.details.isolation.type || '',
        pose: formData.details.isolation.installation || '',
        epaisseur: Number(formData.details.isolation.thickness) || 0,
        etat: formData.details.isolation.condition || 'Moyen',
        presenceCondensation: Boolean(formData.details.isolation.hasCondensation),
        tauxHumiditeCombles: Number(formData.details.isolation.humidityRate) || 0,
        etatCombles: 'Moyen'
      },
      charpente: {
        type: formData.details.framework.type || '',
        presenceArtive: Boolean(formData.details.framework.hasBeam),
        entretienEffectue: Boolean(formData.details.framework.hadMaintenance),
        dateEntretien: formData.details.framework.maintenanceDate ? 
          new Date(formData.details.framework.maintenanceDate) :
          new Date(),
        etat: formData.details.framework.condition || 'Moyen'
      },
      toiture: {
        type: formData.details.roof.type || '',
        typeFaitage: formData.details.roof.ridgeType || '',
        dateEntretien: new Date(formData.details.roof.maintenanceDate || new Date()),
        typeEntretien: formData.details.roof.maintenanceType || '',
        presenceImpuretes: Boolean(formData.details.roof.hasImpurities),
        annee: Number(formData.details.roof.installationYear) || new Date().getFullYear(),
        etat: formData.details.roof.condition || 'Moyen'
      },
      evaluations: formData.evaluations
    };

    // Choix de l'URL et de la méthode en fonction du mode édition
    const url = isEditing ? `/api/expertises/${initialData?._id}` : '/api/expertises';
    const method = isEditing ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(dataToSend)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la sauvegarde');
    }

    toast({
      title: "Succès",
      description:  (
        <Box>
          {`L'expertise a été ${isEditing ? 'modifiée' : 'créée'} avec succès`}
          <Button 
            ml={4} 
            size="sm" 
            onClick={() => router.push('/expertises')}
          >
            Retour à la liste
          </Button>
        </Box>
      ),
      status: "success",
      duration: null,
      isClosable: true,
    });

    // Laisser l'utilisateur voir le message de succès avant de rediriger
    setTimeout(() => {
      router.push('/expertises');
    }, 120000);
    
  } catch (error) {
    console.error('Erreur détaillée:', error);
    toast({
      title: "Erreur",
      description: error instanceof Error ? error.message : "Impossible d'enregistrer l'expertise",
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  } finally {
    setLoading(false);
  }
};

  const renderStep = () => {
    switch (currentStep) {
  case 1:
        return (
          <VStack spacing={6}>
            <Heading size="md">Type de bâtiment</Heading>
            <Grid templateColumns={isMobile ? "1fr" : "repeat(2, 1fr)"} gap={6}>
              <Box
                p={8}
                borderWidth="2px"
                borderRadius="lg"
                cursor="pointer"
                bg={formData.typeLogement === "maison" ? highlightBg : normalBg}
                onClick={() => handleTypeLogementSelect("maison")}
                _hover={{ transform: "scale(1.02)", borderColor: "blue.500" }}
                transition="all 0.2s"
              >
                <VStack spacing={4}>
                  <Icon
                    as={FaHome}
                    w={16}
                    h={16}
                    color={formData.typeLogement === "maison" ? "blue.500" : "gray.500"}
                  />
                  <Text fontSize="2xl" fontWeight="bold">
                    Maison
                  </Text>
                </VStack>
              </Box>

              <Box
                p={8}
                borderWidth="2px"
                borderRadius="lg"
                cursor="pointer"
                bg={formData.typeLogement === "appartement" ? highlightBg : normalBg}
                onClick={() => handleTypeLogementSelect("appartement")}
                _hover={{ transform: "scale(1.02)", borderColor: "blue.500" }}
                transition="all 0.2s"
              >
                <VStack spacing={4}>
                  <Icon
                    as={FaBuilding}
                    w={16}
                    h={16}
                    color={formData.typeLogement === "appartement" ? "blue.500" : "gray.500"}
                  />
                  <Text fontSize="2xl" fontWeight="bold">
                    Appartement
                  </Text>
                </VStack>
              </Box>
            </Grid>
          </VStack>
        );
        
      case 2:
        return (
          <VStack spacing={6}>
            <Grid
              templateColumns={isMobile ? "1fr" : "repeat(2, 1fr)"}
              gap={6}
              width="100%"
            >
              <FormControl isRequired>
                <FormLabel>Prénom</FormLabel>
                <Input
                  value={formData.details.beneficiary.firstName}
                  onChange={(e) =>
                    handleInputChange(
                      "details.beneficiary.firstName",
                      e.target.value
                    )
                  }
                  placeholder="Prénom du bénéficiaire"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Nom</FormLabel>
                <Input
                  value={formData.details.beneficiary.lastName}
                  onChange={(e) =>
                    handleInputChange(
                      "details.beneficiary.lastName",
                      e.target.value
                    )
                  }
                  placeholder="Nom du bénéficiaire"
                />
              </FormControl>
            </Grid>

            <FormControl isRequired>
              <FormLabel>Adresse</FormLabel>
              <Box position="relative">
                <Input
                  value={formData.details.beneficiary.address}
                  onChange={(e) => {
                    handleInputChange(
                      "details.beneficiary.address",
                      e.target.value
                    );
                    if (e.target.value.length > 2) {
                      fetchAddressSuggestions(e.target.value);
                    } else {
                      setAddressSuggestions([]);
                    }
                  }}
                  placeholder="Entrez une adresse"
                />
                {addressSuggestions.length > 0 && (
                  <List
                    position="absolute"
                    w="100%"
                    mt={2}
                    borderWidth={1}
                    borderRadius="md"
                    boxShadow="lg"
                    bg="white"
                    zIndex={1000}
                    maxH="200px"
                    overflowY="auto"
                  >
                    {addressSuggestions.map((suggestion, index) => (
                      <ListItem
                        key={index}
                        p={2}
                        _hover={{ bg: "gray.100" }}
                        cursor="pointer"
                        onClick={() => {
                          handleInputChange(
                            "details.beneficiary.address",
                            suggestion.label
                          );
                          setAddressSuggestions([]);
                        }}
                      >
                        {suggestion.label}
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Téléphone</FormLabel>
              <Box position="relative">
                <PhoneInput
                  country={"fr"}
                  value={formData.details.beneficiary.phone}
                  onChange={(phone) =>
                    handleInputChange("details.beneficiary.phone", phone)
                  }
                  inputStyle={{ width: "100%", height: "40px" }}
                  buttonStyle={{ borderRadius: "0.375rem 0 0 0.375rem" }}
                  dropdownStyle={{ width: "300px" }}
                  enableSearch={true}
                  searchPlaceholder="Rechercher un pays..."
                  searchNotFound="Pays non trouvé"
                  preferredCountries={["fr", "be", "ch", "lu", "es", "uk"]}
                  localization={{
                    fr: "France",
                    be: "Belgique",
                    ch: "Suisse",
                    lu: "Luxembourg",
                    es: "Espagne",
                    uk: "Royaume-Uni",
                  }}
                />
              </Box>
            </FormControl>
          </VStack>
        );

      case 3:
        return (
          <VStack spacing={6}>
            <Grid templateColumns={isMobile ? "1fr" : "repeat(3, 1fr)"} gap={6}>
              <FormControl isRequired>
                <FormLabel>Année de construction</FormLabel>
                <NumberInput
                  min={1800}
                  max={new Date().getFullYear()}
                  value={formData.details.construction.year}
                  onChange={(valueString) =>
                    handleInputChange(
                      "details.construction.year",
                      parseInt(valueString)
                    )
                  }
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Superficie (m²)</FormLabel>
                <NumberInput
                  min={1}
                  value={formData.details.construction.area}
                  onChange={(valueString) =>
                    handleInputChange(
                      "details.construction.area",
                      parseInt(valueString)
                    )
                  }
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
                  onChange={(valueString) =>
                    handleInputChange(
                      "details.construction.floors",
                      parseInt(valueString)
                    )
                  }
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
            <Flex justify="space-between" align="center" width="100%">
              <Heading size="md">Configuration des pièces</Heading>
              <Button
                leftIcon={<FaPlus />}
                colorScheme="blue"
                onClick={addRoom}
              >
                Ajouter une pièce
              </Button>
            </Flex>

            {formData.details.rooms.map((room, index) => (
              <Card key={room.id} width="100%" variant="outline">
                <CardBody>
                  <VStack spacing={4}>
                    <Grid
                      templateColumns={isMobile ? "1fr" : "repeat(3, 1fr) auto"}
                      gap={4}
                      width="100%"
                      alignItems="end"
                    >
                      <FormControl isRequired>
                        <FormLabel>Type de pièce</FormLabel>
                        <Select
                          value={room.type}
                          onChange={(e) =>
                            handleRoomUpdate(index, "type", e.target.value)
                          }
                        >
                          <option value="">Sélectionnez un type</option>
                          {ROOM_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </Select>
                      </FormControl>

                      {room.type && (
                        <FormControl isRequired>
                          <FormLabel>Nom de la pièce</FormLabel>
                          <Input
                            placeholder={`${room.type} ${index + 1}`}
                            value={room.name}
                            onChange={(e) =>
                              handleRoomUpdate(index, "name", e.target.value)
                            }
                          />
                        </FormControl>
                      )}

                      <FormControl>
                        <FormLabel>Étage</FormLabel>
                        <NumberInput
                          min={0}
                          max={formData.details.construction.floors}
                          value={room.floor}
                          onChange={(value) =>
                            handleRoomUpdate(index, "floor", parseInt(value))
                          }
                        >
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>

                      <IconButton
                        aria-label="Supprimer la pièce"
                        icon={<FaTrash />}
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => removeRoom(index)}
                      />
                    </Grid>
                  </VStack>
                </CardBody>
              </Card>
            ))}

            {formData.details.rooms.length === 0 && (
              <Text color="gray.500" fontSize="lg" textAlign="center" py={8}>
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
                <CardHeader>
                  <Heading size="sm">
                    {room.name || `${room.type} ${index + 1}`}{" "}
                    {room.floor > 0 ? `(Étage ${room.floor})` : "(RDC)"}
                  </Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel>Nombre d'ouvertures</FormLabel>
                      <NumberInput
                        min={0}
                        value={room.windows.count}
                        onChange={(value) =>
                          handleWindowsUpdate(index, "count", parseInt(value))
                        }
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
                            onChange={(value) =>
                              handleWindowsUpdate(index, "type", value)
                            }
                          >
                            <Stack direction="row">
                              <Radio value="simple">Simple vitrage</Radio>
                              <Radio value="double">Double vitrage</Radio>
                            </Stack>
                          </RadioGroup>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Année d'installation</FormLabel>
                          <NumberInput
                            min={1950}
                            max={new Date().getFullYear()}
                            value={room.windows.installationYear}
                            onChange={(value) =>
                              handleWindowsUpdate(
                                index,
                                "installationYear",
                                parseInt(value)
                              )
                            }
                          >
                            <NumberInputField />
                          </NumberInput>
                        </FormControl>
                      </>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        );

      case 6:
        return (
          <VStack spacing={6}>
            <Heading size="md">Configuration du chauffage</Heading>
            {formData.details.rooms.map((room, index) => (
              <Card key={room.id} width="100%" variant="outline">
                <CardHeader>
                  <Heading size="sm">
                    {room.name || `${room.type} ${index + 1}`}{" "}
                    {room.floor > 0 ? `(Étage ${room.floor})` : "(RDC)"}
                  </Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel>Types de chauffage</FormLabel>
                      <Stack>
                        {HEATING_TYPES.map((type) => (
                          <Checkbox
                            key={type}
                            isChecked={room.heating.types.includes(type)}
                            onChange={(e) => {
                              const types = e.target.checked
                                ? [...room.heating.types, type]
                                : room.heating.types.filter((t) => t !== type);
                              handleHeatingUpdate(index, "types", types);
                            }}
                          >
                            {type}
                          </Checkbox>
                        ))}
                      </Stack>
                    </FormControl>

                    {room.heating.types.length > 0 && (
                      <FormControl>
                        <FormLabel>Année d'installation</FormLabel>
                        <NumberInput
                          min={1950}
                          max={new Date().getFullYear()}
                          value={room.heating.installationYear}
                          onChange={(value) =>
                            handleHeatingUpdate(
                              index,
                              "installationYear",
                              parseInt(value)
                            )
                          }
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
            {Array.from({
              length: formData.details.construction.floors + 1,
            }).map((_, floor) => (
              <Card key={floor} width="100%" variant="outline">
                <CardHeader>
                  <Heading size="sm">
                    {floor === 0 ? "Rez-de-chaussée" : `Étage ${floor}`}
                  </Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    {formData.details.rooms
                      .filter((room) => room.floor === floor)
                      .map((room, roomIndex) => (
                        <FormControl key={room.id}>
                          <FormLabel>
                            {room.name || `${room.type} ${roomIndex + 1}`} -
                            Taux d'humidité (%)
                          </FormLabel>
                          <NumberInput
                            min={0}
                            max={100}
                            value={room.humidity}
                            onChange={(value) =>
                              handleRoomUpdate(
                                formData.details.rooms.indexOf(room),
                                "humidity",
                                parseInt(value)
                              )
                            }
                          >
                            <NumberInputField />
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
            <Heading size="md">Façades</Heading>
            <Card width="100%">
              <CardBody>
                <Grid
                  templateColumns={isMobile ? "1fr" : "repeat(2, 1fr)"}
                  gap={6}
                >
                  <FormControl isRequired>
                    <FormLabel>Type de façade</FormLabel>
                    <Select
                      value={formData.details.facades[0]?.type || ""}
                      onChange={(e) => {
                        console.log(
                          "Sélection du type de façade:",
                          e.target.value
                        ); // Ajout du log
                        handleInputChange(
                          "details.facades.0.type",
                          e.target.value
                        );
                      }}
                    >
                      <option value="">Sélectionnez un type</option>
                      {FACADE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Épaisseur des murs (cm)</FormLabel>
                    <NumberInput
                      min={1}
                      value={formData.details.facades[0]?.thickness || 0}
                      onChange={(value) =>
                        handleInputChange(
                          "details.facades.0.thickness",
                          parseInt(value)
                        )
                      }
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Date du dernier entretien</FormLabel>
                    <Input
                      type="date"
                      value={formData.details.facades[0]?.lastMaintenance}
                      onChange={(e) =>
                        handleInputChange(
                          "details.facades.0.lastMaintenance",
                          e.target.value
                        )
                      }
                    />
                  </FormControl>
                </Grid>
              </CardBody>
            </Card>
          </VStack>
        );

      case 9:
        return (
          <VStack spacing={6}>
            <Heading size="md">Installation électrique</Heading>
            <Card width="100%">
              <CardBody>
                <Grid
                  templateColumns={isMobile ? "1fr" : "repeat(2, 1fr)"}
                  gap={6}
                >
                  <FormControl isRequired>
                    <FormLabel>Type de tableau</FormLabel>
                    <RadioGroup
                      value={formData.details.electrical.type}
                      onChange={(value) =>
                        handleInputChange("details.electrical.type", value)
                      }
                    >
                      <Stack direction="row">
                        <Radio value="Mono">Mono</Radio>
                        <Radio value="Triphasé">Triphasé</Radio>
                      </Stack>
                    </RadioGroup>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Année d'installation</FormLabel>
                    <NumberInput
                      min={1950}
                      max={new Date().getFullYear()}
                      value={formData.details.electrical.installationYear}
                      onChange={(value) =>
                        handleInputChange(
                          "details.electrical.installationYear",
                          parseInt(value)
                        )
                      }
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Équipements installés</FormLabel>
                    <Stack spacing={3}>
                      <Checkbox
                        isChecked={formData.details.electrical.hasLinky}
                        onChange={(e) =>
                          handleInputChange(
                            "details.electrical.hasLinky",
                            e.target.checked
                          )
                        }
                      >
                        Compteur Linky
                      </Checkbox>
                      <Checkbox
                        isChecked={formData.details.electrical.upToStandards}
                        onChange={(e) =>
                          handleInputChange(
                            "details.electrical.upToStandards",
                            e.target.checked
                          )
                        }
                      >
                        Aux normes NF-2012
                      </Checkbox>
                    </Stack>
                  </FormControl>
                </Grid>
              </CardBody>
            </Card>
          </VStack>
        );

      case 10:
        return (
          <VStack spacing={6}>
            <Heading size="md">Ventilation</Heading>
            {formData.details.rooms.map((room, index) => (
              <Card key={room.id} width="100%" variant="outline">
                <CardHeader>
                  <Heading size="sm">
                    {room.name || `${room.type} ${index + 1}`}{" "}
                    {room.floor > 0 ? `(Étage ${room.floor})` : "(RDC)"}
                  </Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel>Types de ventilation</FormLabel>
                      <Stack>
                        {VENTILATION_TYPES.map((type) => (
                          <Checkbox
                            key={type}
                            isChecked={room.ventilation.includes(type)}
                            onChange={(e) => {
                              const types = e.target.checked
                                ? [...room.ventilation, type]
                                : room.ventilation.filter((t) => t !== type);
                              handleVentilationUpdate(index, types);
                            }}
                          >
                            {type}
                          </Checkbox>
                        ))}
                      </Stack>
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
            <Heading size="md">Isolation</Heading>
            <Card width="100%">
              <CardBody>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Type d'isolation</FormLabel>
                    <Select
                      value={formData.details.isolation.type}
                      onChange={(e) =>
                        handleInputChange(
                          "details.isolation.type",
                          e.target.value
                        )
                      }
                    >
                      <option value="">Sélectionnez un type</option>
                      {TYPE_ISOLATION.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Type d'installation</FormLabel>
                    <RadioGroup
                      value={formData.details.isolation.installation}
                      onChange={(value) =>
                        handleInputChange(
                          "details.isolation.installation",
                          value
                        )
                      }
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
                      value={formData.details.isolation.thickness}
                      onChange={(value) =>
                        handleInputChange(
                          "details.isolation.thickness",
                          parseInt(value)
                        )
                      }
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Taux d'humidité des combles (%)</FormLabel>
                    <NumberInput
                      min={0}
                      max={100}
                      value={formData.details.isolation.humidityRate}
                      onChange={(value) =>
                        handleInputChange(
                          "details.isolation.humidityRate",
                          parseInt(value)
                        )
                      }
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Condensation</FormLabel>
                    <Checkbox
                      isChecked={formData.details.isolation.hasCondensation}
                      onChange={(e) =>
                        handleInputChange(
                          "details.isolation.hasCondensation",
                          e.target.checked
                        )
                      }
                    >
                      Présence de condensation
                    </Checkbox>
                  </FormControl>

                  {formData.details.isolation.hasCondensation && (
                    <FormControl isRequired>
                      <FormLabel>Localisation de la condensation</FormLabel>
                      <VStack align="start">
                        {formData.details.rooms.map((room, index) => (
                          <Checkbox
                            key={room.id}
                            isChecked={formData.details.isolation.condensationLocations.includes(
                              room.id
                            )}
                            onChange={(e) => {
                              const locations = e.target.checked
                                ? [
                                    ...formData.details.isolation
                                      .condensationLocations,
                                    room.id,
                                  ]
                                : formData.details.isolation.condensationLocations.filter(
                                    (id) => id !== room.id
                                  );
                              handleInputChange(
                                "details.isolation.condensationLocations",
                                locations
                              );
                            }}
                          >
                            {room.name || `${room.type} ${index + 1}`}{" "}
                            {room.floor > 0 ? `(Étage ${room.floor})` : "(RDC)"}
                          </Checkbox>
                        ))}
                      </VStack>
                    </FormControl>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        );

      case 12:
        return (
          <VStack spacing={6}>
            <Heading size="md">Charpente</Heading>
            <Card width="100%">
              <CardBody>
                <Grid
                  templateColumns={isMobile ? "1fr" : "repeat(2, 1fr)"}
                  gap={6}
                >
                  <FormControl isRequired>
                    <FormLabel>Type de charpente</FormLabel>
                    <Select
                      value={formData.details.framework.type}
                      onChange={(e) =>
                        handleInputChange(
                          "details.framework.type",
                          e.target.value
                        )
                      }
                    >
                      <option value="">Sélectionnez un type</option>
                      <option value="Fermette">Fermette</option>
                      <option value="Traditionnelle">Traditionnelle</option>
                      <option value="Metalique">Metalique</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Structure</FormLabel>
                    <Checkbox
                      isChecked={formData.details.framework.hasBeam}
                      onChange={(e) =>
                        handleInputChange(
                          "details.framework.hasBeam",
                          e.target.checked
                        )
                      }
                    >
                      Présence de poutre
                    </Checkbox>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Entretien</FormLabel>
                    <Checkbox
                      isChecked={formData.details.framework.hadMaintenance}
                      onChange={(e) =>
                        handleInputChange(
                          "details.framework.hadMaintenance",
                          e.target.checked
                        )
                      }
                    >
                      Entretien effectué
                    </Checkbox>
                  </FormControl>

                  {formData.details.framework.hadMaintenance && (
                    <FormControl>
                      <FormLabel>Date d'entretien</FormLabel>
                      <Input
                        type="date"
                        value={formData.details.framework.maintenanceDate || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "details.framework.maintenanceDate",
                            e.target.value
                          )
                        }
                      />
                    </FormControl>
                  )}
                </Grid>
              </CardBody>
            </Card>
          </VStack>
        );

      case 13:
        return (
          <VStack spacing={6}>
            <Heading size="md">Toiture</Heading>
            <Card width="100%">
              <CardBody>
                <Grid
                  templateColumns={isMobile ? "1fr" : "repeat(2, 1fr)"}
                  gap={6}
                >
                  <FormControl isRequired>
                    <FormLabel>Type de toiture</FormLabel>
                    <Select
                      value={formData.details.roof.type}
                      onChange={(e) =>
                        handleInputChange("details.roof.type", e.target.value)
                      }
                    >
                      <option value="">Sélectionnez un type</option>
                      <option value="Ardoise Naturelle">
                        Ardoise Naturelle
                      </option>
                      <option value="Ardoise Fibrociment">
                        Ardoise Fibrociment
                      </option>
                      <option value="Tuiles">Tuiles</option>
                      <option value="Tuiles Béton">Tuiles Béton</option>
                      <option value="Acier">Acier</option>
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Type de faîtage</FormLabel>
                    <RadioGroup
                      value={formData.details.roof.ridgeType}
                      onChange={(value) =>
                        handleInputChange("details.roof.ridgeType", value)
                      }
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
                      value={formData.details.roof.maintenanceDate}
                      onChange={(e) =>
                        handleInputChange(
                          "details.roof.maintenanceDate",
                          e.target.value
                        )
                      }
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Type d'entretien effectué</FormLabel>
                    <Input
                      value={formData.details.roof.maintenanceType}
                      onChange={(e) =>
                        handleInputChange(
                          "details.roof.maintenanceType",
                          e.target.value
                        )
                      }
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>État général</FormLabel>
                    <Checkbox
                      isChecked={formData.details.roof.hasImpurities}
                      onChange={(e) =>
                        handleInputChange(
                          "details.roof.hasImpurities",
                          e.target.checked
                        )
                      }
                    >
                      Présence d'impuretés
                    </Checkbox>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Année d'installation</FormLabel>
                    <NumberInput
                      min={1950}
                      max={new Date().getFullYear()}
                      value={formData.details.roof.installationYear}
                      onChange={(value) =>
                        handleInputChange(
                          "details.roof.installationYear",
                          parseInt(value)
                        )
                      }
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                </Grid>
              </CardBody>
            </Card>
          </VStack>
        );

      case 14:
        return (
          <VStack spacing={6}>
            <Heading size="md">Évaluation finale</Heading>

            {formData.details.rooms.map((room) => (
              <Card key={room.id} width="100%" variant="outline">
                <CardHeader>
                  <Heading size="sm">
                    {room.name || room.type}{" "}
                    {room.floor > 0 ? `(Étage ${room.floor})` : "(RDC)"}
                  </Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <Grid
                      templateColumns={isMobile ? "1fr" : "repeat(2, 1fr)"}
                      gap={4}
                    >
                      {room.windows.count > 0 && (
                        <FormControl>
                          <FormLabel>État des ouvrants</FormLabel>
                          <VStack spacing={2} align="stretch">
                            <HStack justify="space-between">
                              <Text fontSize="sm">
                                Note actuelle:{" "}
                                {formData.evaluations.rooms[room.id]?.windows ||
                                  3}
                                /5
                              </Text>
                            </HStack>
                            <NumberInput
                              min={1}
                              max={5}
                              step={0.5}
                              value={
                                formData.evaluations.rooms[room.id]?.windows ||
                                3
                              }
                              onChange={(value) =>
                                handleRoomEvaluation(
                                  room.id,
                                  "windows",
                                  parseFloat(value)
                                )
                              }
                            >
                              <NumberInputField />
                            </NumberInput>
                            <Progress
                              value={
                                (formData.evaluations.rooms[room.id]?.windows ||
                                  3) * 20
                              }
                              colorScheme={
                                (formData.evaluations.rooms[room.id]?.windows ||
                                  3) >= 4
                                  ? "green"
                                  : (formData.evaluations.rooms[room.id]
                                      ?.windows || 3) >= 2.5
                                  ? "yellow"
                                  : "red"
                              }
                            />
                          </VStack>
                        </FormControl>
                      )}

                      {room.heating.types.length > 0 && (
                        <FormControl>
                          <FormLabel>État du chauffage</FormLabel>
                          <VStack spacing={2} align="stretch">
                            <HStack justify="space-between">
                              <Text fontSize="sm">
                                Note actuelle:{" "}
                                {formData.evaluations.rooms[room.id]?.heating ||
                                  3}
                                /5
                              </Text>
                            </HStack>
                            <NumberInput
                              min={1}
                              max={5}
                              step={0.5}
                              value={
                                formData.evaluations.rooms[room.id]?.heating ||
                                3
                              }
                              onChange={(value) =>
                                handleRoomEvaluation(
                                  room.id,
                                  "heating",
                                  parseFloat(value)
                                )
                              }
                            >
                              <NumberInputField />
                            </NumberInput>
                            <Progress
                              value={
                                (formData.evaluations.rooms[room.id]?.heating ||
                                  3) * 20
                              }
                              colorScheme={
                                (formData.evaluations.rooms[room.id]?.heating ||
                                  3) >= 4
                                  ? "green"
                                  : (formData.evaluations.rooms[room.id]
                                      ?.heating || 3) >= 2.5
                                  ? "yellow"
                                  : "red"
                              }
                            />
                          </VStack>
                        </FormControl>
                      )}

                      <FormControl>
                        <FormLabel>État de l'humidité</FormLabel>
                        <VStack spacing={2} align="stretch">
                          <HStack justify="space-between">
                            <Text fontSize="sm">
                              Note actuelle:{" "}
                              {formData.evaluations.rooms[room.id]?.humidity ||
                                3}
                              /5
                            </Text>
                          </HStack>
                          <NumberInput
                            min={1}
                            max={5}
                            step={0.5}
                            value={
                              formData.evaluations.rooms[room.id]?.humidity || 3
                            }
                            onChange={(value) =>
                              handleRoomEvaluation(
                                room.id,
                                "humidity",
                                parseFloat(value)
                              )
                            }
                          >
                            <NumberInputField />
                          </NumberInput>
                          <Progress
                            value={
                              (formData.evaluations.rooms[room.id]?.humidity ||
                                3) * 20
                            }
                            colorScheme={
                              (formData.evaluations.rooms[room.id]?.humidity ||
                                3) >= 4
                                ? "green"
                                : (formData.evaluations.rooms[room.id]
                                    ?.humidity || 3) >= 2.5
                                ? "yellow"
                                : "red"
                            }
                          />
                        </VStack>
                      </FormControl>

                      {room.ventilation.length > 0 && (
                        <FormControl>
                          <FormLabel>État de la ventilation</FormLabel>
                          <VStack spacing={2} align="stretch">
                            <HStack justify="space-between">
                              <Text fontSize="sm">
                                Note actuelle:{" "}
                                {formData.evaluations.rooms[room.id]
                                  ?.ventilation || 3}
                                /5
                              </Text>
                            </HStack>
                            <NumberInput
                              min={1}
                              max={5}
                              step={0.5}
                              value={
                                formData.evaluations.rooms[room.id]
                                  ?.ventilation || 3
                              }
                              onChange={(value) =>
                                handleRoomEvaluation(
                                  room.id,
                                  "ventilation",
                                  parseFloat(value)
                                )
                              }
                            >
                              <NumberInputField />
                            </NumberInput>
                            <Progress
                              value={
                                (formData.evaluations.rooms[room.id]
                                  ?.ventilation || 3) * 20
                              }
                              colorScheme={
                                (formData.evaluations.rooms[room.id]
                                  ?.ventilation || 3) >= 4
                                  ? "green"
                                  : (formData.evaluations.rooms[room.id]
                                      ?.ventilation || 3) >= 2.5
                                  ? "yellow"
                                  : "red"
                              }
                            />
                          </VStack>
                        </FormControl>
                      )}
                    </Grid>
                  </VStack>
                </CardBody>
              </Card>
            ))}

            <Card width="100%">
              <CardHeader>
                <Heading size="sm">Évaluation globale</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="xl">Score global:</Text>
                      <Badge
                        colorScheme={
                          formData.evaluations.global.condition === "Favorable"
                            ? "green"
                            : formData.evaluations.global.condition ===
                              "Correct"
                            ? "yellow"
                            : "red"
                        }
                        p={2}
                        borderRadius="full"
                        fontSize="xl"
                      >
                        {evaluationScore.toFixed(1)}/5
                      </Badge>
                    </HStack>
                    <Progress
                      size="lg"
                      value={evaluationScore * 20}
                      colorScheme={
                        evaluationScore >= 4
                          ? "green"
                          : evaluationScore >= 2.5
                          ? "yellow"
                          : "red"
                      }
                      borderRadius="full"
                    />
                  </Box>

                  <Divider />

                  <Box>
                    <Text fontSize="lg" fontWeight="bold" mb={2}>
                      État général :
                    </Text>
                    <Badge
                      colorScheme={
                        formData.evaluations.global.condition === "Favorable"
                          ? "green"
                          : formData.evaluations.global.condition === "Correct"
                          ? "yellow"
                          : "red"
                      }
                      p={3}
                      width="100%"
                      textAlign="center"
                      fontSize="lg"
                    >
                      {formData.evaluations.global.condition}
                    </Badge>
                  </Box>

                  <Box>
                    <Text fontSize="lg" fontWeight="bold" mb={2}>
                      Recommandations :
                    </Text>
                    <Text fontSize="md" p={4} bg="gray.50" borderRadius="md">
                      {formData.evaluations.global.comment}
                    </Text>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        );

      default:
        return null;
    }
  };

  // Rendu principal du composant
  return (
    <Box maxW="1200px" mx="auto" p={4}>
      <VStack spacing={8}>
        <Box width="100%">
          <Text fontSize="sm" color="gray.500" mb={2}>
            Étape {currentStep} sur 14
          </Text>
          <Progress
            value={(currentStep / 14) * 100}
            size="sm"
            colorScheme="blue"
            borderRadius="full"
          />
        </Box>

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          {renderStep()}

          <Flex justify="space-between" mt={8}>
            {currentStep > 1 && (
              <Button
                onClick={() => setCurrentStep((prev) => prev - 1)}
                variant="outline"
              >
                Précédent
              </Button>
            )}

            {currentStep < 14 ? (
              <Button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                colorScheme="blue"
                ml={currentStep === 1 ? "auto" : "0"}
              >
                Suivant
              </Button>
            ) : (
              <Button type="submit" colorScheme="green" ml="auto">
                Terminer l'expertise
              </Button>
            )}
          </Flex>
        </form>
      </VStack>
    </Box>
  );
};

export default ExpertiseForm;
