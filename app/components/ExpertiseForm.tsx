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
  ListItem,
  SimpleGrid
} from '@chakra-ui/react';
import { FaPlus, FaTrash, FaHome, FaBuilding } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import type { 
  Expertise, 
  RoomEvaluation, 
  GlobalEvaluation,
  ExpertiseFormProps,
  ConditionType
} from '@/app/types';
// Types et Interfaces
interface IsolationDetails {
  type: string;
  installation: string;
  thickness: number;
  condition: ConditionType;
}

interface CombleIsolation extends IsolationDetails {
  hasCondensation: boolean;
  condensationLocations: string[];
  humidityRate: number;
}

interface Room {
  id: string;
  type: string;
  name: string;
  floor: number;
  windows: {
    count: number;
    type: 'simple' | 'double';
    installationYear: number;
    condition: ConditionType;
  };
  heating: {
    types: string[];
    installationYear: number;
    condition: ConditionType;
  };
  ventilation: string[];
  ventilationCondition: ConditionType;
  humidity: number;
  humidityCondition: ConditionType;
  isolation: {
    condition: ConditionType;
  };
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
      condition: ConditionType;
    }>;
    electrical: {
      type: 'Mono' | 'Triphasé';
      installationYear: number;
      hasLinky: boolean;
      upToStandards: boolean;
      condition: ConditionType;
    };
    isolation: {
      combles: CombleIsolation;
      murs: IsolationDetails;
      sols?: IsolationDetails;
      condition: ConditionType;
    };
    framework: {
      type: string;
      hasBeam: boolean;
      hadMaintenance: boolean;
      maintenanceDate: string | null;
      condition: ConditionType;
    };
    roof: {
      type: string;
      ridgeType: string;
      maintenanceDate: string;
      maintenanceType: string;
      hasImpurities: boolean;
      installationYear: number;
      condition: ConditionType;
    };
  };
  evaluations: {
    rooms: {
      [key: string]: RoomEvaluation;
    };
    global: GlobalEvaluation;
  };
}
// Constantes
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
  'Garage',
  'Sous-sol'
] as const;

const HEATING_TYPES = [
  'Électrique',
  'Gaz',
  'Fioul',
  'Bois',
  'Poêle',
  'Pac'
] as const;

const VENTILATION_TYPES = [
  'VMC Simple flux',
  'Double Flux',
  'VMI',
  'VPH'
] as const;

const FACADE_TYPES = [
  'Enduit',
  'Peinture',
  'Pierre'
] as const;

const TYPE_ISOLATION = [
  'Ouate de cellulose',
  'Laine de Roche',
  'Laine de Verre',
  'Isolation Minerales'
] as const;

const TYPE_ISOLATION_POSE = [
  'Sous rampants',
  'En soufflage',
  'En rouleau'
] as const;

const TYPE_CHARPENTE = [
  'Fermette',
  'Traditionnelle',
  'Metalique'
] as const;

const TYPE_TOITURE = [
  'Ardoise Naturelle',
  'Ardoise Fibrociment',
  'Tuiles',
  'Tuiles Béton',
  'Acier'
] as const;

const TYPE_FAITAGE = [
  'Cimente',
  'En Boîte'
] as const;

const CONDITION_TYPES: ConditionType[] = ['Bon', 'Moyen', 'Mauvais'];

// Helper function
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

const defaultIsolation: IsolationDetails = {
  type: '',
  installation: '',
  thickness: 0,
  condition: 'Moyen'
};

