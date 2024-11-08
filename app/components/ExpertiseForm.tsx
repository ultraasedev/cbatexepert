"use client";

import React, { useState, useEffect } from "react";
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { FaPlus, FaTrash, FaHome, FaBuilding } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
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
  BaseIsolation,
  CombleIsolation,
} from "@/app/types";

interface TransformedData {
  typeLogement: string;
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
    chauffage: {
      types: HeatingType[];
      nombreRadiateurs: number;
      localisations: string[];
      installationYear: number;
      condition: ConditionType;
    };
    ventilation: {
      types: VentilationType[];
      localisations: string[];
      installationYear: number;
      condition: ConditionType;
    };
    facades: Array<{
      type: "Enduit" | "Peinture" | "Pierre";
      thickness: number;
      lastMaintenance: string;
      condition: ConditionType;
    }>;
    electrical: {
      type: "Mono" | "Triphasé";
      installationYear: number;
      hasLinky: boolean;
      upToStandards: boolean;
      condition: ConditionType;
    };
    isolation: {
      combles: CombleIsolation;
      murs: BaseIsolation;
      sols?: BaseIsolation;
    };
    framework: {
      type: (typeof TYPE_CHARPENTE)[number];
      hasBeam: boolean;
      hadMaintenance: boolean;
      maintenanceDate: string | null;
      condition: ConditionType;
    };
    roof: {
      type: (typeof TYPE_TOITURE)[number];
      ridgeType: (typeof TYPE_FAITAGE)[number];
      maintenanceDate: string;
      maintenanceType: string;
      hasImpurities: boolean;
      installationYear: number;
      condition: ConditionType;
    };
    humidite: {
      condition: ConditionType;
      tauxParPiece: Record<string, number>;
    };
    impuretes: {
      condition: ConditionType;
    };
    securiteIncendie: {
      bouleIncendie: boolean;
      extincteur: boolean;
      detecteurFumee: boolean;
    };
    toiture: {
      type: (typeof TYPE_TOITURE)[number];
      ridgeType: (typeof TYPE_FAITAGE)[number];
      maintenanceDate: string;
      maintenanceType: string;
      hasImpurities: boolean;
      installationYear: number;
      condition: ConditionType;
    };
    charpente: {
      type: (typeof TYPE_CHARPENTE)[number];
      hasBeam: boolean;
      hadMaintenance: boolean;
      maintenanceDate: string | null;
      condition: ConditionType;
    };
  };
  evaluations: {
    rooms: Record<string, RoomEvaluation>;
    global: {
      score: number;
      condition: "Favorable" | "Correct" | "Critique";
      comment: string;
    };
  };
}
interface LocationSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: "chauffage" | "ventilation";
  localisations: string[];
}
interface ExtendedRoom extends Room {
  humidityCondition: ConditionType;
}

// Constantes typées
const ROOM_TYPES = [
  "Entree",
  "Salon",
  "Cuisine",
  "Chambre",
  "Salle de bain",
  "WC",
  "Bureau",
  "Buanderie",
  "Cave",
  "Garage",
  "Sous-sol",
] as const;

const HEATING_TYPES: HeatingType[] = [
  "Électrique",
  "Gaz",
  "Fioul",
  "Bois",
  "Poêle",
  "Pac",
];

const VENTILATION_TYPES: VentilationType[] = [
  "VMC Simple flux",
  "Double Flux",
  "VMI",
  "VPH",
];

const FACADE_TYPES = ["Enduit", "Peinture", "Pierre"] as const;

const TYPE_ISOLATION: IsolationType[] = [
  "Ouate de cellulose",
  "Laine de Roche",
  "Laine de Verre",
  "Isolation Minerales",
];

const TYPE_ISOLATION_POSE: IsolationPose[] = [
  "Sous rampants",
  "En soufflage",
  "En rouleau",
];

const TYPE_CHARPENTE = ["Fermette", "Traditionnelle", "Metalique"] as const;

const TYPE_TOITURE = [
  "Ardoise Naturelle",
  "Ardoise Fibrociment",
  "Tuiles",
  "Tuiles Béton",
  "Acier",
] as const;

const TYPE_FAITAGE = ["Cimente", "En Boîte"] as const;

const CONDITION_TYPES: ConditionType[] = ["Bon", "Moyen", "Mauvais"];

// Interfaces internes

interface LocationModalConfig {
  isOpen: boolean;
  type: "chauffage" | "ventilation";
  title: string;
}

// Valeurs par défaut typées
const defaultIsolation: BaseIsolation = {
  presence: false,
  type: "",
  pose: "",
  epaisseur: 0,
  condition: "Moyen",
};

