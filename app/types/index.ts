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
export type IsolationType = 'Ouate de cellulose' | 'Laine de Roche' | 'Laine de Verre' | 'Isolation Minerales' | '';
export type IsolationPose = 'Sous rampants' | 'En soufflage' | 'En rouleau' | '';

// Interfaces pour l'isolation
export interface BaseIsolation {
  presence: boolean;
  type: IsolationType;
  pose: IsolationPose;
  epaisseur: number;
  condition: ConditionType;
}

export interface CombleIsolation extends BaseIsolation {
  hasCondensation: boolean;
  condensationLocations: string[];
  humidityRate: number;
  etatCombles: ConditionType;
}

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
  humidity: number;
  humidityCondition: ConditionType;
  windows: {
    count: number;
    type: 'simple' | 'double';
    installationYear: number;
    condition: ConditionType;
  };
  condition: {
    windows: ConditionType;
    heating: ConditionType;
    humidity: ConditionType;
  };
  ventilation: VentilationType[];
  ventilationCondition: ConditionType;
}

export interface Expertise {
  _id?: string;
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
  pieces: Array<{
    _id?: string;
    type: string;
    nom: string;
    etage: number;
    ouvertures: {
      nombre: number;
      typeVitrage: 'simple' | 'double';
      etat: ConditionType;
      anneeInstallation: number;
    };
    humidite: {
      taux: number;
      etat: ConditionType;
    };
  }>;
  chauffage: {
    types: HeatingType[];
    nombreRadiateurs: number;
    localisations: string[];
    anneeInstallation: number;
    etat: ConditionType;
  };
  ventilation: {
    types: VentilationType[];
    localisations: string[];
    anneePose: number;
    etat: ConditionType;
    ventilationNaturelle: boolean;
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
  isolation: {
    combles: CombleIsolation;
    murs: BaseIsolation;
    sols?: BaseIsolation;
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
  charpente: {
    type: 'Fermette' | 'Traditionnelle' | 'Metalique';
    presenceArtive: boolean;
    entretienEffectue: boolean;
    dateEntretien?: Date;
    etat: ConditionType;
  };
  impuretes: {
    condition: ConditionType;
  };
  humidite: {
    condition: ConditionType;
    tauxParPiece: Record<string, number>;
  };
  securiteIncendie: {
    bouleIncendie: boolean;
    extincteur: boolean;
    detecteurFumee: boolean;
  };
  evaluations: {
    rooms: Record<string, RoomEvaluation>;
    global: GlobalEvaluation;
  };
  status: ExpertiseStatus;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
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
  isolation: {
    combles: CombleIsolation;
    murs: BaseIsolation;
    sols?: BaseIsolation;
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
    type: 'Ardoise Naturelle' | 'Ardoise Fibrociment' | 'Tuiles' | 'Tuiles Béton' | 'Acier';
    ridgeType: 'Cimente' | 'En Boîte';
    maintenanceDate: string;
    maintenanceType: string;
    hasImpurities: boolean;
    installationYear: number;
    condition: ConditionType;
  };
  charpente: {
    type: 'Fermette' | 'Traditionnelle' | 'Metalique';
    hasBeam: boolean;
    hadMaintenance: boolean;
    maintenanceDate: string | null;
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

// Interfaces pour les PDA
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

// Interface pour la modal de sélection des localisations
export interface LocationModalConfig {
  isOpen: boolean;
  type: 'chauffage' | 'ventilation';
  title: string;
}

export interface PDAFormProps {
  isEditing?: boolean;
  initialData?: PDA;
}

export interface AuthHeaders {
  'Authorization': string;
  'Content-Type': string;
}

// Interface pour les suggestions d'adresse
export interface AddressSuggestion {
  label: string;
  context: string;
}

// Interfaces pour les réponses API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: string[];
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

// Type de validation
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface RoomValidation extends ValidationResult {
  roomIndex?: number;
  fieldName?: string;
}

// Types pour les stats et métriques
export interface ExpertiseMetrics {
  total: number;
  enCours: number;
  termine: number;
  lastWeek: number;
  lastMonth: number;
}

export interface EvaluationStats {
  favorable: number;
  correct: number;
  critique: number;
  averageScore: number;
}

// Types pour les filtres
export interface ExpertiseFilters {
  status?: ExpertiseStatus;
  typeLogement?: 'appartement' | 'maison';
  dateRange?: {
    start: Date;
    end: Date;
  };
  condition?: GlobalConditionType;
}

// Types pour les exports
export interface ExportOptions {
  format: 'pdf' | 'excel';
  includeEvaluations: boolean;
  includePhotos: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}