const defaultCombleIsolation: CombleIsolation = {
  ...defaultIsolation,
  hasCondensation: false,
  condensationLocations: [],
  humidityRate: 0
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
      combles: defaultCombleIsolation,
      murs: defaultIsolation,
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
const transformInitialData = (data: Expertise): FormData => {
  const [firstName = '', lastName = ''] = data.beneficiaire.nom.split(' ');

  // Transformer les évaluations
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
    global: data.evaluations?.global || {
      score: 0,
      condition: 'Correct',
      comment: ''
    }
  };

  return {
    typeLogement: data.typeLogement,
    details: {
      beneficiary: {
        firstName,
        lastName,
        address: data.beneficiaire.adresse,
        phone: data.beneficiaire.telephone
      },
      construction: {
        year: data.details.anneeConstruction,
        area: data.details.superficie,
        floors: data.details.nombreEtages
      },
      rooms: [],
      facades: [{
        type: data.facade.type,
        thickness: data.facade.epaisseurMurs,
        lastMaintenance: data.facade.dernierEntretien.toString(),
        condition: data.facade.etat
      }],
      electrical: {
        type: data.tableauElectrique.type,
        installationYear: data.tableauElectrique.anneePose,
        hasLinky: data.tableauElectrique.presenceLinky,
        upToStandards: data.tableauElectrique.auxNormes,
        condition: data.tableauElectrique.etat
      },
      isolation: {
        combles: {
          type: data.isolation.type,
          installation: data.isolation.pose,
          thickness: data.isolation.epaisseur,
          condition: data.isolation.etat,
          hasCondensation: data.isolation.presenceCondensation,
          condensationLocations: data.isolation.localisationCondensation ? [data.isolation.localisationCondensation] : [],
          humidityRate: data.isolation.tauxHumiditeCombles
        },
        murs: {
          type: data.isolation.type,
          installation: data.isolation.pose,
          thickness: data.isolation.epaisseur,
          condition: data.isolation.etat
        },
        condition: data.isolation.etat
      },
      framework: {
        type: data.charpente.type,
        hasBeam: data.charpente.presenceArtive,
        hadMaintenance: data.charpente.entretienEffectue,
        maintenanceDate: data.charpente.dateEntretien?.toString() || null,
        condition: data.charpente.etat
      },
      roof: {
        type: data.toiture.type,
        ridgeType: data.toiture.typeFaitage,
        maintenanceDate: data.toiture.dateEntretien.toString(),
        maintenanceType: data.toiture.typeEntretien,
        hasImpurities: data.toiture.presenceImpuretes,
        installationYear: data.toiture.annee,
        condition: data.toiture.etat
      }
    },
    evaluations: transformedEvaluations
  };
};

