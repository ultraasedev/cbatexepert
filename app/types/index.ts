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

export type ExpertiseStatus = 'En cours' | 'Terminé';
export type ConditionType = 'Bon' | 'Moyen' | 'Mauvais';
export type GlobalConditionType = 'Favorable' | 'Correct' | 'Critique';

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
    type: 'Électrique' | 'Gaz' | 'Fioul' | 'Bois' | 'Poêle' | 'Pac';
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
    dernierEntretien: number;
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
    type: 'VMC Simple flux' | 'Double Flux' | 'VMI' | 'VPH';
    nombreBouches: number;
    piecesEquipees: string;
    ventilationNaturelle: boolean;
    anneePose: number;
    etat: ConditionType;
  };
  isolation: {
    type: 'Ouate de cellulose' | 'Laine de Roche' | 'Laine de Verre' | 'Isolation Minerales';
    pose: 'Sous rampants' | 'En soufflage' | 'En rouleau';
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
export interface ExpertiseFormProps {
  isEditing?: boolean;
  initialData?: Expertise | null;
  onSubmit?: (formData: any) => Promise<void>;
}

export interface PDAFormProps {
  isEditing?: boolean;
  initialData?: PDA;
}