const defaultCombleIsolation: CombleIsolation = {
  ...defaultIsolation,
  hasCondensation: false,
  condensationLocations: [],
  humidityRate: 0,
  etatCombles: "Moyen",
};
// État initial du formulaire typé
const initialFormData: FormData = {
  typeLogement: "",
  details: {
    beneficiary: {
      firstName: "",
      lastName: "",
      address: "",
      phone: "",
    },
    construction: {
      year: 0,
      area: 0,
      floors: 0,
    },
    rooms: [],
    facades: [{  // Ajoutez cet objet initial
      type: "Enduit",
      thickness: 0,
      lastMaintenance: new Date().toISOString().split('T')[0],
      condition: "Moyen"
    }], 
    electrical: {
      type: "Mono", // ou 'Triphasé', selon vos besoins
      installationYear: 0,
      hasLinky: false,
      upToStandards: false,
      condition: "Moyen", // Ajustez selon vos besoins
    },
    chauffage: {
      types: [],
      nombreRadiateurs: 0,
      localisations: [],
      installationYear: 0,
      condition: "Moyen",
    },
    ventilation: {
      types: [],
      localisations: [],
      installationYear: 0,
      condition: "Moyen",
    },
    isolation: {
      murs: defaultIsolation,
      combles: defaultCombleIsolation,
      sols: defaultIsolation,
    },
    framework: {
      type: "Fermette", // ou 'Traditionnelle' ou 'Metalique'
      hasBeam: false, // Ajustez selon vos besoins
      hadMaintenance: false, // Ajustez selon vos besoins
      maintenanceDate: null, // ou une date par défaut
      condition: "Moyen", // Ajustez selon vos besoins
    },
    roof: {
      type: "Ardoise Naturelle", // ou d'autres types selon vos besoins
      ridgeType: "Cimente", // ou 'En Boîte'
      maintenanceDate: "", // Ajoutez une date par défaut
      maintenanceType: "", // Ajoutez un type d'entretien par défaut
      hasImpurities: false, // Ajustez selon vos besoins
      installationYear: 0, // Année d'installation par défaut
      condition: "Moyen", // Ajustez selon vos besoins
    },
    humidite: {
      condition: "Moyen", // Ajustez selon vos besoins
      tauxParPiece: {}, // Un objet vide ou des valeurs par défaut
    },
    impuretes: {
      condition: "Moyen", // Ajustez selon vos besoins
    },
    securiteIncendie: {
      bouleIncendie: false,
      extincteur: false,
      detecteurFumee: false,
    },
    toiture: {
      condition: "Moyen",
      type: "Ardoise Naturelle",
      ridgeType: "Cimente",
      maintenanceDate: "",
      maintenanceType: "",
      hasImpurities: false,
      installationYear: 0,
    },
    charpente: {
      condition: "Moyen",
      type: "Fermette",
      hasBeam: false,
      hadMaintenance: false,
      maintenanceDate: null,
    },
  },
  evaluations: {
    rooms: {}, // Un objet vide pour les évaluations des pièces, ajustez si nécessaire
    global: {
      score: 0,
      condition: "Correct",
      comment: "",
    }, // Valeurs par défaut pour l'évaluation globale
  },
};
const transformInitialData = (data: Expertise | null): FormData => {
  if (!data) return initialFormData;

  const [firstName = "", lastName = ""] = (data.beneficiaire?.nom || "").split(
    " "
  );

  return {
    typeLogement: data.typeLogement || "",
    details: {
      beneficiary: {
        firstName,
        lastName,
        address: data.beneficiaire?.adresse || "",
        phone: data.beneficiaire?.telephone || "",
      },
      construction: {
        year: data.details?.anneeConstruction || new Date().getFullYear(),
        area: data.details?.superficie || 0,
        floors: data.details?.nombreEtages || 0,
      },
      rooms:
        data.pieces?.map((piece) => ({
          id: piece._id || Date.now().toString(),
          type: piece.type || "",
          name: piece.nom || "",
          floor: piece.etage || 0,
          windows: {
            count: piece.ouvertures?.nombre || 0,
            type: piece.ouvertures?.typeVitrage || "simple",
            installationYear:
              piece.ouvertures?.anneeInstallation || new Date().getFullYear(),
            condition: piece.ouvertures?.etat || "Moyen",
          },
          heating: {
            types: [],
            installationYear: new Date().getFullYear(),
            condition: "Moyen",
          },
          ventilation: [],
          ventilationCondition: "Moyen",
          humidity: piece.humidite?.taux || 0,
          humidityCondition: piece.humidite?.etat || "Moyen",
          condition: {
            windows: "Moyen",
            heating: "Moyen",
            humidity: piece.humidite?.etat || "Moyen",
          },
        })) || [],
      facades: [
        {
          type: data.facade?.type || "Enduit",
          thickness: data.facade?.epaisseurMurs || 0,
          lastMaintenance: new Date(data.facade?.dernierEntretien || Date.now())
            .toISOString()
            .split("T")[0],
          condition: data.facade?.etat || "Moyen",
        },
      ],
      electrical: {
        type: data.tableauElectrique?.type || "Mono",
        installationYear:
          data.tableauElectrique?.anneePose || new Date().getFullYear(),
        hasLinky: data.tableauElectrique?.presenceLinky || false,
        upToStandards: data.tableauElectrique?.auxNormes || false,
        condition: data.tableauElectrique?.etat || "Moyen",
      },
      chauffage: {
        types: data.chauffage?.types || [],
        nombreRadiateurs: data.chauffage?.nombreRadiateurs || 0,
        localisations: data.chauffage?.localisations || [],
        installationYear:
          data.chauffage?.anneeInstallation || new Date().getFullYear(),
        condition: data.chauffage?.etat || "Moyen",
      },
      ventilation: {
        types: data.ventilation?.types || [],
        localisations: data.ventilation?.localisations || [],
        installationYear:
          data.ventilation?.anneePose || new Date().getFullYear(),
        condition: data.ventilation?.etat || "Moyen",
      },
      isolation: {
        combles: {
          presence: data.isolation?.combles?.presence || false,
          type: data.isolation?.combles?.type || "",
          pose: data.isolation?.combles?.pose || "",
          epaisseur: data.isolation?.combles?.epaisseur || 0,
          condition: data.isolation?.combles?.condition || "Moyen",
          hasCondensation: data.isolation?.combles?.hasCondensation || false,
          condensationLocations:
            data.isolation?.combles?.condensationLocations || [],
          humidityRate: data.isolation?.combles?.humidityRate || 0,
          etatCombles: data.isolation?.combles?.etatCombles || "Moyen",
        },
        murs: {
          presence: data.isolation?.murs?.presence || false,
          type: data.isolation?.murs?.type || "",
          pose: data.isolation?.murs?.pose || "",
          epaisseur: data.isolation?.murs?.epaisseur || 0,
          condition: data.isolation?.murs?.condition || "Moyen",
        },
        sols: data.isolation?.sols
          ? {
              presence: data.isolation.sols.presence || false,
              type: data.isolation.sols.type || "",
              pose: data.isolation.sols.pose || "",
              epaisseur: data.isolation.sols.epaisseur || 0,
              condition: data.isolation.sols.condition || "Moyen",
            }
          : undefined,
      },
      framework: {
        type: data.charpente?.type || "Fermette",
        hasBeam: data.charpente?.presenceArtive || false,
        hadMaintenance: data.charpente?.entretienEffectue || false,
        maintenanceDate: data.charpente?.dateEntretien
          ? new Date(data.charpente.dateEntretien).toISOString().split("T")[0]
          : null,
        condition: data.charpente?.etat || "Moyen",
      },
      roof: {
        type: data.toiture?.type || "Ardoise Naturelle",
        ridgeType: data.toiture?.typeFaitage || "Cimente",
        maintenanceDate: new Date(data.toiture?.dateEntretien || Date.now())
          .toISOString()
          .split("T")[0],
        maintenanceType: data.toiture?.typeEntretien || "",
        hasImpurities: data.toiture?.presenceImpuretes || false,
        installationYear: data.toiture?.annee || new Date().getFullYear(),
        condition: data.toiture?.etat || "Moyen",
      },
      humidite: {
        condition: data.humidite?.condition || "Moyen",
        tauxParPiece: data.humidite?.tauxParPiece || {},
      },
      impuretes: {
        condition: data.impuretes?.condition || "Moyen",
      },
      securiteIncendie: {
        bouleIncendie: data.securiteIncendie?.bouleIncendie || false,
        extincteur: data.securiteIncendie?.extincteur || false,
        detecteurFumee: data.securiteIncendie?.detecteurFumee || false,
      },
      toiture: {
        type: data.toiture?.type || "Ardoise Naturelle",
        ridgeType: data.toiture?.typeFaitage || "Cimente",
        maintenanceDate: new Date(data.toiture?.dateEntretien || Date.now())
          .toISOString()
          .split("T")[0],
        maintenanceType: data.toiture?.typeEntretien || "",
        hasImpurities: data.toiture?.presenceImpuretes || false,
        installationYear: data.toiture?.annee || new Date().getFullYear(),
        condition: data.toiture?.etat || "Moyen",
      },
      charpente: {
        type: data.charpente?.type || "Fermette",
        hasBeam: data.charpente?.presenceArtive || false,
        hadMaintenance: data.charpente?.entretienEffectue || false,
        maintenanceDate: data.charpente?.dateEntretien
          ? new Date(data.charpente.dateEntretien).toISOString().split("T")[0]
          : null,
        condition: data.charpente?.etat || "Moyen",
      },
    },
    evaluations: {
      rooms: data.evaluations?.rooms || {},
      global: {
        score: data.evaluations?.global?.score || 0,
        condition: data.evaluations?.global?.condition || "Correct",
        comment: data.evaluations?.global?.comment || "",
      },
    },
  };
};