const ExpertiseForm: React.FC<ExpertiseFormProps> = ({
  isEditing = false,
  initialData,
  onSubmit
}) => {
  // États
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [evaluationScore, setEvaluationScore] = useState(0);
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{label: string; context: string}>>([]);

  // Hooks
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const highlightBg = useColorModeValue('blue.100', 'blue.700');
  const normalBg = useColorModeValue('gray.100', 'gray.700');

  // Effects
  useEffect(() => {
    if (isEditing && initialData) {
      const transformedData = transformInitialData(initialData);
      setFormData(transformedData);
    }
  }, [isEditing, initialData]);

  useEffect(() => {
    if (currentStep === 14) {
      calculateNewScore();
    }
  }, [currentStep, formData.details.rooms]);
  useEffect(() => {
    if (currentStep === 14) {
      calculateNewScore();
    }
  }, [currentStep, formData.details.rooms]);

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
  
      // Gérer l'ajout/suppression de sous-sol et l'isolation des sols
      let newFormData = {
        ...prev,
        details: {
          ...prev.details,
          rooms: newRooms
        }
      };
  
      if (field === 'type') {
        if (value === 'Sous-sol') {
          // Ajouter l'isolation des sols si on ajoute un sous-sol
          newFormData = {
            ...newFormData,
            details: {
              ...newFormData.details,
              isolation: {
                ...newFormData.details.isolation,
                sols: defaultIsolation
              }
            }
          };
        } else {
          // Vérifier s'il reste d'autres sous-sols
          const stillHasBasement = newRooms.some((r, i) => i !== index && r.type === 'Sous-sol');
          if (!stillHasBasement) {
            // Supprimer l'isolation des sols s'il n'y a plus de sous-sol
            newFormData = {
              ...newFormData,
              details: {
                ...newFormData.details,
                isolation: {
                  ...newFormData.details.isolation,
                  sols: undefined
                }
              }
            };
          }
        }
      }
  
      return newFormData;
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
              installationYear: new Date().getFullYear(),
              condition: 'Moyen'
            },
            heating: {
              types: [],
              installationYear: new Date().getFullYear(),
              condition: 'Moyen'
            },
            ventilation: [],
            ventilationCondition: 'Moyen',
            humidity: 0,
            humidityCondition: 'Moyen',
            isolation: {
              condition: 'Moyen'
            }
          }
        ]
      }
    }));
  };

  const removeRoom = (index: number) => {
    setFormData(prev => {
      const newRooms = prev.details.rooms.filter((_, i) => i !== index);
      const hasBasement = newRooms.some(room => room.type === 'Sous-sol');
      
      if (!hasBasement) {
        // Si plus de sous-sol, on retire l'isolation des sols
        return {
          ...prev,
          details: {
            ...prev.details,
            rooms: newRooms,
            isolation: {
              ...prev.details.isolation,
              sols: undefined
            }
          }
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

  const handleWindowsUpdate = (index: number, field: string, value: any) => {
    handleRoomUpdate(index, `windows.${field}`, value);
  };

  const handleHeatingUpdate = (index: number, field: string, value: any) => {
    handleRoomUpdate(index, `heating.${field}`, value);
  };

  const handleVentilationUpdate = (index: number, ventilationType: string, isChecked: boolean) => {
    setFormData(prev => {
      const newRooms = [...prev.details.rooms];
      const currentVentilation = [...newRooms[index].ventilation];

      if (isChecked) {
        if (!currentVentilation.includes(ventilationType)) {
          currentVentilation.push(ventilationType);
        }
      } else {
        const typeIndex = currentVentilation.indexOf(ventilationType);
        if (typeIndex > -1) {
          currentVentilation.splice(typeIndex, 1);
        }
      }

      newRooms[index] = {
        ...newRooms[index],
        ventilation: currentVentilation
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

  const handleConditionUpdate = (index: number, field: string, condition: ConditionType) => {
    if (field.includes('.')) {
      const [mainField, subField] = field.split('.');
      handleRoomUpdate(index, `${mainField}.condition`, condition);
    } else {
      handleRoomUpdate(index, `${field}Condition`, condition);
    }
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

  const handleIsolationUpdate = (area: 'combles' | 'murs' | 'sols', field: string, value: any) => {
    handleInputChange(`details.isolation.${area}.${field}`, value);
  };

  const calculateNewScore = () => {
    const roomScores = formData.details.rooms.map(room => {
      const scores = [];
      if (room.windows.count > 0) {
        scores.push(calculateScoreFromCondition(room.windows.condition));
      }
      if (room.heating.types.length > 0) {
        scores.push(calculateScoreFromCondition(room.heating.condition));
      }
      scores.push(calculateScoreFromCondition(room.humidityCondition));
      if (room.ventilation.length > 0) {
        scores.push(calculateScoreFromCondition(room.ventilationCondition));
      }
      scores.push(calculateScoreFromCondition(room.isolation.condition));
      return scores.reduce((a, b) => a + b, 0) / scores.length;
    });

    const structureScores = [
      calculateScoreFromCondition(formData.details.framework.condition),
      calculateScoreFromCondition(formData.details.facades[0].condition),
      calculateScoreFromCondition(formData.details.roof.condition),
      calculateScoreFromCondition(formData.details.isolation.combles.condition),
      calculateScoreFromCondition(formData.details.isolation.murs.condition)
    ];

    if (formData.details.isolation.sols) {
      structureScores.push(calculateScoreFromCondition(formData.details.isolation.sols.condition));
    }
    
    const allScores = [...roomScores, ...structureScores];
    const newScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
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

  const calculateScoreFromCondition = (condition: ConditionType): number => {
    switch (condition) {
      case 'Bon': return 5;
      case 'Moyen': return 3;
      case 'Mauvais': return 1;
      default: return 3;
    }
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

    if (!formData.typeLogement) errors.push('Le type de logement est requis');
    
    if (!formData.details.beneficiary.firstName) errors.push('Le prénom du bénéficiaire est requis');
    if (!formData.details.beneficiary.lastName) errors.push('Le nom du bénéficiaire est requis');
    if (!formData.details.beneficiary.address) errors.push('L\'adresse du bénéficiaire est requise');
    if (!formData.details.beneficiary.phone) errors.push('Le téléphone du bénéficiaire est requis');

    if (!formData.details.construction.year) errors.push('L\'année de construction est requise');
    if (!formData.details.construction.area) errors.push('La superficie est requise');
    if (formData.details.construction.floors < 0) errors.push('Le nombre d\'étages doit être positif');

    if (!formData.details.rooms.length) errors.push('Au moins une pièce est requise');
    formData.details.rooms.forEach((room, index) => {
      if (!room.type) errors.push(`Le type de la pièce ${index + 1} est requis`);
    });

    // Validation de l'isolation
    if (!formData.details.isolation.combles.type) errors.push('Le type d\'isolation des combles est requis');
    if (!formData.details.isolation.combles.installation) errors.push('Le type d\'installation des combles est requis');
    if (!formData.details.isolation.murs.type) errors.push('Le type d\'isolation des murs est requis');
    if (!formData.details.isolation.murs.installation) errors.push('Le type d\'installation des murs est requis');

    // Validation de l'isolation du sol si sous-sol présent
    if (formData.details.rooms.some(room => room.type === 'Sous-sol')) {
      if (!formData.details.isolation.sols?.type) errors.push('Le type d\'isolation du sol est requis');
      if (!formData.details.isolation.sols?.installation) errors.push('Le type d\'installation du sol est requis');
    }

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
          etat: formData.details.rooms[0]?.windows.condition || "Bon",
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
          etat: formData.details.rooms[0]?.humidityCondition || 'Bon'
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
          etat: formData.details.rooms[0]?.ventilationCondition || 'Bon'
        },
        isolation: {
          combles: {
            type: formData.details.isolation.combles.type,
            installation: formData.details.isolation.combles.installation,
            thickness: formData.details.isolation.combles.thickness,
            condition: formData.details.isolation.combles.condition,
            hasCondensation: formData.details.isolation.combles.hasCondensation,
            condensationLocations: formData.details.isolation.combles.condensationLocations,
            humidityRate: formData.details.isolation.combles.humidityRate
          },
          murs: {
            type: formData.details.isolation.murs.type,
            installation: formData.details.isolation.murs.installation,
            thickness: formData.details.isolation.murs.thickness,
            condition: formData.details.isolation.murs.condition
          },
          ...(formData.details.isolation.sols && {
            sols: {
              type: formData.details.isolation.sols.type,
              installation: formData.details.isolation.sols.installation,
              thickness: formData.details.isolation.sols.thickness,
              condition: formData.details.isolation.sols.condition
            }
          })
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
        description: `L'expertise a été ${isEditing ? 'modifiée' : 'créée'} avec succès`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      router.push('/expertises');
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
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
                    fetchAddressSuggestions(e.target.value);
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
          <Heading size="md">Configuration de l'isolation</Heading>
          
          {/* Isolation des combles */}
          <Card width="100%">
            <CardHeader>
              <Heading size="sm">Isolation des combles</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Type d'isolation</FormLabel>
                  <Select
                    value={formData.details.isolation.combles.type}
                    onChange={(e) => handleIsolationUpdate('combles', 'type', e.target.value)}
                  >
                    <option value="">Sélectionnez un type</option>
                    {TYPE_ISOLATION.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Type d'installation</FormLabel>
                  <Select
                    value={formData.details.isolation.combles.installation}
                    onChange={(e) => handleIsolationUpdate('combles', 'installation', e.target.value)}
                  >
                    <option value="">Sélectionnez un type</option>
                    {TYPE_ISOLATION_POSE.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Épaisseur (cm)</FormLabel>
                  <NumberInput
                    min={1}
                    value={formData.details.isolation.combles.thickness}
                    onChange={(value) => handleIsolationUpdate('combles', 'thickness', parseInt(value))}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </VStack>
            </CardBody>
          </Card>

          {/* Isolation des murs */}
          <Card width="100%">
            <CardHeader>
              <Heading size="sm">Isolation des murs</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Type d'isolation</FormLabel>
                  <Select
                    value={formData.details.isolation.murs.type}
                    onChange={(e) => handleIsolationUpdate('murs', 'type', e.target.value)}
                  >
                    <option value="">Sélectionnez un type</option>
                    {TYPE_ISOLATION.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Type d'installation</FormLabel>
                  <Select
                    value={formData.details.isolation.murs.installation}
                    onChange={(e) => handleIsolationUpdate('murs', 'installation', e.target.value)}
                  >
                    <option value="">Sélectionnez un type</option>
                    {TYPE_ISOLATION_POSE.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Épaisseur (cm)</FormLabel>
                  <NumberInput
                    min={1}
                    value={formData.details.isolation.murs.thickness}
                    onChange={(value) => handleIsolationUpdate('murs', 'thickness', parseInt(value))}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </VStack>
            </CardBody>
          </Card>

          {/* Isolation du sol (si sous-sol présent) */}
          {formData.details.rooms.some(room => room.type === 'Sous-sol') && (
            <Card width="100%">
              <CardHeader>
                <Heading size="sm">Isolation du sol</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Type d'isolation</FormLabel>
                    <Select
                      value={formData.details.isolation.sols?.type || ''}
                      onChange={(e) => handleIsolationUpdate('sols', 'type', e.target.value)}
                    >
                      <option value="">Sélectionnez un type</option>
                      {TYPE_ISOLATION.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Type d'installation</FormLabel>
                    <Select
                      value={formData.details.isolation.sols?.installation || ''}
                      onChange={(e) => handleIsolationUpdate('sols', 'installation', e.target.value)}
                    >
                      <option value="">Sélectionnez un type</option>
                      {TYPE_ISOLATION_POSE.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Épaisseur (cm)</FormLabel>
                    <NumberInput
                      min={1}
                      value={formData.details.isolation.sols?.thickness || 0}
                      onChange={(value) => handleIsolationUpdate('sols', 'thickness', parseInt(value))}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>
          )}
        </VStack>
      );

    case 8:
      return (
        <VStack spacing={6}>
          <Heading size="md">Installation électrique</Heading>
          <Card width="100%">
            <CardBody>
              <Grid templateColumns={isMobile ? "1fr" : "repeat(2, 1fr)"} gap={6}>
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
      case 9:
      return (
        <VStack spacing={6}>
          <Heading size="md">Configuration de la ventilation</Heading>
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
                            handleVentilationUpdate(index, type, e.target.checked);
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

    case 10:
      return (
        <VStack spacing={6}>
          <Heading size="md">Configuration de la charpente</Heading>
          <Card width="100%">
            <CardBody>
              <Grid templateColumns={isMobile ? "1fr" : "repeat(2, 1fr)"} gap={6}>
                <FormControl isRequired>
                  <FormLabel>Type de charpente</FormLabel>
                  <Select
                    value={formData.details.framework.type}
                    onChange={(e) =>
                      handleInputChange("details.framework.type", e.target.value)
                    }
                  >
                    <option value="">Sélectionnez un type</option>
                    {TYPE_CHARPENTE.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
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
      case 11:
      return (
        <VStack spacing={6}>
          <Heading size="md">Configuration de la toiture</Heading>
          <Card width="100%">
            <CardBody>
              <Grid templateColumns={isMobile ? "1fr" : "repeat(2, 1fr)"} gap={6}>
                <FormControl isRequired>
                  <FormLabel>Type de toiture</FormLabel>
                  <Select
                    value={formData.details.roof.type}
                    onChange={(e) =>
                      handleInputChange("details.roof.type", e.target.value)
                    }
                  >
                    <option value="">Sélectionnez un type</option>
                    {TYPE_TOITURE.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
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
                      {TYPE_FAITAGE.map((type) => (
                        <Radio key={type} value={type}>{type}</Radio>
                      ))}
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

      case 12:
        interface StateSelectorProps {
          label?: string;
          currentValue: ConditionType;
          onChange: (value: ConditionType) => void;
          description?: string;
          mb?: number | string;
        }
  
        const StateSelector: React.FC<StateSelectorProps> = ({ 
          label,
          currentValue,
          onChange,
          description = "",
          mb = 6
        }) => (
          <Box width="100%" mb={mb} p={4} borderWidth="1px" borderRadius="md">
            {label && (
              <Text fontWeight="bold" fontSize="lg" mb={2}>{label}</Text>
            )}
            {description && (
              <Text fontSize="sm" color="gray.600" mb={4}>
                {description}
              </Text>
            )}
            <Stack 
              direction={{ base: 'column', sm: 'row' }} 
              spacing={4} 
              width="100%"
            >
              {[
                { value: 'Bon' as ConditionType, color: 'green' },
                { value: 'Moyen' as ConditionType, color: 'yellow' },
                { value: 'Mauvais' as ConditionType, color: 'red' }
              ].map((option) => (
                <Button
                  key={option.value}
                  width="100%"
                  height="60px"
                  onClick={() => onChange(option.value)}
                  colorScheme={option.color}
                  variant={currentValue === option.value ? "solid" : "outline"}
                  _hover={{ transform: 'none' }}
                  fontSize="lg"
                >
                  {option.value}
                </Button>
              ))}
            </Stack>
          </Box>
        );
  
        // L'utilisation dans un composant :
        const RoomConditions: React.FC<{
          room: Room;
          index: number;
        }> = ({ room, index }) => (
          <VStack spacing={6} align="stretch" width="100%">
            {room.windows.count > 0 && (
              <StateSelector
                label="État des ouvertures"
                description={`${room.windows.count} ${room.windows.count > 1 ? 'ouvertures' : 'ouverture'} - 
                  ${room.windows.type === 'simple' ? 'Simple vitrage' : 'Double vitrage'} (${room.windows.installationYear})`}
                currentValue={room.windows.condition}
                onChange={(value) => {
                  handleConditionUpdate(index, "windows", value);
                }}
              />
            )}
  
            {room.heating.types.length > 0 && (
              <StateSelector
                label="État du chauffage"
                description={`Types installés: ${room.heating.types.join(', ')}`}
                currentValue={room.heating.condition}
                onChange={(value) => {
                  handleConditionUpdate(index, "heating", value);
                }}
              />
            )}
  
            <Box p={4} borderWidth="1px" borderRadius="md">
              <Text fontWeight="bold" fontSize="lg" mb={4}>Humidité</Text>
              <FormControl mb={4}>
                <FormLabel>Taux d'humidité (%)</FormLabel>
                <NumberInput
                  value={room.humidity}
                  min={0}
                  max={100}
                  onChange={(value) => handleRoomUpdate(index, "humidity", parseInt(value))}
                >
                  <NumberInputField height="50px" fontSize="lg" />
                </NumberInput>
              </FormControl>
              
              <StateSelector
                currentValue={room.humidityCondition}
                onChange={(value) => {
                  handleConditionUpdate(index, "humidity", value);
                }}
                mb={0}
              />
            </Box>
  
            <StateSelector
              label="État de la ventilation"
              description={room.ventilation.length > 0 ? `Types installés: ${room.ventilation.join(', ')}` : 'Aucune ventilation'}
              currentValue={room.ventilationCondition}
              onChange={(value) => {
                handleConditionUpdate(index, "ventilation", value);
              }}
            />
  
            <StateSelector
              label="État de l'isolation"
              currentValue={room.isolation.condition}
              onChange={(value) => {
                handleConditionUpdate(index, "isolation", value);
              }}
            />
          </VStack>
        );
  
        return (
          <VStack spacing={6} align="stretch" width="100%">
            <Heading size="md" mb={4}>État détaillé par pièce et éléments généraux</Heading>
  
            {/* État des combles */}
            <Card width="100%">
              <CardHeader>
                <Heading size="sm">État des combles</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <FormControl>
                    <FormLabel>Taux d'humidité des combles (%)</FormLabel>
                    <NumberInput
                      value={formData.details.isolation.combles.humidityRate}
                      min={0}
                      max={100}
                      onChange={(value) => handleIsolationUpdate('combles', 'humidityRate', parseInt(value))}
                    >
                      <NumberInputField height="50px" fontSize="lg" />
                    </NumberInput>
                  </FormControl>
  
                  <FormControl>
                    <FormLabel>Présence de condensation</FormLabel>
                    <Checkbox
                      size="lg"
                      isChecked={formData.details.isolation.combles.hasCondensation}
                      onChange={(e) => handleIsolationUpdate('combles', 'hasCondensation', e.target.checked)}
                    >
                      <Text fontSize="lg">Condensation détectée</Text>
                    </Checkbox>
                  </FormControl>
  
                  {formData.details.isolation.combles.hasCondensation && (
                    <FormControl>
                      <FormLabel>Localisation de la condensation</FormLabel>
                      <Input
                        height="50px"
                        fontSize="lg"
                        value={formData.details.isolation.combles.condensationLocations[0] || ''}
                        onChange={(e) => handleIsolationUpdate('combles', 'condensationLocations', [e.target.value])}
                        placeholder="Décrivez la localisation de la condensation"
                      />
                    </FormControl>
                  )}
  
                  <StateSelector
                    label="État général des combles"
                    currentValue={formData.details.isolation.combles.condition}
                    onChange={(value) => handleIsolationUpdate('combles', 'condition', value)}
                  />
                </VStack>
              </CardBody>
            </Card>
  
            {/* État par pièce */}
            {formData.details.rooms.map((room, index) => (
              <Card key={room.id} width="100%">
                <CardHeader>
                  <Heading size="sm">
                    {room.name || `${room.type} ${index + 1}`}{' '}
                    {room.floor > 0 ? `(Étage ${room.floor})` : "(RDC)"}
                  </Heading>
                </CardHeader>
                <CardBody>
                  <RoomConditions room={room} index={index} />
                </CardBody>
              </Card>
            ))}
          </VStack>
        );
      case 13:
      return (
        <VStack spacing={6}>
          <Heading size="md">Résumé et évaluation globale</Heading>

          {/* Résumé par pièce */}
          {formData.details.rooms.map((room) => (
            <Card key={room.id} width="100%" variant="outline">
              <CardHeader>
                <Heading size="sm">
                  {room.name || room.type}{" "}
                  {room.floor > 0 ? `(Étage ${room.floor})` : "(RDC)"}
                </Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    {room.windows.count > 0 && (
                      <Box>
                        <Text fontWeight="bold">Ouvertures</Text>
                        <Badge
                          colorScheme={
                            room.windows.condition === 'Bon'
                              ? 'green'
                              : room.windows.condition === 'Moyen'
                              ? 'yellow'
                              : 'red'
                          }
                        >
                          {room.windows.condition}
                        </Badge>
                        <Text fontSize="sm" mt={1}>
                          {room.windows.count} ouverture(s) - {room.windows.type}
                        </Text>
                      </Box>
                    )}

                    {room.heating.types.length > 0 && (
                      <Box>
                        <Text fontWeight="bold">Chauffage</Text>
                        <Badge
                          colorScheme={
                            room.heating.condition === 'Bon'
                              ? 'green'
                              : room.heating.condition === 'Moyen'
                              ? 'yellow'
                              : 'red'
                          }
                        >
                          {room.heating.condition}
                        </Badge>
                        <Text fontSize="sm" mt={1}>
                          Types: {room.heating.types.join(', ')}
                        </Text>
                      </Box>
                    )}

                    <Box>
                      <Text fontWeight="bold">Humidité</Text>
                      <Badge
                        colorScheme={
                          room.humidityCondition === 'Bon'
                            ? 'green'
                            : room.humidityCondition === 'Moyen'
                            ? 'yellow'
                            : 'red'
                        }
                      >
                        {room.humidityCondition}
                      </Badge>
                      <Text fontSize="sm" mt={1}>
                        Taux: {room.humidity}%
                      </Text>
                    </Box>

                    <Box>
                      <Text fontWeight="bold">Ventilation</Text>
                      <Badge
                        colorScheme={
                          room.ventilationCondition === 'Bon'
                            ? 'green'
                            : room.ventilationCondition === 'Moyen'
                            ? 'yellow'
                            : 'red'
                        }
                      >
                        {room.ventilationCondition}
                      </Badge>
                      <Text fontSize="sm" mt={1}>
                        {room.ventilation.length > 0 ? room.ventilation.join(', ') : 'Aucune ventilation'}
                      </Text>
                    </Box>

                    <Box>
                      <Text fontWeight="bold">Isolation</Text>
                      <Badge
                        colorScheme={
                          room.isolation.condition === 'Bon'
                            ? 'green'
                            : room.isolation.condition === 'Moyen'
                            ? 'yellow'
                            : 'red'
                        }
                      >
                        {room.isolation.condition}
                      </Badge>
                    </Box>
                  </Grid>
                </VStack>
              </CardBody>
            </Card>
          ))}

          {/* État général du bâtiment */}
          <Card width="100%">
            <CardHeader>
              <Heading size="sm">État général du bâtiment</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  {/* Combles */}
                  <Box>
                    <Text fontWeight="bold">Combles</Text>
                    <Badge
                      colorScheme={
                        formData.details.isolation.combles.condition === 'Bon'
                          ? 'green'
                          : formData.details.isolation.combles.condition === 'Moyen'
                          ? 'yellow'
                          : 'red'
                      }
                    >
                      {formData.details.isolation.combles.condition}
                    </Badge>
                    <Text fontSize="sm" mt={1}>
                      Humidité: {formData.details.isolation.combles.humidityRate}%
                      {formData.details.isolation.combles.hasCondensation && (
                        <Badge ml={2} colorScheme="red">Condensation</Badge>
                      )}
                    </Text>
                  </Box>

                  {/* Isolations */}
                  <Box>
                    <Text fontWeight="bold">Isolation Murs</Text>
                    <Badge
                      colorScheme={
                        formData.details.isolation.murs.condition === 'Bon'
                          ? 'green'
                          : formData.details.isolation.murs.condition === 'Moyen'
                          ? 'yellow'
                          : 'red'
                      }
                    >
                      {formData.details.isolation.murs.condition}
                    </Badge>
                    <Text fontSize="sm" mt={1}>
                      Type: {formData.details.isolation.murs.type}
                    </Text>
                  </Box>

                  {formData.details.isolation.sols && (
                    <Box>
                      <Text fontWeight="bold">Isolation Sols</Text>
                      <Badge
                        colorScheme={
                          formData.details.isolation.sols.condition === 'Bon'
                            ? 'green'
                            : formData.details.isolation.sols.condition === 'Moyen'
                            ? 'yellow'
                            : 'red'
                        }
                      >
                        {formData.details.isolation.sols.condition}
                      </Badge>
                      <Text fontSize="sm" mt={1}>
                        Type: {formData.details.isolation.sols.type}
                      </Text>
                    </Box>
                  )}

                  <Box>
                    <Text fontWeight="bold">Charpente</Text>
                    <Badge
                      colorScheme={
                        formData.details.framework.condition === 'Bon'
                          ? 'green'
                          : formData.details.framework.condition === 'Moyen'
                          ? 'yellow'
                          : 'red'
                      }
                    >
                      {formData.details.framework.condition}
                    </Badge>
                  </Box>

                  <Box>
                    <Text fontWeight="bold">Toiture</Text>
                    <Badge
                      colorScheme={
                        formData.details.roof.condition === 'Bon'
                          ? 'green'
                          : formData.details.roof.condition === 'Moyen'
                          ? 'yellow'
                          : 'red'
                      }
                    >
                      {formData.details.roof.condition}
                    </Badge>
                    {formData.details.roof.hasImpurities && (
                      <Badge ml={2} colorScheme="red">
                        Présence d'impuretés
                      </Badge>
                    )}
                  </Box>
                </Grid>

                <Divider />

                {/* Score global et évaluation finale */}
                <Box>
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="xl">Score global</Text>
                    <Badge
                      colorScheme={
                        formData.evaluations.global.condition === "Favorable"
                          ? "green"
                          : formData.evaluations.global.condition === "Correct"
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

                <Box p={4} bg="gray.50" borderRadius="md">
                  <Text fontSize="lg" fontWeight="bold" mb={2}>
                    État général:
                  </Text>
                  <Text>{formData.evaluations.global.comment}</Text>
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
// Rendu principal du composant ExpertiseForm
  return (
    <Box maxW="1200px" mx="auto" p={4}>
      <VStack spacing={8}>
        {/* Barre de progression */}
        <Box width="100%">
          <Text fontSize="sm" color="gray.500" mb={2}>
            Étape {currentStep} sur 13
          </Text>
          <Progress
            value={(currentStep / 13) * 100}
            size="sm"
            colorScheme="blue"
            borderRadius="full"
          />
        </Box>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          {renderStep()}

          {/* Boutons de navigation */}
          <Flex justify="space-between" mt={8}>
            {currentStep > 1 && (
              <Button
                onClick={() => setCurrentStep((prev) => prev - 1)}
                variant="outline"
              >
                Précédent
              </Button>
            )}

            {currentStep < 13 ? (
              <Button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                colorScheme="blue"
                ml={currentStep === 1 ? "auto" : "0"}
              >
                Suivant
              </Button>
            ) : (
              <Button 
                type="submit" 
                colorScheme="green" 
                ml="auto"
                isLoading={loading}
              >
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
