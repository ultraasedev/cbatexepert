// types/index.ts

export type UserRole = 'admin' | 'user';

// Interface User
export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

// Interfaces communes
export interface Beneficiary {
  name: string;
  address: string;
  phone: string;
}

// Types de base
export type ExpertiseStatus = 'En cours' | 'Terminé';
export type ConditionType = 'Bon' | 'Moyen' | 'Mauvais';
export type GlobalConditionType = 'Favorable' | 'Correct' | 'Critique';

// Types pour les valeurs spécifiques
export type HeatingType = 'Électrique' | 'Gaz' | 'Fioul' | 'Bois' | 'Poêle' | 'Pac';
export type VentilationType = 'VMC Simple flux' | 'Double Flux' | 'VMI' | 'VPH';
export type IsolationType = 'Ouate de cellulose' | 'Laine de Roche' | 'Laine de Verre' | 'Isolation Minerales';
export type IsolationPose = 'Sous rampants' | 'En soufflage' | 'En rouleau';

// Interface pour le sélecteur d'état
export interface StateSelectorProps {
  label?: string;
  currentValue: ConditionType;
  onChange: (value: ConditionType) => void;
  description?: string;
  mb?: number | string;
  fieldId: string;
}

// Interfaces pour les expertises
export interface RoomEvaluation {
  windows?: number;
  heating?: number;
  humidity?: number;
  ventilation?: number;
}

export interface GlobalEvaluation {
  score: number;
  condition: GlobalConditionType;
  comment: string;
}

// Interface Room mise à jour
export interface Room {
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
  charpente: {
    condition: ConditionType;
  };
  toiture: {
    condition: ConditionType;
  };
  facades: {
    condition: ConditionType;
  };
}

export interface Expertise {
  _id: string;
  typeLogement: 'appartement' | 'maison';
  beneficiaire: {
    nom: string;
    adresse: string;
    telephone: string;
  };
  details: {
    anneeConstruction: number;
    superficie: number;
    nombreEtages: number;
  };
  ouvertures: {
    nombre: number;
    typeVitrage: 'simple' | 'double';
    etat: ConditionType;
    anneeInstallation: number;
  };
  chauffage: {
    type: HeatingType;
    nombre: number;
    etat: ConditionType;
    anneeInstallation: number;
  };
  humidite: {
    taux: number;
    etat: ConditionType;
  };
  facade: {
    type: 'Enduit' | 'Peinture' | 'Pierre';
    epaisseurMurs: number;
    dernierEntretien: Date;
    etat: ConditionType;
  };
  tableauElectrique: {
    type: 'Mono' | 'Triphasé';
    anneePose: number;
    presenceLinky: boolean;
    auxNormes: boolean;
    etat: ConditionType;
  };
  ventilation: {
    type: VentilationType;
    nombreBouches: number;
    piecesEquipees: string;
    ventilationNaturelle: boolean;
    anneePose: number;
    etat: ConditionType;
  };
  isolation: {
    type: IsolationType;
    pose: IsolationPose;
    epaisseur: number;
    etat: ConditionType;
    presenceCondensation: boolean;
    localisationCondensation?: string;
    tauxHumiditeCombles: number;
    etatCombles: ConditionType;
  };
  charpente: {
    type: 'Fermette' | 'Traditionnelle' | 'Metalique';
    presenceArtive: boolean;
    entretienEffectue: boolean;
    dateEntretien?: Date;
    etat: ConditionType;
  };
  toiture: {
    type: 'Ardoise Naturelle' | 'Ardoise Fibrociment' | 'Tuiles' | 'Tuiles Béton' | 'Acier';
    typeFaitage: 'Cimente' | 'En Boîte';
    dateEntretien: Date;
    typeEntretien: string;
    presenceImpuretes: boolean;
    annee: number;
    etat: ConditionType;
  };
  evaluations?: {
    rooms: {
      [key: string]: RoomEvaluation;
    };
    global: GlobalEvaluation;
  };
  createdBy: string;
  status: ExpertiseStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interfaces pour les PDA
export interface ExpertisePlanDetails {
  beneficiary: Beneficiary;
  typeOfImprovement: string;
  fiscalIncome: number;
  estimatedCost: number;
  grantAmount: number;
}

export interface ExpertisePlan {
  id: string;
  title: string;
  createdAt: string;
  status: ExpertiseStatus;
  details: ExpertisePlanDetails;
}

export interface PDA {
  id: string;
  title: string;
  status: ExpertiseStatus;
  details: {
    beneficiary: Beneficiary;
    typeOfImprovement: string;
    fiscalIncome: number;
    estimatedCost: number;
    grantAmount: number;
  };
  createdBy: string;
  createdAt: string;
}

// Types pour les formulaires
export interface FormDataDetails {
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
    type: 'Enduit' | 'Peinture' | 'Pierre';
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
    combles: {
      type: IsolationType;
      installation: IsolationPose;
      thickness: number;
      condition: ConditionType;
      hasCondensation: boolean;
      condensationLocations: string[];
      humidityRate: number;
    };
    murs: {
      type: IsolationType;
      installation: IsolationPose;
      thickness: number;
      condition: ConditionType;
    };
    sols?: {
      type: IsolationType;
      installation: IsolationPose;
      thickness: number;
      condition: ConditionType;
    };
    condition: ConditionType;
  };
  framework: {
    type: 'Fermette' | 'Traditionnelle' | 'Metalique';
    hasBeam: boolean;
    hadMaintenance: boolean;
    maintenanceDate: string | null;
    condition: ConditionType;
  };
  roof: {
    type: 'Ardoise Naturelle' | 'Ardoise Fibrociment' | 'Tuiles' | 'Tuiles Béton' | 'Acier';
    ridgeType: 'Cimente' | 'En Boîte';
    maintenanceDate: string;
    maintenanceType: string;
    hasImpurities: boolean;
    installationYear: number;
    condition: ConditionType;
  };
}

export interface FormData {
  typeLogement: 'appartement' | 'maison' | '';
  details: FormDataDetails;
  evaluations: {
    rooms: {
      [key: string]: RoomEvaluation;
    };
    global: GlobalEvaluation;
  };
}

export interface ExpertiseFormProps {
  isEditing?: boolean;
  initialData?: Expertise | null;
  onSubmit?: (formData: FormData) => Promise<void>;
}

export interface PDAFormProps {
  isEditing?: boolean;
  initialData?: PDA;
}