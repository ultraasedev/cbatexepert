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
  ConditionType,
  Room,
  FormData,
  HeatingType,
  VentilationType,
  IsolationType,
  IsolationPose,
  StateSelectorProps,
  FormDataDetails,
  ExpertiseStatus,
} from '@/app/types';

// Constantes typées
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

const HEATING_TYPES: HeatingType[] = [
  'Électrique',
  'Gaz',
  'Fioul',
  'Bois',
  'Poêle',
  'Pac'
];

const VENTILATION_TYPES: VentilationType[] = [
  'VMC Simple flux',
  'Double Flux',
  'VMI',
  'VPH'
];

const FACADE_TYPES = [
  'Enduit',
  'Peinture',
  'Pierre'
] as const;

const TYPE_ISOLATION: IsolationType[] = [
  'Ouate de cellulose',
  'Laine de Roche',
  'Laine de Verre',
  'Isolation Minerales'
];

const TYPE_ISOLATION_POSE: IsolationPose[] = [
  'Sous rampants',
  'En soufflage',
  'En rouleau'
];

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

// Valeurs par défaut typées
const defaultIsolation = {
  type: '' as IsolationType,
  installation: '' as IsolationPose,
  thickness: 0,
  condition: 'Moyen' as ConditionType
};

const defaultCombleIsolation = {
  ...defaultIsolation,
  hasCondensation: false,
  condensationLocations: [] as string[],
  humidityRate: 0
};

