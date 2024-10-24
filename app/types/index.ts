// types/index.ts

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}
export interface ExpertisePlan {
  id: string;
  title: string;
  createdAt: string;
  status: 'En cours' | 'Terminé';
  details: {
    beneficiary: {
      name: string;
      address: string;
      phone: string;
    };
    typeOfImprovement: string;
    fiscalIncome: number;
    estimatedCost: number;
    grantAmount: number;
  };
}

export type ExpertiseStatus = 'En cours' | 'Terminé';

export interface Beneficiary {
  name: string;
  address: string;
  phone: string;
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

export interface PDA {
  id: string;
  beneficiary: Beneficiary;
  typeOfImprovement: string;
  fiscalIncome: number;
  estimatedCost: number;
  grantAmount: number;
  status: ExpertiseStatus;
  createdAt: string;
}

export interface LogementDetails {
  type: 'appartement' | 'maison';
  anneeConstruction: number;
  superficie: number;
  nombreEtages: number;
}

export interface Ouverture {
  nombre: number;
  type: 'simple' | 'double';
  etat: 'Bon' | 'Moyen' | 'Mauvais';
  anneeInstallation: number;
}

export interface Chauffage {
  type: 'Électrique' | 'Gaz' | 'Fioul' | 'Bois' | 'Pellet' | 'Pompe à chaleur';
  nombre: number;
  etat: 'Bon' | 'Moyen' | 'Mauvais';
  anneeInstallation: number;
}

export interface Humidite {
  tauxHumidite: number;
  etat: 'Bon' | 'Moyen' | 'Mauvais';
}

export interface Facade {
  type: 'Enduit' | 'Peinture' | 'Pierre';
  epaisseurMurs: number;
  dernierEntretien: number;
  etat: 'Bon' | 'Moyen' | 'Mauvais';
}

export interface TableauElectrique {
  type: 'Mono' | 'Triphasé';
  anneePose: number;
  presenceLinky: boolean;
  normeNF2012: boolean;
  etat: 'Bon' | 'Moyen' | 'Mauvais';
}

export interface Ventilation {
  type: 'VMC Simple flux' | 'Double Flux' | 'VMI' | 'VPH';
  nombreBouches: number;
  pieces: string[];
  ventilationNaturelle: boolean;
  anneePose: number;
  etat: 'Bon' | 'Moyen' | 'Mauvais';
}

export interface IsolationCombles {
  type: 'Ouate de cellulose' | 'Laine de Roche' | 'Laine de Verre' | 'Isolation Minerales';
  pose: 'Sous rampants' | 'En soufflage' | 'En rouleau';
  epaisseur: number;
  etat: 'Bon' | 'Moyen' | 'Mauvais';
  presenceCondensation: boolean;
  localisationCondensation?: string;
  tauxHumidite: number;
}

export interface Charpente {
  type: 'Fermette' | 'Traditionnelle' | 'Metalique';
  presenceArtive: boolean;
  entretienEffectue: boolean;
  dateEntretien?: string;
  etat: 'Bon' | 'Moyen' | 'Mauvais';
}

export interface Toiture {
  type: 'Ardoise Naturelle' | 'Ardoise Fibrociment' | 'Tuiles' | 'Tuiles Béton' | 'Acier';
  typeFaitage: 'Cimente' | 'En Boîte';
  dateEntretien: string;
  typeEntretien: string;
  presenceImpuretes: boolean;
  anneeToiture: number;
  etat: 'Bon' | 'Moyen' | 'Mauvais';
}

export interface ExpertiseHabitat extends ExpertisePlan {
  logement: LogementDetails;
  ouvertures: Ouverture;
  chauffage: Chauffage;
  humidite: Humidite;
  facade: Facade;
  tableauElectrique: TableauElectrique;
  ventilation: Ventilation;
  isolationCombles: IsolationCombles;
  charpente: Charpente;
  toiture: Toiture;
}