const ExpertiseForm: React.FC<ExpertiseFormProps> = ({
  isEditing = false,
  initialData,
  onSubmit,
}): React.ReactElement => {
  // États
  const { user, loading: authLoading, getAuthHeaders } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState<boolean>(false);
  const [evaluationScore, setEvaluationScore] = useState<number>(0);
  const [addressSuggestions, setAddressSuggestions] = useState<
    Array<{
      label: string;
      context: string;
    }>
  >([]);
  const [locationModalConfig, setLocationModalConfig] =
    useState<LocationModalConfig | null>(null);

  // Hooks
  const router = useRouter();
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const highlightBg = useColorModeValue("blue.100", "blue.700");
  const normalBg = useColorModeValue("gray.100", "gray.700");
  // Effects
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
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

  // Fonctions de gestion
  const handleInputChange = (path: string, value: unknown): void => {
    setFormData((prev) => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        // Gestion des indices de tableau
        if (key.includes('[')) {
          const [arrayName, indexStr] = key.split('[');
          const index = parseInt(indexStr.replace(']', ''));
          if (!current[arrayName]) {
            current[arrayName] = [];
          }
          if (!current[arrayName][index]) {
            current[arrayName][index] = {};
          }
          current = current[arrayName][index];
          continue;
        }
        
        // Création du chemin s'il n'existe pas
        if (!(key in current)) {
          current[key] = {};
        }
        current[key] = { ...current[key] };
        current = current[key];
      }
  
      const lastKey = keys[keys.length - 1];
      // Si le dernier niveau n'existe pas, on le crée
      if (typeof current !== 'object' || current === null) {
        current = {};
      }
      current[lastKey] = value;
      
      return newData;
    });
  };

  const handleTypeLogementSelect = (type: "maison" | "appartement"): void => {
    handleInputChange("typeLogement", type);
  };

  const handleLocationSelect = (roomId: string) => {
    if (!locationModalConfig) return;

    setFormData((prev) => ({
      ...prev,
      details: {
        ...prev.details,
        [locationModalConfig.type]: {
          ...prev.details[locationModalConfig.type],
          localisations: prev.details[
            locationModalConfig.type
          ].localisations.includes(roomId)
            ? prev.details[locationModalConfig.type].localisations.filter(
                (id) => id !== roomId
              )
            : [...prev.details[locationModalConfig.type].localisations, roomId],
        },
      },
    }));
  };

  const handleRoomUpdate = (
    index: number,
    field: string,
    value: unknown
  ): void => {
    setFormData((prev) => {
      const newRooms = [...prev.details.rooms];
      if (field.includes(".")) {
        const [mainField, subField] = field.split(".");
        newRooms[index] = {
          ...newRooms[index],
          [mainField]: {
            ...(newRooms[index][mainField as keyof Room] as any),
            [subField]: value,
          },
        };
      } else {
        newRooms[index] = {
          ...newRooms[index],
          [field]: value,
        };
      }
      return {
        ...prev,
        details: {
          ...prev.details,
          rooms: newRooms,
        },
      };
    });
  };

  const addRoom = (): void => {
    setFormData((prev) => ({
      ...prev,
      details: {
        ...prev.details,
        rooms: [
          {
            id: Date.now().toString(),
            type: "",
            name: "",
            floor: 0,
            humidity: 0,
            humidityCondition: "Moyen",
            windows: {
              count: 0,
              type: "simple",
              installationYear: new Date().getFullYear(),
              condition: "Moyen",
            },
            condition: {
              windows: "Moyen",
              heating: "Moyen",
              humidity: "Moyen",
            },
            ventilation: [],
            ventilationCondition: "Moyen",
          },
          ...prev.details.rooms,
        ],
      },
    }));
  };

  const removeRoom = (index: number): void => {
    setFormData((prev) => {
      const newRooms = prev.details.rooms.filter((_, i) => i !== index);
      const hasBasement = newRooms.some((room) => room.type === "Sous-sol");

      if (!hasBasement) {
        return {
          ...prev,
          details: {
            ...prev.details,
            rooms: newRooms,
            isolation: {
              ...prev.details.isolation,
              sols: undefined,
            },
          },
        };
      }

      return {
        ...prev,
        details: {
          ...prev.details,
          rooms: newRooms,
        },
      };
    });
  };

  const handleWindowsUpdate = (
    index: number,
    field: string,
    value: unknown
  ): void => {
    handleRoomUpdate(index, `windows.${field}`, value);
  };

  const handleHeatingUpdate = (
    index: number,
    field: string,
    value: unknown
  ): void => {
    handleRoomUpdate(index, `heating.${field}`, value);
  };

  const handleVentilationUpdate = (
    index: number,
    ventilationType: VentilationType, // Changez le type ici
    isChecked: boolean
  ): void => {
    setFormData((prev) => {
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
        ventilation: currentVentilation,
      };

      return {
        ...prev,
        details: {
          ...prev.details,
          rooms: newRooms,
        },
      };
    });
  };
  const handleConditionUpdate = (
    index: number,
    field: string,
    condition: ConditionType
  ): void => {
    setFormData((prev) => {
      const newRooms = [...prev.details.rooms];

      // Cas spéciaux pour windows et heating qui ont leur condition dans un sous-objet
      if (field === "windows" || field === "heating") {
        newRooms[index] = {
          ...newRooms[index],
          condition: {
            ...newRooms[index].condition,
            [field]: condition,
          },
        };
      } else {
        // Pour les champs qui utilisent directement xxxCondition
        newRooms[index] = {
          ...newRooms[index],
          [`${field}Condition`]: condition,
        };
      }

      return {
        ...prev,
        details: {
          ...prev.details,
          rooms: newRooms,
        },
      };
    });
  };

  const fetchAddressSuggestions = async (input: string): Promise<void> => {
    if (input.length > 2) {
      try {
        const headers = getAuthHeaders();
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
            input
          )}&limit=5`,
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
        console.error("Erreur:", error);
        setAddressSuggestions([]);
      }
    } else {
      setAddressSuggestions([]);
    }
  };

  const handleIsolationUpdate = (
    area: "combles" | "murs" | "sols",
    field: string,
    value: unknown
  ): void => {
    handleInputChange(`details.isolation.${area}.${field}`, value);
  };

  // Fonctions de calcul du score
  const calculateScoreFromCondition = (condition: ConditionType): number => {
    switch (condition) {
      case "Bon":
        return 5;
      case "Moyen":
        return 3;
      case "Mauvais":
        return 1;
      default:
        return 3;
    }
  };

  const calculateNewScore = (): void => {
    const scores: number[] = [];

    // Score des pièces
    formData.details.rooms.forEach((room) => {
      if (room.condition.windows !== "Moyen")
        scores.push(calculateScoreFromCondition(room.condition.windows));
      if (room.condition.heating !== "Moyen")
        scores.push(calculateScoreFromCondition(room.condition.heating));
      if (room.humidityCondition !== "Moyen")
        scores.push(calculateScoreFromCondition(room.humidityCondition));
    });

    // Score des éléments généraux
    scores.push(
      calculateScoreFromCondition(formData.details.chauffage.condition)
    );
    scores.push(
      calculateScoreFromCondition(formData.details.ventilation.condition)
    );
    scores.push(
      calculateScoreFromCondition(formData.details.humidite.condition)
    );
    scores.push(
      calculateScoreFromCondition(formData.details.impuretes.condition)
    );
    scores.push(
      calculateScoreFromCondition(formData.details.facades[0].condition)
    );
    scores.push(calculateScoreFromCondition(formData.details.roof.condition));
    scores.push(
      calculateScoreFromCondition(formData.details.framework.condition)
    );
    scores.push(
      calculateScoreFromCondition(formData.details.electrical.condition)
    );

    // Score des isolations
    if (formData.details.isolation.combles.presence) {
      scores.push(
        calculateScoreFromCondition(
          formData.details.isolation.combles.condition
        )
      );
    }
    if (formData.details.isolation.murs.presence) {
      scores.push(
        calculateScoreFromCondition(formData.details.isolation.murs.condition)
      );
    }
    if (formData.details.isolation.sols?.presence) {
      scores.push(
        calculateScoreFromCondition(formData.details.isolation.sols.condition)
      );
    }

    const newScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    setEvaluationScore(newScore);

    // Détermination de la condition globale
    const condition =
      newScore >= 4 ? "Favorable" : newScore >= 2.5 ? "Correct" : "Critique";

    handleInputChange("evaluations.global", {
      score: newScore,
      condition,
      comment: generateGlobalComment(newScore),
    });
  };

  const generateGlobalComment = (score: number): string => {
    let comment = "";
    if (score >= 4) {
      comment =
        "L'état général du bâtiment est très satisfaisant. Les installations sont bien entretenues et performantes.";
    } else if (score >= 2.5) {
      comment =
        "L'état général du bâtiment est correct mais nécessite quelques améliorations ciblées pour optimiser son confort et ses performances.";
    } else {
      comment =
        "L'état général du bâtiment nécessite des travaux de rénovation importants. Une intervention est recommandée pour améliorer le confort et l'efficacité énergétique.";
    }

    const hasFireProtection =
      formData.details.securiteIncendie.bouleIncendie ||
      formData.details.securiteIncendie.extincteur ||
      formData.details.securiteIncendie.detecteurFumee;

    if (!hasFireProtection) {
      comment +=
        "\n\nATTENTION : Le logement ne dispose d'aucune protection incendie. Une mise en conformité rapide est fortement recommandée !";
    }

    return comment;
  };

  // Composant StateSelector
  const StateSelector: React.FC<StateSelectorProps> = ({
    label = "",
    currentValue,
    onChange,
    description = "",
    mb = 6,
    fieldId,
  }) => {
    const inputGroupId = `${fieldId}-group`;

    return (
      <Box width="100%" mb={mb} p={4} borderWidth="1px" borderRadius="md">
        {label && (
          <Text fontWeight="bold" fontSize="lg" mb={2}>
            {label}
          </Text>
        )}
        {description && (
          <Text fontSize="sm" color="gray.600" mb={4}>
            {description}
          </Text>
        )}
        <FormControl>
          <RadioGroup value={currentValue} onChange={onChange}>
            <Stack direction={{ base: "column", sm: "row" }} spacing={4}>
              {CONDITION_TYPES.map((conditionType) => (
                <Radio
                  key={`${fieldId}-${conditionType}`}
                  value={conditionType}
                  size="lg"
                  colorScheme={
                    conditionType === "Bon"
                      ? "green"
                      : conditionType === "Moyen"
                      ? "yellow"
                      : "red"
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

  // Modales
  const LocationSelectionModal: React.FC<LocationSelectionModalProps> = ({
    isOpen,
    onClose,
    title,
    type,
    localisations,
  }) => (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch">
            {formData.details.rooms.map((room) => (
              <Checkbox
                key={room.id}
                isChecked={localisations.includes(room.id)}
                onChange={() => handleLocationSelect(room.id)}
              >
                {room.name ||
                  `${room.type} ${
                    room.floor > 0 ? `(Étage ${room.floor})` : "(RDC)"
                  }`}
              </Checkbox>
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Fermer</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  const validateExpertiseData = (
    formData: FormData
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validation de base
    if (!formData.typeLogement) errors.push("Le type de logement est requis");

    // Validation du bénéficiaire
    if (!formData.details.beneficiary.firstName)
      errors.push("Le prénom du bénéficiaire est requis");
    if (!formData.details.beneficiary.lastName)
      errors.push("Le nom du bénéficiaire est requis");
    if (!formData.details.beneficiary.address)
      errors.push("L'adresse est requise");
    if (!formData.details.beneficiary.phone)
      errors.push("Le téléphone est requis");

    // Validation de la construction
    if (!formData.details.construction.year)
      errors.push("L'année de construction est requise");
    if (formData.details.construction.area <= 0)
      errors.push("La superficie doit être supérieure à 0");
    if (formData.details.construction.floors < 0)
      errors.push("Le nombre d'étages ne peut pas être négatif");

    // Validation des pièces
    if (formData.details.rooms.length === 0) {
      errors.push("Au moins une pièce est requise");
    }

    formData.details.rooms.forEach((room, index) => {
      if (!room.type)
        errors.push(`Le type de la pièce ${index + 1} est requis`);
      if (!room.name) errors.push(`Le nom de la pièce ${index + 1} est requis`);
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  };
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      calculateNewScore();

      const validation = validateExpertiseData(formData);
      if (!validation.isValid) {
        throw new Error(`Validation échouée: ${validation.errors.join(", ")}`);
      }

      // Helper pour convertir les dates en timestamps
      const dateToTimestamp = (dateString: string): number => {
        return new Date(dateString).getTime();
      };

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
        // Ajout des champs requis manquants
        ouvertures: {
          nombre: formData.details.rooms[0]?.windows?.count || 0,
          typeVitrage: formData.details.rooms[0]?.windows?.type || 'simple',
          etat: formData.details.rooms[0]?.windows?.condition || 'Moyen',
          anneeInstallation: formData.details.rooms[0]?.windows?.installationYear || new Date().getFullYear()
        },
        humidite: {
          taux: 0, // Valeur par défaut
          etat: "Moyen", // Valeur par défaut
        },
        isolation: {
          combles: {
            ...formData.details.isolation.combles,
            etat: formData.details.isolation.combles.condition || 'Moyen',
            etatCombles: formData.details.isolation.combles.etatCombles || 'Moyen',
            tauxHumiditeCombles: formData.details.isolation.combles.humidityRate || 0,
            presenceCondensation: formData.details.isolation.combles.hasCondensation || false
          },
          murs: {
            ...formData.details.isolation.murs,
            etat: formData.details.isolation.murs.condition || 'Moyen'
          }
        },
        toiture: {
          type: formData.details.roof.type,           // Changement de roof à toiture
    typeFaitage: formData.details.roof.ridgeType,
    dateEntretien: new Date(formData.details.roof.maintenanceDate).getTime(),
    typeEntretien: formData.details.roof.maintenanceType || '',
    presenceImpuretes: formData.details.roof.hasImpurities,
    annee: formData.details.roof.installationYear || new Date().getFullYear(),
    etat: formData.details.roof.condition
        },

  charpente: {
    type: formData.details.framework.type,         // Changement de framework à charpente
    presenceArtive: formData.details.framework.hasBeam,
    entretienEffectue: formData.details.framework.hadMaintenance,
    dateEntretien: formData.details.framework.maintenanceDate 
      ? new Date(formData.details.framework.maintenanceDate).getTime()
      : null,
    etat: formData.details.framework.condition
  },
        pieces: formData.details.rooms.map(room => ({
          nom: room.name,
          type: room.type,
          etage: room.floor,
          ouvertures: {
            nombre: room.windows.count,
            typeVitrage: room.windows.type,
            etat: room.condition.windows,
            anneeInstallation: room.windows.installationYear
          },
          humidite: {
            taux: room.humidity,
            etat: room.condition.humidity
          }
        })),
        chauffage: {
          types: formData.details.chauffage.types,
          nombreRadiateurs: formData.details.chauffage.nombreRadiateurs,
          localisations: formData.details.chauffage.localisations,
          etat: formData.details.chauffage.condition,
          anneeInstallation: formData.details.chauffage.installationYear
        },
        facade: {
          type: formData.details.facades[0].type,
          epaisseurMurs: Number(formData.details.facades[0].thickness),
          dernierEntretien: new Date(formData.details.facades[0].lastMaintenance).getTime(),
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
          types: formData.details.ventilation.types,
          localisations: formData.details.ventilation.localisations,
          ventilationNaturelle: true,
          anneePose: formData.details.ventilation.installationYear,
          etat: formData.details.ventilation.condition
        },
        evaluations: {
          rooms: formData.evaluations.rooms,
          global: {
            score: evaluationScore,
            condition: formData.evaluations.global.condition,
            comment: formData.evaluations.global.comment
          }
        },
        securiteIncendie: {
          bouleIncendie: formData.details.securiteIncendie.bouleIncendie,
          extincteur: formData.details.securiteIncendie.extincteur,
          detecteurFumee: formData.details.securiteIncendie.detecteurFumee
        },
        status: 'En cours' as ExpertiseStatus
      };

      const headers = getAuthHeaders();
      const response = await fetch(
        isEditing && initialData?._id
          ? `/api/expertises/${initialData._id}`
          : "/api/expertises",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(expertiseData),
        }
      );

      if (!response.ok) {
        throw new Error(
          isEditing
            ? "Erreur lors de la mise à jour"
            : "Erreur lors de la création"
        );
      }

      if (onSubmit) {
        await onSubmit(formData);
      }

      toast({
        title: "Succès",
        description: `L'expertise a été ${
          isEditing ? "modifiée" : "créée"
        } avec succès`,
        status: "success",
        duration: 3000,
      });

      router.push("/expertises");
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error ? error.message : "Une erreur est survenue",
        status: "error",
        duration: 3000,
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
                    color={
                      formData.typeLogement === "maison"
                        ? "blue.500"
                        : "gray.500"
                    }
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
                bg={
                  formData.typeLogement === "appartement"
                    ? highlightBg
                    : normalBg
                }
                onClick={() => handleTypeLogementSelect("appartement")}
                _hover={{ transform: "scale(1.02)", borderColor: "blue.500" }}
                transition="all 0.2s"
              >
                <VStack spacing={4}>
                  <Icon
                    as={FaBuilding}
                    w={16}
                    h={16}
                    color={
                      formData.typeLogement === "appartement"
                        ? "blue.500"
                        : "gray.500"
                    }
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
        
              <FormControl isRequired position="relative">
                <FormLabel>Adresse</FormLabel>
                <Input
                  value={formData.details.beneficiary.address}
                  onChange={(e) => {
                    handleInputChange("details.beneficiary.address", e.target.value);
                    fetchAddressSuggestions(e.target.value);
                  }}
                  placeholder="Adresse complète"
                />
                {addressSuggestions.length > 0 && (
                  <Box
                    position="absolute"
                    zIndex={1}
                    bg="white"
                    width="100%"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    mt={2}
                    maxH="200px"
                    overflowY="auto"
                  >
                    {addressSuggestions.map((suggestion, index) => (
                      <Box
                        key={index}
                        p={2}
                        cursor="pointer"
                        _hover={{ bg: "gray.100" }}
                        onClick={() => {
                          handleInputChange(
                            "details.beneficiary.address",
                            suggestion.label
                          );
                          setAddressSuggestions([]);
                        }}
                      >
                        <Text>{suggestion.label}</Text>
                        <Text fontSize="sm" color="gray.600">
                          {suggestion.context}
                        </Text>
                      </Box>
                    ))}
                  </Box>
                )}
              </FormControl>
        
              <FormControl isRequired>
                <FormLabel>Téléphone</FormLabel>
                <PhoneInput
                  country={"fr"}
                  value={formData.details.beneficiary.phone}
                  onChange={(phone) =>
                    handleInputChange("details.beneficiary.phone", phone)
                  }
                  inputStyle={{ width: "100%" }}
                  specialLabel=""
                />
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
                  onClick={() => {
                    const newRoom: Room = {
                      id: Date.now().toString(),
                      type: "",
                      name: "",
                      floor: 0,
                      humidity: 0,
                      humidityCondition: "Moyen",
                      windows: {
                        count: 0,
                        type: "simple",
                        installationYear: new Date().getFullYear(),
                        condition: "Moyen"
                      },
                      condition: {
                        windows: "Moyen",
                        heating: "Moyen",
                        humidity: "Moyen"
                      },
                      ventilation: [],
                      ventilationCondition: "Moyen"
                    };
        
                    setFormData((prev) => ({
                      ...prev,
                      details: {
                        ...prev.details,
                        rooms: [newRoom, ...prev.details.rooms]
                      }
                    }));
                  }}
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
                            onChange={(e) => {
                              handleRoomUpdate(index, "type", e.target.value);
                              // Mise à jour automatique du nom si pas déjà défini
                              if (!room.name || room.name === "") {
                                const newType = e.target.value;
                                const sameTypeCount = formData.details.rooms.filter(
                                  (r) => r.type === newType
                                ).length;
                                const newName = sameTypeCount > 0 ? `${newType} ${sameTypeCount + 1}` : newType;
                                handleRoomUpdate(index, "name", newName);
                              }
                            }}
                          >
                            <option value="">Sélectionnez un type</option>
                            {ROOM_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </Select>
                        </FormControl>
        
                        <FormControl isRequired>
                          <FormLabel>Nom de la pièce</FormLabel>
                          <Input
                            value={room.name}
                            onChange={(e) => handleRoomUpdate(index, "name", e.target.value)}
                            placeholder={room.type ? `${room.type}` : "Nom de la pièce"}
                          />
                        </FormControl>
        
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
                          handleRoomUpdate(
                            index,
                            "windows.count",
                            parseInt(value)
                          )
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
                              handleRoomUpdate(index, "windows.type", value)
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
                              handleRoomUpdate(
                                index,
                                "windows.installationYear",
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
            <Heading size="md">Configuration du chauffage général</Heading>
            <Card width="100%">
              <CardBody>
                <VStack spacing={6}>
                  <FormControl>
                    <FormLabel>Types de chauffage principal</FormLabel>
                    <Stack>
                      {HEATING_TYPES.map((type) => (
                        <Checkbox
                          key={type}
                          isChecked={formData.details.chauffage.types.includes(
                            type
                          )}
                          onChange={(e) => {
                            const types = e.target.checked
                              ? [...formData.details.chauffage.types, type]
                              : formData.details.chauffage.types.filter(
                                  (t) => t !== type
                                );
                            handleInputChange("details.chauffage.types", types);
                          }}
                        >
                          {type}
                        </Checkbox>
                      ))}
                    </Stack>
                  </FormControl>

                  <FormControl>
                    <FormLabel>
                      Nombre total de radiateurs/convecteurs
                    </FormLabel>
                    <NumberInput
                      min={0}
                      value={formData.details.chauffage.nombreRadiateurs}
                      onChange={(value) =>
                        handleInputChange(
                          "details.chauffage.nombreRadiateurs",
                          parseInt(value)
                        )
                      }
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>

                  {formData.details.chauffage.nombreRadiateurs > 0 && (
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={2}>
                        Option : Vous pouvez préciser la localisation des
                        radiateurs
                      </Text>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setLocationModalConfig({
                            isOpen: true,
                            type: "chauffage",
                            title: "Localisation des radiateurs",
                          });
                        }}
                      >
                        Préciser les localisations (optionnel)
                      </Button>
                    </Box>
                  )}

                  {formData.details.chauffage.localisations.length > 0 && (
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        Pièces équipées :
                      </Text>
                      <Wrap>
                        {formData.details.chauffage.localisations.map(
                          (roomId) => {
                            const room = formData.details.rooms.find(
                              (r) => r.id === roomId
                            );
                            return (
                              <WrapItem key={roomId}>
                                <Badge colorScheme="blue">
                                  {room?.name || room?.type}
                                </Badge>
                              </WrapItem>
                            );
                          }
                        )}
                      </Wrap>
                    </Box>
                  )}

                  <FormControl>
                    <FormLabel>Année d'installation</FormLabel>
                    <NumberInput
                      min={1950}
                      max={new Date().getFullYear()}
                      value={formData.details.chauffage.installationYear}
                      onChange={(value) =>
                        handleInputChange(
                          "details.chauffage.installationYear",
                          parseInt(value)
                        )
                      }
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>
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
                  <FormControl>
                    <FormLabel>Présence d'isolation</FormLabel>
                    <RadioGroup
                      value={
                        formData.details.isolation.combles.presence
                          ? "oui"
                          : "non"
                      }
                      onChange={(value) =>
                        handleInputChange(
                          "details.isolation.combles.presence",
                          value === "oui"
                        )
                      }
                    >
                      <Stack direction="row">
                        <Radio value="oui">Oui</Radio>
                        <Radio value="non">Non</Radio>
                      </Stack>
                    </RadioGroup>
                  </FormControl>

                  {formData.details.isolation.combles.presence && (
                    <>
                      <FormControl>
                        <FormLabel>Type d'isolation</FormLabel>
                        <Select
                          value={formData.details.isolation.combles.type}
                          onChange={(e) =>
                            handleInputChange(
                              "details.isolation.combles.type",
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

                      <FormControl>
                        <FormLabel>Type de pose</FormLabel>
                        <Select
                          value={formData.details.isolation.combles.pose}
                          onChange={(e) =>
                            handleInputChange(
                              "details.isolation.combles.pose",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Sélectionnez un type</option>
                          {TYPE_ISOLATION_POSE.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Épaisseur (cm)</FormLabel>
                        <NumberInput
                          min={0}
                          value={formData.details.isolation.combles.epaisseur}
                          onChange={(value) =>
                            handleInputChange(
                              "details.isolation.combles.epaisseur",
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

            {/* Isolation des murs */}
            <Card width="100%">
              <CardHeader>
                <Heading size="sm">Isolation des murs</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel>Présence d'isolation</FormLabel>
                    <RadioGroup
                      value={
                        formData.details.isolation.murs.presence ? "oui" : "non"
                      }
                      onChange={(value) =>
                        handleInputChange(
                          "details.isolation.murs.presence",
                          value === "oui"
                        )
                      }
                    >
                      <Stack direction="row">
                        <Radio value="oui">Oui</Radio>
                        <Radio value="non">Non</Radio>
                      </Stack>
                    </RadioGroup>
                  </FormControl>

                  {formData.details.isolation.murs.presence && (
                    <>
                      <FormControl>
                        <FormLabel>Type d'isolation</FormLabel>
                        <Select
                          value={formData.details.isolation.murs.type}
                          onChange={(e) =>
                            handleInputChange(
                              "details.isolation.murs.type",
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

                      <FormControl>
                        <FormLabel>Type de pose</FormLabel>
                        <Select
                          value={formData.details.isolation.murs.pose}
                          onChange={(e) =>
                            handleInputChange(
                              "details.isolation.murs.pose",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Sélectionnez un type</option>
                          {TYPE_ISOLATION_POSE.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Épaisseur (cm)</FormLabel>
                        <NumberInput
                          min={0}
                          value={formData.details.isolation.murs.epaisseur}
                          onChange={(value) =>
                            handleInputChange(
                              "details.isolation.murs.epaisseur",
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

            {/* Isolation du sol - Uniquement si sous-sol présent */}
            {formData.details.rooms.some(
              (room) => room.type === "Sous-sol"
            ) && (
              <Card width="100%">
                <CardHeader>
                  <Heading size="sm">Isolation du Sous-Sol</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel>Présence d'isolation</FormLabel>
                      <RadioGroup
                        value={
                          formData.details.isolation.sols?.presence
                            ? "oui"
                            : "non"
                        }
                        onChange={(value) =>
                          handleInputChange(
                            "details.isolation.sols.presence",
                            value === "oui"
                          )
                        }
                      >
                        <Stack direction="row">
                          <Radio value="oui">Oui</Radio>
                          <Radio value="non">Non</Radio>
                        </Stack>
                      </RadioGroup>
                    </FormControl>

                    {formData.details.isolation.sols?.presence && (
                      <>
                        <FormControl>
                          <FormLabel>Type d'isolation</FormLabel>
                          <Select
                            value={formData.details.isolation.sols.type}
                            onChange={(e) =>
                              handleInputChange(
                                "details.isolation.sols.type",
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

                        <FormControl>
                          <FormLabel>Type de pose</FormLabel>
                          <Select
                            value={formData.details.isolation.sols?.type || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "details.isolation.sols.pose",
                                e.target.value
                              )
                            }
                          >
                            <option value="">Sélectionnez un type</option>
                            {TYPE_ISOLATION_POSE.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Épaisseur (cm)</FormLabel>
                          <NumberInput
                            min={0}
                            value={
                              formData.details.isolation.sols?.epaisseur || 0
                            }
                            onChange={(value) =>
                              handleInputChange(
                                "details.isolation.sols.epaisseur",
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
            )}
          </VStack>
        );

      case 8:
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
                    <Stack>
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
            <Card width="100%">
              <CardBody>
                <VStack spacing={6}>
                  <FormControl>
                    <FormLabel>Types de ventilation</FormLabel>
                    <Stack>
                      {VENTILATION_TYPES.map((type) => (
                        <Checkbox
                          key={type}
                          isChecked={formData.details.ventilation.types.includes(
                            type
                          )}
                          onChange={(e) => {
                            const types = e.target.checked
                              ? [
                                  ...formData.details.ventilation.types,
                                  type as VentilationType,
                                ]
                              : formData.details.ventilation.types.filter(
                                  (t) => t !== type
                                );
                            handleInputChange(
                              "details.ventilation.types",
                              types
                            );
                          }}
                        >
                          {type}
                        </Checkbox>
                      ))}
                    </Stack>
                  </FormControl>

                  {formData.details.ventilation.types.length > 0 && (
                    <>
                      <Box>
                        <Text fontSize="sm" color="gray.500" mb={2}>
                          Option : Vous pouvez préciser la localisation de la
                          ventilation
                        </Text>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setLocationModalConfig({
                              isOpen: true,
                              type: "ventilation",
                              title: "Localisation de la ventilation",
                            });
                          }}
                        >
                          Préciser les localisations (optionnel)
                        </Button>
                      </Box>

                      {formData.details.ventilation.localisations.length >
                        0 && (
                        <Box>
                          <Text fontWeight="bold" mb={2}>
                            Pièces équipées :
                          </Text>
                          <Wrap>
                            {formData.details.ventilation.localisations.map(
                              (roomId) => {
                                const room = formData.details.rooms.find(
                                  (r) => r.id === roomId
                                );
                                return (
                                  <WrapItem key={roomId}>
                                    <Badge colorScheme="blue">
                                      {room?.name || room?.type}
                                    </Badge>
                                  </WrapItem>
                                );
                              }
                            )}
                          </Wrap>
                        </Box>
                      )}

                      <FormControl>
                        <FormLabel>Année d'installation</FormLabel>
                        <NumberInput
                          min={1950}
                          max={new Date().getFullYear()}
                          value={formData.details.ventilation.installationYear}
                          onChange={(value) =>
                            handleInputChange(
                              "details.ventilation.installationYear",
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
          </VStack>
        );

      case 10:
        return (
          <VStack spacing={6}>
            <Heading size="md">Configuration de la charpente</Heading>
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
                      {TYPE_CHARPENTE.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
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
                      {TYPE_TOITURE.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
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
                          <Radio key={type} value={type}>
                            {type}
                          </Radio>
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
          return (
            <VStack spacing={6}>
              <Heading size="md">État détaillé par pièce et éléments généraux</Heading>
        
              {/* Évaluation par pièce */}
              {formData.details.rooms.map((room, index) => (
                <Card key={room.id} width="100%">
                  <CardHeader>
                    <Heading size="sm">
                      {room.name || `${room.type} ${index + 1}`}
                      {room.floor > 0 ? ` (Étage ${room.floor})` : " (RDC)"}
                    </Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4}>
                      {/* État des ouvertures */}
                      {room.windows.count > 0 && (
                        <StateSelector
                          label={`État des ouvertures (${room.windows.count} ${
                            room.windows.count > 1 ? "ouvertures" : "ouverture"
                          })`}
                          currentValue={room.condition.windows}
                          onChange={(value) =>
                            handleConditionUpdate(index, "windows", value)
                          }
                          fieldId={`${room.id}-windows-state`}
                        />
                      )}
        
                      {/* État du chauffage si la pièce est équipée */}
                      {formData.details.chauffage.localisations.includes(room.id) && (
                        <StateSelector
                          label="État du chauffage"
                          currentValue={room.condition.heating}
                          onChange={(value) =>
                            handleConditionUpdate(index, "heating", value)
                          }
                          fieldId={`${room.id}-heating-state`}
                        />
                      )}
        
                      {/* État de l'humidité */}
                      <StateSelector
                        label="État de l'humidité"
                        currentValue={room.humidityCondition}
                        onChange={(value) =>
                          handleConditionUpdate(index, "humidity", value)
                        }
                        fieldId={`${room.id}-humidity-state`}
                        description="Évaluation de l'humidité dans la pièce"
                      />
                    </VStack>
                  </CardBody>
                </Card>
              ))}
        
              {/* État général de la maison et de ses installations */}
              <Card width="100%">
                <CardHeader>
                  <Heading size="sm">
                    État Général de la maison et de ses installations
                  </Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={6}>
                    {/* État de l'humidité générale */}
                    <StateSelector
                      label="État de l'humidité générale"
                      currentValue={formData.details.humidite.condition}
                      onChange={(value) =>
                        handleInputChange("details.humidite.condition", value)
                      }
                      fieldId="humidity-walls-state"
                    />
        
                    {/* État des impuretés */}
                    <StateSelector
                      label="État des impuretés"
                      currentValue={formData.details.impuretes.condition}
                      onChange={(value) =>
                        handleInputChange("details.impuretes.condition", value)
                      }
                      fieldId="impurities-state"
                    />
        
                    {/* État de la façade */}
                    <StateSelector
                      label="État de la façade"
                      currentValue={formData.details.facades[0].condition}
                      onChange={(value) =>
                        handleInputChange("details.facades[0].condition", value)
                      }
                      fieldId="facade-state"
                    />
        
                    {/* État de la toiture */}
                    <StateSelector
                      label="État de la toiture"
                      currentValue={formData.details.toiture.condition}
                      onChange={(value) =>
                        handleInputChange("details.toiture.condition", value)
                      }
                      fieldId="roof-state"
                    />
        
                    {/* État de la charpente */}
                    <StateSelector
                      label="État de la charpente"
                      currentValue={formData.details.charpente.condition}
                      onChange={(value) =>
                        handleInputChange("details.charpente.condition", value)
                      }
                      fieldId="framework-state"
                    />
        
                    {/* État de la ventilation */}
                    <StateSelector
                      label="État de la ventilation"
                      currentValue={formData.details.ventilation.condition}
                      onChange={(value) =>
                        handleInputChange("details.ventilation.condition", value)
                      }
                      fieldId="ventilation-state"
                    />
        
                    {/* État des normes électriques */}
                    <StateSelector
                      label="État des normes électriques"
                      currentValue={formData.details.electrical.condition}
                      onChange={(value) =>
                        handleInputChange("details.electrical.condition", value)
                      }
                      fieldId="electrical-state"
                    />
        
                    {/* État des combles */}
                    <StateSelector
                      label="État des combles"
                      currentValue={formData.details.isolation.combles.condition}
                      onChange={(value) =>
                        handleInputChange(
                          "details.isolation.combles.condition",
                          value
                        )
                      }
                      fieldId="combles-state"
                    />
        
                    {/* Protection incendie */}
                    <Box width="100%" p={4} borderWidth="1px" borderRadius="md">
                      <Text fontWeight="bold" fontSize="lg" mb={4}>
                        Protection incendie
                      </Text>
                      <Stack spacing={3}>
                        <Checkbox
                          isChecked={formData.details.securiteIncendie.bouleIncendie}
                          onChange={(e) =>
                            handleInputChange(
                              "details.securiteIncendie.bouleIncendie",
                              e.target.checked
                            )
                          }
                        >
                          Boule incendie
                        </Checkbox>
                        <Checkbox
                          isChecked={formData.details.securiteIncendie.extincteur}
                          onChange={(e) =>
                            handleInputChange(
                              "details.securiteIncendie.extincteur",
                              e.target.checked
                            )
                          }
                        >
                          Extincteur
                        </Checkbox>
                        <Checkbox
                          isChecked={formData.details.securiteIncendie.detecteurFumee}
                          onChange={(e) =>
                            handleInputChange(
                              "details.securiteIncendie.detecteurFumee",
                              e.target.checked
                            )
                          }
                        >
                          Détecteur de fumée
                        </Checkbox>
                      </Stack>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          );
      case 13:
        return (
          <VStack spacing={6}>
            <Heading size="md">Résumé et évaluation globale</Heading>

            {/* Score global */}
            <Card width="100%">
              <CardHeader>
                <Heading size="sm">Score global</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  <Box width="100%">
                    <Text fontSize="xl" mb={2}>
                      Score global : {evaluationScore.toFixed(1)}/5
                    </Text>
                    <Progress
                      value={evaluationScore * 20}
                      size="lg"
                      colorScheme={
                        evaluationScore >= 4
                          ? "green"
                          : evaluationScore >= 2.5
                          ? "yellow"
                          : "red"
                      }
                    />
                  </Box>

                  <Box width="100%" p={4} bg="gray.50" borderRadius="md">
                    <Text fontWeight="bold" mb={2}>
                      État général :
                    </Text>
                    <Text>{formData.evaluations.global.comment}</Text>
                  </Box>

                  {!formData.details.securiteIncendie.bouleIncendie &&
                    !formData.details.securiteIncendie.extincteur &&
                    !formData.details.securiteIncendie.detecteurFumee && (
                      <Alert status="error">
                        <AlertIcon />
                        <AlertTitle>Attention !</AlertTitle>
                        <AlertDescription>
                          Le logement ne dispose d'aucune protection incendie.
                          Une mise en conformité rapide est fortement
                          recommandée !
                        </AlertDescription>
                      </Alert>
                    )}
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        );

      default:
        return null;
    }
  };

  // Rendu du composant principal
  return (
    <Box maxW="1200px" mx="auto" p={4}>
      <VStack spacing={8}>
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

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          {renderStep()}

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

        {/* Modale de sélection des localisations */}
        {locationModalConfig && (
          <LocationSelectionModal
            isOpen={locationModalConfig.isOpen}
            onClose={() => setLocationModalConfig(null)}
            type={locationModalConfig.type}
            title={locationModalConfig.title}
            localisations={
              formData.details[locationModalConfig.type].localisations
            }
          />
        )}
      </VStack>
    </Box>
  );
};

export default ExpertiseForm;