// État initial du formulaire typé
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
      type: 'Enduit',
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
      type: 'Fermette',
      hasBeam: false,
      hadMaintenance: false,
      maintenanceDate: null,
      condition: 'Moyen'
    },
    roof: {
      type: 'Ardoise Naturelle',
      ridgeType: 'Cimente',
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

// Fonction de transformation des données initiales
const transformInitialData = (data: Expertise): FormData => {
  const [firstName = '', lastName = ''] = data.beneficiaire.nom.split(' ');

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
}): React.ReactElement => {

  //verif de l'auth
  const { user, loading: authLoading, getAuthHeaders } = useAuth();
  // États typés
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState<boolean>(false);
  const [evaluationScore, setEvaluationScore] = useState<number>(0);
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{
    label: string;
    context: string;
  }>>([]);

  // Hooks
  const router = useRouter();
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const highlightBg = useColorModeValue('blue.100', 'blue.700');
  const normalBg = useColorModeValue('gray.100', 'gray.700');

  // Effects
  // Vérification de l'authentification
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

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

  // Gestionnaires d'événements typés
  const handleInputChange = (path: string, value: unknown): void => {
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

  const handleTypeLogementSelect = (type: 'maison' | 'appartement'): void => {
    handleInputChange('typeLogement', type);
  };

  const handleRoomUpdate = (index: number, field: string, value: unknown): void => {
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
  
      let newFormData = {
        ...prev,
        details: {
          ...prev.details,
          rooms: newRooms
        }
      };
  
      if (field === 'type' && typeof value === 'string') {
        if (value === 'Sous-sol') {
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
          const stillHasBasement = newRooms.some((r, i) => i !== index && r.type === 'Sous-sol');
          if (!stillHasBasement) {
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

  const addRoom = (): void => {
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
            },
            charpente: {
              condition: 'Moyen'
            },
            toiture: {
              condition: 'Moyen'
            },
            facades: {
              condition: 'Moyen'
            }
          }
        ]
      }
    }));
  };

  const removeRoom = (index: number): void => {
    setFormData(prev => {
      const newRooms = prev.details.rooms.filter((_, i) => i !== index);
      const hasBasement = newRooms.some(room => room.type === 'Sous-sol');
      
      if (!hasBasement) {
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

  const handleWindowsUpdate = (index: number, field: string, value: unknown): void => {
    handleRoomUpdate(index, `windows.${field}`, value);
  };

  const handleHeatingUpdate = (index: number, field: string, value: unknown): void => {
    handleRoomUpdate(index, `heating.${field}`, value);
  };

  const handleVentilationUpdate = (index: number, ventilationType: string, isChecked: boolean): void => {
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

  const handleConditionUpdate = (index: number, field: string, condition: ConditionType): void => {
    setFormData(prev => {
      const newRooms = [...prev.details.rooms];
      
      // Cas spéciaux pour windows et heating qui ont leur condition dans un sous-objet
      if (field === 'windows') {
        newRooms[index] = {
          ...newRooms[index],
          windows: {
            ...newRooms[index].windows,
            condition: condition
          }
        };
      } else if (field === 'heating') {
        newRooms[index] = {
          ...newRooms[index],
          heating: {
            ...newRooms[index].heating,
            condition: condition
          }
        };
      } 
      // Si c'est un champ qui a son propre objet (comme isolation, toiture, etc.)
      else if (field === 'isolation' || field === 'charpente' || field === 'toiture' || field === 'facades') {
        newRooms[index] = {
          ...newRooms[index],
          [field]: {
            ...newRooms[index][field],
            condition: condition
          }
        };
      } else {
        // Pour les champs qui utilisent directement xxxCondition
        newRooms[index] = {
          ...newRooms[index],
          [`${field}Condition`]: condition
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

  const fetchAddressSuggestions = async (input: string): Promise<void> => {
    if (input.length > 2) {
      try {
        const headers = getAuthHeaders();
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(input)}&limit=5`,
          { headers }
        );
        const data = await response.json();
        setAddressSuggestions(
          data.features.map((feature: any) => ({
            label: feature.properties.label,
            context: feature.properties.context,
          }))
        );
      } catch (error) {
        console.error('Erreur:', error);
        setAddressSuggestions([]);
      }
    } else {
      setAddressSuggestions([]);
    }
  };

  const handleIsolationUpdate = (area: 'combles' | 'murs' | 'sols', field: string, value: unknown): void => {
    handleInputChange(`details.isolation.${area}.${field}`, value);
  };

  // Fonction de calcul du score
  const calculateScoreFromCondition = (condition: ConditionType): number => {
    switch (condition) {
      case 'Bon': return 5;
      case 'Moyen': return 3;
      case 'Mauvais': return 1;
      default: return 3;
    }
  };

  const calculateNewScore = (): void => {
    const roomScores = formData.details.rooms.map(room => {
      const scores: number[] = [];
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
                     
    handleInputChange('evaluations.global', {
      score: newScore,
      condition,
      comment: generateGlobalComment(newScore)
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
  const validateExpertiseData = (formData: FormData): { isValid: boolean; errors: string[] } => {
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
  
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
  
    setLoading(true);
    
    try {
      calculateNewScore();
      
      const validation = validateExpertiseData(formData);
      if (!validation.isValid) {
        throw new Error(`Validation échouée: ${validation.errors.join(', ')}`);
      }

      // Fonctions helper
const dateToTimestamp = (dateString: string): number => {
  return new Date(dateString).getTime();
};

  
      // Fonctions helper pour trouver les premières pièces avec équipements
      const getFirstRoomWithWindows = () => {
        return formData.details.rooms.find(room => room.windows.count > 0);
      };
  
      const getFirstRoomWithHeating = () => {
        return formData.details.rooms.find(room => room.heating.types.length > 0);
      };
  
      const firstRoomWithWindows = getFirstRoomWithWindows();
      const firstRoomWithHeating = getFirstRoomWithHeating();
  
      // Construction des données pour l'API
const expertiseData = {
  typeLogement: formData.typeLogement,
  beneficiaire: {
    nom: `${formData.details.beneficiary.firstName} ${formData.details.beneficiary.lastName}`,
    adresse: formData.details.beneficiary.address,
    telephone: formData.details.beneficiary.phone
  },
  details: {
    anneeConstruction: Number(formData.details.construction.year),
    superficie: Number(formData.details.construction.area),
    nombreEtages: Number(formData.details.construction.floors)
  },
  ouvertures: {
    nombre: firstRoomWithWindows ? firstRoomWithWindows.windows.count : 0,
    typeVitrage: firstRoomWithWindows ? firstRoomWithWindows.windows.type : 'simple',
    etat: firstRoomWithWindows ? firstRoomWithWindows.windows.condition : 'Moyen',
    anneeInstallation: firstRoomWithWindows ? 
      firstRoomWithWindows.windows.installationYear : 
      Number(formData.details.construction.year)
  },
  chauffage: {
    type: firstRoomWithHeating?.heating.types[0] || 'Électrique',
    nombre: formData.details.rooms.reduce((count, room) => 
      count + (room.heating.types.length > 0 ? 1 : 0), 0),
    etat: firstRoomWithHeating?.heating.condition || 'Moyen',
    anneeInstallation: firstRoomWithHeating?.heating.installationYear || 
      Number(formData.details.construction.year)
  },
  humidite: {
    taux: formData.details.rooms[0]?.humidity || 0,
    etat: formData.details.rooms[0]?.humidityCondition || 'Moyen'
  },
  facade: {
    type: formData.details.facades[0].type,
    epaisseurMurs: Number(formData.details.facades[0].thickness),
    dernierEntretien: dateToTimestamp(formData.details.facades[0].lastMaintenance),
    etat: formData.details.facades[0].condition
  },
  tableauElectrique: {
    type: formData.details.electrical.type,
    anneePose: Number(formData.details.electrical.installationYear),
    presenceLinky: formData.details.electrical.hasLinky,
    auxNormes: formData.details.electrical.upToStandards,
    etat: formData.details.electrical.condition
  },
  ventilation: {
    type: formData.details.rooms[0]?.ventilation[0] || 'VMC Simple flux',
    nombreBouches: formData.details.rooms.reduce((count, room) => 
      count + (room.ventilation.length > 0 ? 1 : 0), 0),
    piecesEquipees: formData.details.rooms
      .filter(r => r.ventilation.length > 0)
      .map(r => r.type)
      .join(', '),
    ventilationNaturelle: true,
    anneePose: Number(formData.details.construction.year),
    etat: formData.details.rooms[0]?.ventilationCondition || 'Moyen'
  },
  isolation: {
    type: formData.details.isolation.combles.type,
    pose: formData.details.isolation.combles.installation,
    epaisseur: Number(formData.details.isolation.combles.thickness),
    etat: formData.details.isolation.combles.condition,
    presenceCondensation: formData.details.isolation.combles.hasCondensation,
    localisationCondensation: formData.details.isolation.combles.condensationLocations[0] || '',
    tauxHumiditeCombles: Number(formData.details.isolation.combles.humidityRate),
    etatCombles: formData.details.isolation.combles.condition
  },
  charpente: {
    type: formData.details.framework.type,
    presenceArtive: formData.details.framework.hasBeam,
    entretienEffectue: formData.details.framework.hadMaintenance,
    dateEntretien: formData.details.framework.maintenanceDate ? 
      dateToTimestamp(formData.details.framework.maintenanceDate) : 
      null,
    etat: formData.details.framework.condition
  },
  toiture: {
    type: formData.details.roof.type,
    typeFaitage: formData.details.roof.ridgeType,
    dateEntretien: dateToTimestamp(formData.details.roof.maintenanceDate),
    typeEntretien: formData.details.roof.maintenanceType,
    presenceImpuretes: formData.details.roof.hasImpurities,
    annee: Number(formData.details.roof.installationYear),
    etat: formData.details.roof.condition
  },
  evaluations: {
    rooms: formData.evaluations.rooms,
    global: {
      score: evaluationScore,
      condition: formData.evaluations.global.condition,
      comment: formData.evaluations.global.comment
    }
  },
  status: 'En cours' as ExpertiseStatus
};
  
      // Si c'est une édition
      if (isEditing && initialData?._id) {
        const headers = getAuthHeaders();
        const response = await fetch(`/api/expertises/${initialData._id}`, {
          method: 'PUT',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(expertiseData),
        });
  
        if (!response.ok) {
          throw new Error('Erreur lors de la mise à jour');
        }
      } 
      // Si c'est une nouvelle expertise
      else {
        const headers = getAuthHeaders();
        const response = await fetch('/api/expertises', {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(expertiseData),
        });
  
        if (!response.ok) {
          throw new Error('Erreur lors de la création');
        }
      }
  
      if (onSubmit) {
        await onSubmit(formData);
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

  // Composant StateSelector avec props typées
  const StateSelector: React.FC<StateSelectorProps> = ({ 
    label = "",
    currentValue,
    onChange,
    description = "",
    mb = 6,
    fieldId
  }: StateSelectorProps) => {
    const inputGroupId = `${fieldId}-group`;
  
    return (
      <Box width="100%" mb={mb} p={4} borderWidth="1px" borderRadius="md">
        {label && (
          <Text fontWeight="bold" fontSize="lg" mb={2}>{label}</Text>
        )}
        {description && (
          <Text fontSize="sm" color="gray.600" mb={4}>
            {description}
          </Text>
        )}
        <FormControl>
          {label && (
            <FormLabel htmlFor={inputGroupId}>{label}</FormLabel>
          )}
          <RadioGroup 
            id={inputGroupId} 
            value={currentValue} 
            onChange={onChange}
          >
            <Stack direction={{ base: 'column', sm: 'row' }} spacing={4}>
              {CONDITION_TYPES.map((conditionType) => (
                <Radio
                  key={`${fieldId}-${conditionType}`}
                  id={`${fieldId}-${conditionType}`}
                  value={conditionType}
                  name={fieldId}
                  size="lg"
                  colorScheme={
                    conditionType === 'Bon' ? 'green' :
                    conditionType === 'Moyen' ? 'yellow' : 'red'
                  }
                >
                  <Box
                    as="span"
                    p={2}
                    width="100%"
                    textAlign="center"
                    fontSize="lg"
                  >
                    {conditionType}
                  </Box>
                </Radio>
              ))}
            </Stack>
          </RadioGroup>
        </FormControl>
      </Box>
    );
  };
  // Interface pour les composants réutilisables
  interface RoomConditionsProps {
    room: Room;
    index: number;
    onUpdate: {
      handleConditionUpdate: (index: number, field: string, condition: ConditionType) => void;
      handleRoomUpdate: (index: number, field: string, value: unknown) => void;
    };
  }
  interface StateSelectorOption {
    value: ConditionType;
    color: 'green' | 'yellow' | 'red';
  }

  // Composant pour les conditions des pièces
  const RoomConditions: React.FC<RoomConditionsProps> = ({ 
    room, 
    index, 
    onUpdate: { handleConditionUpdate, handleRoomUpdate }
  }) => (
    <VStack spacing={6} align="stretch" width="100%">
      {room.windows.count > 0 && (
        <StateSelector
          label="État des ouvertures"
          description={`${room.windows.count} ${room.windows.count > 1 ? 'ouvertures' : 'ouverture'} - 
            ${room.windows.type === 'simple' ? 'Simple vitrage' : 'Double vitrage'} (${room.windows.installationYear})`}
          currentValue={room.windows.condition}
          onChange={(value) => handleConditionUpdate(index, "windows", value)}
          fieldId={`${room.id}-windows-condition`}
        />
      )}

      {room.heating.types.length > 0 && (
        <StateSelector
          label="État du chauffage"
          description={`Types installés: ${room.heating.types.join(', ')}`}
          currentValue={room.heating.condition}
          onChange={(value) => handleConditionUpdate(index, "heating", value)}
          fieldId={`${room.id}-heating-condition`}
        />
      )}

      <Box p={4} borderWidth="1px" borderRadius="md">
        <Text fontWeight="bold" fontSize="lg" mb={4}>Humidité</Text>
        <FormControl mb={4}>
          <FormLabel htmlFor={`${room.id}-humidity-rate`}>
            Taux d'humidité (%)
          </FormLabel>
          <NumberInput
            id={`${room.id}-humidity-rate`}
            name={`${room.id}-humidity-rate`}
            value={room.humidity}
            min={0}
            max={100}
            onChange={(valueString) => handleRoomUpdate(index, "humidity", parseInt(valueString))}
          >
            <NumberInputField height="50px" fontSize="lg" />
          </NumberInput>
        </FormControl>
        
        <StateSelector
          currentValue={room.humidityCondition}
          onChange={(value) => handleConditionUpdate(index, "humidity", value)}
          fieldId={`${room.id}-humidity-condition`}
          mb={0}
        />
      </Box>

      <StateSelector
        label="État de la ventilation"
        description={room.ventilation.length > 0 ? 
          `Types installés: ${room.ventilation.join(', ')}` : 
          'Aucune ventilation'}
        currentValue={room.ventilationCondition}
        onChange={(value) => handleConditionUpdate(index, "ventilation", value)}
        fieldId={`${room.id}-ventilation-condition`}
      />

      <StateSelector
        label="État de l'isolation"
        currentValue={room.isolation.condition}
        onChange={(value) => handleConditionUpdate(index, "isolation", value)}
        fieldId={`${room.id}-isolation-condition`}
      />

      <StateSelector
        label="État de la charpente"
        currentValue={room.charpente.condition}
        onChange={(value) => handleConditionUpdate(index, "charpente", value)}
        fieldId={`${room.id}-charpente-condition`}
      />

      <StateSelector
        label="État de la toiture"
        currentValue={room.toiture.condition}
        onChange={(value) => handleConditionUpdate(index, "toiture", value)}
        fieldId={`${room.id}-toiture-condition`}
      />

      <StateSelector
        label="État des façades"
        currentValue={room.facades.condition}
        onChange={(value) => handleConditionUpdate(index, "facades", value)}
        fieldId={`${room.id}-facades-condition`}
      />
    </VStack>
  );
  const renderStep = () => {
  // Fonction utilitaire pour générer des IDs uniques
  const generateFieldId = (
    type: string, 
    element: string, 
    subElement: string = ''
  ): string => {
    const cleanType = type.toLowerCase().replace(/\s+/g, '-');
    const cleanElement = element.toLowerCase().replace(/\s+/g, '-');
    return `${cleanType}-${cleanElement}${subElement ? `-${subElement}` : ''}`;
  };
  
    // Composant StateSelector réutilisable
   // Dans renderStep
const StateSelector: React.FC<StateSelectorProps> = ({ 
  label = "", // Valeur par défaut avec type string
  currentValue,
  onChange,
  description = "",
  mb = 6,
  fieldId
}: StateSelectorProps) => (
  <Box width="100%" mb={mb} p={4} borderWidth="1px" borderRadius="md">
    {label && (
      <Text fontWeight="bold" fontSize="lg" mb={2}>{label}</Text>
    )}
    {description && (
      <Text fontSize="sm" color="gray.600" mb={4}>
        {description}
      </Text>
    )}
    <Stack direction={{ base: 'column', sm: 'row' }} spacing={4} width="100%">
      {[
        { value: 'Bon' as ConditionType, color: 'green' },
        { value: 'Moyen' as ConditionType, color: 'yellow' },
        { value: 'Mauvais' as ConditionType, color: 'red' }
      ].map((option) => (
        <Button
          key={`${fieldId}-${option.value}`}
          id={`${fieldId}-${option.value}`}
          name={fieldId}
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
                id="type-logement-maison"
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
                id="type-logement-appartement"
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
            <Grid templateColumns={isMobile ? "1fr" : "repeat(2, 1fr)"} gap={6} width="100%">
              <FormControl isRequired>
                <FormLabel htmlFor="beneficiary-firstname">Prénom</FormLabel>
                <Input
                  id="beneficiary-firstname"
                  name="beneficiary-firstname"
                  value={formData.details.beneficiary.firstName}
                  onChange={(e) => handleInputChange("details.beneficiary.firstName", e.target.value)}
                  placeholder="Prénom du bénéficiaire"
                />
              </FormControl>
  
              <FormControl isRequired>
                <FormLabel htmlFor="beneficiary-lastname">Nom</FormLabel>
                <Input
                  id="beneficiary-lastname"
                  name="beneficiary-lastname"
                  value={formData.details.beneficiary.lastName}
                  onChange={(e) => handleInputChange("details.beneficiary.lastName", e.target.value)}
                  placeholder="Nom du bénéficiaire"
                />
              </FormControl>
            </Grid>
  
            <FormControl isRequired>
              <FormLabel htmlFor="beneficiary-address">Adresse</FormLabel>
              <Box position="relative">
                <Input
                  id="beneficiary-address"
                  name="beneficiary-address"
                  value={formData.details.beneficiary.address}
                  onChange={(e) => {
                    handleInputChange("details.beneficiary.address", e.target.value);
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
                          handleInputChange("details.beneficiary.address", suggestion.label);
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
              <FormLabel htmlFor="beneficiary-phone">Téléphone</FormLabel>
              <Box position="relative">
                <PhoneInput
                  country={"fr"}
                  value={formData.details.beneficiary.phone}
                  onChange={(phone) => handleInputChange("details.beneficiary.phone", phone)}
                  inputProps={{
                    id: "beneficiary-phone",
                    name: "beneficiary-phone"
                  }}
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
                <FormLabel htmlFor="construction-year">Année de construction</FormLabel>
                <NumberInput
                  id="construction-year"
                  name="construction-year"
                  min={1800}
                  max={new Date().getFullYear()}
                  value={formData.details.construction.year}
                  onChange={(valueString) => handleInputChange(
                    "details.construction.year",
                    parseInt(valueString)
                  )}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
  
              <FormControl isRequired>
                <FormLabel htmlFor="construction-area">Superficie (m²)</FormLabel>
                <NumberInput
                  id="construction-area"
                  name="construction-area"
                  min={1}
                  value={formData.details.construction.area}
                  onChange={(valueString) => handleInputChange(
                    "details.construction.area",
                    parseInt(valueString)
                  )}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
  
              <FormControl isRequired>
                <FormLabel htmlFor="construction-floors">Nombre d'étages</FormLabel>
                <NumberInput
                  id="construction-floors"
                  name="construction-floors"
                  min={0}
                  max={10}
                  value={formData.details.construction.floors}
                  onChange={(valueString) => handleInputChange(
                    "details.construction.floors",
                    parseInt(valueString)
                  )}
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
                      <FormLabel htmlFor={`room-type-${index}`}>Type de pièce</FormLabel>
                      <Select
                        id={`room-type-${index}`}
                        name={`room-type-${index}`}
                        value={room.type}
                        onChange={(e) => handleRoomUpdate(index, "type", e.target.value)}
                      >
                        <option value="">Sélectionnez un type</option>
                        {ROOM_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </Select>
                    </FormControl>

                    {room.type && (
                      <FormControl isRequired>
                        <FormLabel htmlFor={`room-name-${index}`}>Nom de la pièce</FormLabel>
                        <Input
                          id={`room-name-${index}`}
                          name={`room-name-${index}`}
                          placeholder={`${room.type} ${index + 1}`}
                          value={room.name}
                          onChange={(e) => handleRoomUpdate(index, "name", e.target.value)}
                        />
                      </FormControl>
                    )}

                    <FormControl>
                      <FormLabel htmlFor={`room-floor-${index}`}>Étage</FormLabel>
                      <NumberInput
                        id={`room-floor-${index}`}
                        name={`room-floor-${index}`}
                        min={0}
                        max={formData.details.construction.floors}
                        value={room.floor}
                        onChange={(value) => handleRoomUpdate(index, "floor", parseInt(value))}
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
                    <FormLabel htmlFor={`windows-count-${room.id}`}>
                      Nombre d'ouvertures
                    </FormLabel>
                    <NumberInput
                      id={`windows-count-${room.id}`}
                      name={`windows-count-${room.id}`}
                      min={0}
                      value={room.windows.count}
                      onChange={(value) => handleWindowsUpdate(index, "count", parseInt(value))}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>

                  {room.windows.count > 0 && (
                    <>
                      <FormControl>
                        <FormLabel htmlFor={`windows-type-${room.id}`}>Type de vitrage</FormLabel>
                        <RadioGroup
                          id={`windows-type-${room.id}`}
                          value={room.windows.type}
                          onChange={(value) => handleWindowsUpdate(index, "type", value)}
                        >
                          <Stack direction="row">
                            <Radio 
                              id={`windows-type-simple-${room.id}`} 
                              name={`windows-type-${room.id}`} 
                              value="simple"
                            >
                              Simple vitrage
                            </Radio>
                            <Radio 
                              id={`windows-type-double-${room.id}`} 
                              name={`windows-type-${room.id}`} 
                              value="double"
                            >
                              Double vitrage
                            </Radio>
                          </Stack>
                        </RadioGroup>
                      </FormControl>

                      <FormControl>
                        <FormLabel htmlFor={`windows-year-${room.id}`}>
                          Année d'installation
                        </FormLabel>
                        <NumberInput
                          id={`windows-year-${room.id}`}
                          name={`windows-year-${room.id}`}
                          min={1950}
                          max={new Date().getFullYear()}
                          value={room.windows.installationYear}
                          onChange={(value) => handleWindowsUpdate(
                            index,
                            "installationYear",
                            parseInt(value)
                          )}
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
                          id={`heating-type-${room.id}-${type}`}
                          name={`heating-type-${room.id}`}
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
                      <FormLabel htmlFor={`heating-year-${room.id}`}>
                        Année d'installation
                      </FormLabel>
                      <NumberInput
                        id={`heating-year-${room.id}`}
                        name={`heating-year-${room.id}`}
                        min={1950}
                        max={new Date().getFullYear()}
                        value={room.heating.installationYear}
                        onChange={(value) => handleHeatingUpdate(
                          index,
                          "installationYear",
                          parseInt(value)
                        )}
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
          
          <Card width="100%">
            <CardHeader>
              <Heading size="sm">Isolation des combles</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel htmlFor="isolation-combles-type">Type d'isolation</FormLabel>
                  <Select
                    id="isolation-combles-type"
                    name="isolation-combles-type"
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
                  <FormLabel htmlFor="isolation-combles-installation">Type d'installation</FormLabel>
                  <Select
                    id="isolation-combles-installation"
                    name="isolation-combles-installation"
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
                  <FormLabel htmlFor="isolation-combles-thickness">Épaisseur (cm)</FormLabel>
                  <NumberInput
                    id="isolation-combles-thickness"
                    name="isolation-combles-thickness"
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

          <Card width="100%">
            <CardHeader>
              <Heading size="sm">Isolation des murs</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel htmlFor="isolation-murs-type">Type d'isolation</FormLabel>
                  <Select
                    id="isolation-murs-type"
                    name="isolation-murs-type"
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
                  <FormLabel htmlFor="isolation-murs-installation">Type d'installation</FormLabel>
                  <Select
                    id="isolation-murs-installation"
                    name="isolation-murs-installation"
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
                  <FormLabel htmlFor="isolation-murs-thickness">Épaisseur (cm)</FormLabel>
                  <NumberInput
                    id="isolation-murs-thickness"
                    name="isolation-murs-thickness"
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

          {formData.details.rooms.some(room => room.type === 'Sous-sol') && (
            <Card width="100%">
              <CardHeader>
                <Heading size="sm">Isolation du Sous-Sol</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel htmlFor="isolation-sols-type">Type d'isolation</FormLabel>
                    <Select
                      id="isolation-sols-type"
                      name="isolation-sols-type"
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
                    <FormLabel htmlFor="isolation-sols-installation">Type d'installation</FormLabel>
                    <Select
                      id="isolation-sols-installation"
                      name="isolation-sols-installation"
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
                    <FormLabel htmlFor="isolation-sols-thickness">Épaisseur (cm)</FormLabel>
                    <NumberInput
                      id="isolation-sols-thickness"
                      name="isolation-sols-thickness"
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
                    id="electrical-type"
                    value={formData.details.electrical.type}
                    onChange={(value) => handleInputChange("details.electrical.type", value)}
                  >
                    <Stack direction="row">
                      <Radio id="electrical-type-mono" name="electrical-type" value="Mono">Mono</Radio>
                      <Radio id="electrical-type-tri" name="electrical-type" value="Triphasé">Triphasé</Radio>
                    </Stack>
                  </RadioGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel htmlFor="electrical-year">Année d'installation</FormLabel>
                  <NumberInput
                    id="electrical-year"
                    name="electrical-year"
                    min={1950}
                    max={new Date().getFullYear()}
                    value={formData.details.electrical.installationYear}
                    onChange={(value) => handleInputChange("details.electrical.installationYear", parseInt(value))}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Équipements installés</FormLabel>
                  <Stack spacing={3}>
                    <Checkbox
                      id="electrical-linky"
                      name="electrical-linky"
                      isChecked={formData.details.electrical.hasLinky}
                      onChange={(e) => handleInputChange("details.electrical.hasLinky", e.target.checked)}
                    >
                      Compteur Linky
                    </Checkbox>
                    <Checkbox
                      id="electrical-standards"
                      name="electrical-standards"
                      isChecked={formData.details.electrical.upToStandards}
                      onChange={(e) => handleInputChange("details.electrical.upToStandards", e.target.checked)}
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
                          id={`ventilation-${room.id}-${type}`}
                          name={`ventilation-${room.id}`}
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
                  <FormLabel htmlFor="framework-type">Type de charpente</FormLabel>
                  <Select
                    id="framework-type"
                    name="framework-type"
                    value={formData.details.framework.type}
                    onChange={(e) => handleInputChange("details.framework.type", e.target.value)}
                  >
                    <option value="">Sélectionnez un type</option>
                    {TYPE_CHARPENTE.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel htmlFor="framework-beam">Structure</FormLabel>
                  <Checkbox
                    id="framework-beam"
                    name="framework-beam"
                    isChecked={formData.details.framework.hasBeam}
                    onChange={(e) => handleInputChange("details.framework.hasBeam", e.target.checked)}
                  >
                    Présence de poutre
                  </Checkbox>
                </FormControl>

                <FormControl>
                  <FormLabel htmlFor="framework-maintenance">Entretien</FormLabel>
                  <Checkbox
                    id="framework-maintenance"
                    name="framework-maintenance"
                    isChecked={formData.details.framework.hadMaintenance}
                    onChange={(e) => handleInputChange("details.framework.hadMaintenance", e.target.checked)}
                  >
                    Entretien effectué
                  </Checkbox>
                </FormControl>

                {formData.details.framework.hadMaintenance && (
                  <FormControl>
                    <FormLabel htmlFor="framework-maintenance-date">Date d'entretien</FormLabel>
                    <Input
                      id="framework-maintenance-date"
                      name="framework-maintenance-date"
                      type="date"
                      value={formData.details.framework.maintenanceDate || ""}
                      onChange={(e) => handleInputChange("details.framework.maintenanceDate", e.target.value)}
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
                  <FormLabel htmlFor="roof-type">Type de toiture</FormLabel>
                  <Select
                    id="roof-type"
                    name="roof-type"
                    value={formData.details.roof.type}
                    onChange={(e) => handleInputChange("details.roof.type", e.target.value)}
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
                    id="roof-ridge-type"
                    value={formData.details.roof.ridgeType}
                    onChange={(value) => handleInputChange("details.roof.ridgeType", value)}
                  >
                    <Stack direction="row">
                      {TYPE_FAITAGE.map((type) => (
                        <Radio 
                          key={type} 
                          id={`roof-ridge-${type}`}
                          name="roof-ridge-type"
                          value={type}
                        >
                          {type}
                        </Radio>
                      ))}
                    </Stack>
                  </RadioGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel htmlFor="roof-maintenance-date">Date d'entretien</FormLabel>
                  <Input
                    id="roof-maintenance-date"
                    name="roof-maintenance-date"
                    type="date"
                    value={formData.details.roof.maintenanceDate}
                    onChange={(e) => handleInputChange("details.roof.maintenanceDate", e.target.value)}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel htmlFor="roof-maintenance-type">Type d'entretien effectué</FormLabel>
                  <Input
                    id="roof-maintenance-type"
                    name="roof-maintenance-type"
                    value={formData.details.roof.maintenanceType}
                    onChange={(e) => handleInputChange("details.roof.maintenanceType", e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel htmlFor="roof-impurities">État général</FormLabel>
                  <Checkbox
                    id="roof-impurities"
                    name="roof-impurities"
                    isChecked={formData.details.roof.hasImpurities}
                    onChange={(e) => handleInputChange("details.roof.hasImpurities", e.target.checked)}
                  >
                    Présence d'impuretés
                  </Checkbox>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel htmlFor="roof-year">Année d'installation</FormLabel>
                  <NumberInput
                    id="roof-year"
                    name="roof-year"
                    min={1950}
                    max={new Date().getFullYear()}
                    value={formData.details.roof.installationYear}
                    onChange={(value) => handleInputChange("details.roof.installationYear", parseInt(value))}
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
                    <FormLabel htmlFor="combles-humidity">Taux d'humidité des combles (%)</FormLabel>
                    <NumberInput
                      id="combles-humidity"
                      name="combles-humidity"
                      value={formData.details.isolation.combles.humidityRate}
                      min={0}
                      max={100}
                      onChange={(value) => handleIsolationUpdate('combles', 'humidityRate', parseInt(value))}
                    >
                      <NumberInputField height="50px" fontSize="lg" />
                    </NumberInput>
                  </FormControl>
      
                  <FormControl>
                    <FormLabel htmlFor="combles-condensation">Présence de condensation</FormLabel>
                    <Checkbox
                      id="combles-condensation"
                      name="combles-condensation"
                      size="lg"
                      isChecked={formData.details.isolation.combles.hasCondensation}
                      onChange={(e) => handleIsolationUpdate('combles', 'hasCondensation', e.target.checked)}
                    >
                      <Text fontSize="lg">Condensation détectée</Text>
                    </Checkbox>
                  </FormControl>
      
                  {formData.details.isolation.combles.hasCondensation && (
                    <FormControl>
                      <FormLabel htmlFor="combles-condensation-location">
                        Localisation de la condensation
                      </FormLabel>
                      <Input
                        id="combles-condensation-location"
                        name="combles-condensation-location"
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
                    fieldId="combles-condition"
                  />
                </VStack>
              </CardBody>
            </Card>
      
            {/* État par pièce */}
            {formData.details.rooms.map((room, index) => {
              const roomId = room.id;
              const roomName = room.name || `${room.type} ${index + 1}`;
              
              return (
                <Card key={roomId} width="100%">
                  <CardHeader>
                    <Heading size="sm">
                      {roomName}{' '}
                      {room.floor > 0 ? `(Étage ${room.floor})` : "(RDC)"}
                    </Heading>
                  </CardHeader>
                  <CardBody>
                    {/* Ouvertures */}
                    {room.windows.count > 0 && (
                      <StateSelector
                        label="État des ouvertures"
                        description={`${room.windows.count} ${room.windows.count > 1 ? 'ouvertures' : 'ouverture'} - 
                          ${room.windows.type === 'simple' ? 'Simple vitrage' : 'Double vitrage'} (${room.windows.installationYear})`}
                        currentValue={room.windows.condition}
                        onChange={(value) => handleConditionUpdate(index, "windows", value)}
                        fieldId={`${roomId}-windows-condition`}
                      />
                    )}
      
                    {/* Chauffage */}
                    {room.heating.types.length > 0 && (
                      <StateSelector
                        label="État du chauffage"
                        description={`Types installés: ${room.heating.types.join(', ')}`}
                        currentValue={room.heating.condition}
                        onChange={(value) => handleConditionUpdate(index, "heating", value)}
                        fieldId={`${roomId}-heating-condition`}
                      />
                    )}
      
                    {/* Humidité */}
                    <Box p={4} borderWidth="1px" borderRadius="md">
                      <Text fontWeight="bold" fontSize="lg" mb={4}>Humidité</Text>
                      <FormControl mb={4}>
                        <FormLabel htmlFor={`${roomId}-humidity-rate`}>
                          Taux d'humidité (%)
                        </FormLabel>
                        <NumberInput
                          id={`${roomId}-humidity-rate`}
                          name={`${roomId}-humidity-rate`}
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
                        onChange={(value) => handleConditionUpdate(index, "humidity", value)}
                        fieldId={`${roomId}-humidity-condition`}
                        mb={0}
                      />
                    </Box>
      
                    {/* Ventilation */}
                    <StateSelector
                      label="État de la ventilation"
                      description={room.ventilation.length > 0 ? 
                        `Types installés: ${room.ventilation.join(', ')}` : 
                        'Aucune ventilation'}
                      currentValue={room.ventilationCondition}
                      onChange={(value) => handleConditionUpdate(index, "ventilation", value)}
                      fieldId={`${roomId}-ventilation-condition`}
                    />
      
                    {/* Isolation */}
                    <StateSelector
                      label="État de l'isolation"
                      currentValue={room.isolation.condition}
                      onChange={(value) => handleConditionUpdate(index, "isolation", value)}
                      fieldId={`${roomId}-isolation-condition`}
                    />
      
                    {/* Charpente */}
                    <StateSelector
                      label="État de la charpente"
                      currentValue={room.charpente.condition}
                      onChange={(value) => handleConditionUpdate(index, "charpente", value)}
                      fieldId={`${roomId}-charpente-condition`}
                    />
      
                    {/* Toiture */}
                    <StateSelector
                      label="État de la toiture"
                      currentValue={room.toiture.condition}
                      onChange={(value) => handleConditionUpdate(index, "toiture", value)}
                      fieldId={`${roomId}-toiture-condition`}
                    />
      
                    {/* Façades */}
                    <StateSelector
                      label="État des façades"
                      currentValue={room.facades.condition}
                      onChange={(value) => handleConditionUpdate(index, "facades", value)}
                      fieldId={`${roomId}-facades-condition`}
                    />
                  </CardBody>
                </Card>
              );
            })}
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
                      {/* Ouvertures */}
                      {room.windows.count > 0 && (
                        <Box>
                          <Text fontWeight="bold">Ouvertures</Text>
                          <Badge
                            id={`summary-${room.id}-windows-badge`}
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

                      {/* Chauffage */}
                      {room.heating.types.length > 0 && (
                        <Box>
                          <Text fontWeight="bold">Chauffage</Text>
                          <Badge
                            id={`summary-${room.id}-heating-badge`}
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

                      {/* Humidité */}
                      <Box>
                        <Text fontWeight="bold">Humidité</Text>
                        <Badge
                          id={`summary-${room.id}-humidity-badge`}
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

                      {/* Ventilation */}
                      <Box>
                        <Text fontWeight="bold">Ventilation</Text>
                        <Badge
                          id={`summary-${room.id}-ventilation-badge`}
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

                      {/* Isolation */}
                      <Box>
                        <Text fontWeight="bold">Isolation</Text>
                        <Badge
                          id={`summary-${room.id}-isolation-badge`}
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

                      {/* Charpente */}
                      <Box>
                        <Text fontWeight="bold">Charpente</Text>
                        <Badge
                          id={`summary-${room.id}-charpente-badge`}
                          colorScheme={
                            room.charpente.condition === 'Bon'
                              ? 'green'
                              : room.charpente.condition === 'Moyen'
                              ? 'yellow'
                              : 'red'
                          }
                        >
                          {room.charpente.condition}
                        </Badge>
                      </Box>

                      {/* Toiture */}
                      <Box>
                        <Text fontWeight="bold">Toiture</Text>
                        <Badge
                          id={`summary-${room.id}-toiture-badge`}
                          colorScheme={
                            room.toiture.condition === 'Bon'
                              ? 'green'
                              : room.toiture.condition === 'Moyen'
                              ? 'yellow'
                              : 'red'
                          }
                        >
                          {room.toiture.condition}
                        </Badge>
                      </Box>

                      {/* Façades */}
                      <Box>
                        <Text fontWeight="bold">Façades</Text>
                        <Badge
                          id={`summary-${room.id}-facades-badge`}
                          colorScheme={
                            room.facades.condition === 'Bon'
                              ? 'green'
                              : room.facades.condition === 'Moyen'
                              ? 'yellow'
                              : 'red'
                          }
                        >
                          {room.facades.condition}
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
                        id="summary-combles-badge"
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

                    {/* ... autres états ... */}
                  </Grid>

                  <Divider />

                  {/* Score global et évaluation finale */}
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="xl">Score global</Text>
                      <Badge
                        id="summary-global-score"
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
                    <Text id="summary-global-comment">
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
// Afficher un loader pendant la vérification de l'auth
if (authLoading) {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Text>Chargement...</Text>
    </Box>
  );
}

// Rediriger si non authentifié
if (!user) {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Text>Non autorisé</Text>
    </Box>
  );
}

  // Return du composant principal
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
                isDisabled={loading}
              >
                Précédent
              </Button>
            )}

            {currentStep < 13 ? (
              <Button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                colorScheme="blue"
                ml={currentStep === 1 ? "auto" : "0"}
                isDisabled={loading}
              >
                Suivant
              </Button>
            ) : (
              <Button 
                type="submit" 
                colorScheme="green" 
                ml="auto"
                isLoading={loading}
                loadingText="Envoi en cours..."
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