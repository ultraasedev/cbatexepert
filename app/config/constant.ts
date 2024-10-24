// config/constants.ts

export const APP_NAME = 'Expertise Habitat';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export const EXPERTISE_STATUS = {
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
} as const;

export const LOGEMENT_TYPES = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison', label: 'Maison' },
] as const;

export const ETAT_OPTIONS = [
  { value: 'bon', label: 'Bon' },
  { value: 'moyen', label: 'Moyen' },
  { value: 'mauvais', label: 'Mauvais' },
] as const;

export const FACADE_TYPES = [
  { value: 'enduit', label: 'Enduit' },
  { value: 'peinture', label: 'Peinture' },
  { value: 'pierre', label: 'Pierre' },
] as const;

export const CHAUFFAGE_TYPES = [
  { value: 'electrique', label: 'Électrique' },
  { value: 'gaz', label: 'Gaz' },
  { value: 'fioul', label: 'Fioul' },
  { value: 'bois', label: 'Bois' },
  { value: 'pellets', label: 'Pellets' },
  { value: 'pompe_chaleur', label: 'Pompe à chaleur' },
] as const;

export const VITRAGE_TYPES = [
  { value: 'simple', label: 'Simple vitrage' },
  { value: 'double', label: 'Double vitrage' },
] as const;

export const VENTILATION_TYPES = [
  { value: 'vmc_simple', label: 'VMC Simple flux' },
  { value: 'vmc_double', label: 'VMC Double flux' },
  { value: 'vmi', label: 'VMI' },
  { value: 'vph', label: 'VPH' },
] as const;

export const ISOLATION_TYPES = [
  { value: 'ouate_cellulose', label: 'Ouate de cellulose' },
  { value: 'laine_roche', label: 'Laine de roche' },
  { value: 'laine_verre', label: 'Laine de verre' },
  { value: 'isolation_minerale', label: 'Isolation minérale' },
] as const;

export const CHARPENTE_TYPES = [
  { value: 'fermette', label: 'Fermette' },
  { value: 'traditionnelle', label: 'Traditionnelle' },
  { value: 'metallique', label: 'Métallique' },
] as const;

export const TOITURE_TYPES = [
  { value: 'ardoise_naturelle', label: 'Ardoise Naturelle' },
  { value: 'ardoise_fibrociment', label: 'Ardoise Fibrociment' },
  { value: 'tuiles', label: 'Tuiles' },
  { value: 'tuiles_beton', label: 'Tuiles Béton' },
  { value: 'acier', label: 'Acier' },
] as const;

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5 MB

export const DATE_FORMAT = 'dd/MM/yyyy';

export const PAGINATION = {
  ITEMS_PER_PAGE: 10,
};

export const ERROR_MESSAGES = {
  GENERIC: 'Une erreur est survenue. Veuillez réessayer plus tard.',
  UNAUTHORIZED: 'Vous n\'êtes pas autorisé à effectuer cette action.',
  NOT_FOUND: 'La ressource demandée n\'a pas été trouvée.',
};