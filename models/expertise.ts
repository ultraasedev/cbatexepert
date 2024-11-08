import mongoose, { Document, Model } from 'mongoose';

interface RoomEvaluation {
  windows?: number;
  heating?: number;
  humidity?: number;
  ventilation?: number;
}

interface GlobalEvaluation {
  score: number;
  condition: 'Favorable' | 'Correct' | 'Critique';
  comment: string;
}

interface BaseIsolation {
  presence: boolean;
  type: 'Ouate de cellulose' | 'Laine de Roche' | 'Laine de Verre' | 'Isolation Minerales' | '';
  pose: 'Sous rampants' | 'En soufflage' | 'En rouleau' | '';
  epaisseur: number;
  etat: 'Bon' | 'Moyen' | 'Mauvais';
}

interface CombleIsolation extends BaseIsolation {
  presenceCondensation: boolean;
  localisationCondensation?: string;
  tauxHumiditeCombles: number;
  etatCombles: 'Bon' | 'Moyen' | 'Mauvais';
}

interface IExpertise extends Document {
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
    etat: 'Bon' | 'Moyen' | 'Mauvais';
    anneeInstallation: number;
  };
  chauffage: {
    types: ('Électrique' | 'Gaz' | 'Fioul' | 'Bois' | 'Poêle' | 'Pac')[];
    nombreRadiateurs: number;
    localisations: string[];
    etat: 'Bon' | 'Moyen' | 'Mauvais';
    anneeInstallation: number;
  };
  humidite: {
    taux: number;
    etat: 'Bon' | 'Moyen' | 'Mauvais';
    tauxParPiece: Record<string, number>;
  };
  facade: {
    type: 'Enduit' | 'Peinture' | 'Pierre';
    epaisseurMurs: number;
    dernierEntretien: number;
    etat: 'Bon' | 'Moyen' | 'Mauvais';
  };
  tableauElectrique: {
    type: 'Mono' | 'Triphasé';
    anneePose: number;
    presenceLinky: boolean;
    auxNormes: boolean;
    etat: 'Bon' | 'Moyen' | 'Mauvais';
  };
  ventilation: {
    types: ('VMC Simple flux' | 'Double Flux' | 'VMI' | 'VPH')[];
    localisations: string[];
    ventilationNaturelle: boolean;
    anneePose: number;
    etat: 'Bon' | 'Moyen' | 'Mauvais';
  };
  isolation: {
    combles: CombleIsolation;
    murs: BaseIsolation;
    sols?: BaseIsolation;
  };
  charpente: {
    type: 'Fermette' | 'Traditionnelle' | 'Metalique';
    presenceArtive: boolean;
    entretienEffectue: boolean;
    dateEntretien?: Date;
    etat: 'Bon' | 'Moyen' | 'Mauvais';
  };
  toiture: {
    type: 'Ardoise Naturelle' | 'Ardoise Fibrociment' | 'Tuiles' | 'Tuiles Béton' | 'Acier';
    typeFaitage: 'Cimente' | 'En Boîte';
    dateEntretien: Date;
    typeEntretien: string;
    presenceImpuretes: boolean;
    annee: number;
    etat: 'Bon' | 'Moyen' | 'Mauvais';
  };
  evaluations: {
    rooms: {
      [key: string]: RoomEvaluation;
    };
    global: GlobalEvaluation;
  };
  createdBy: {
    toString(): string;
    _id?: string;
    id?: string;
  };
  status: 'En cours' | 'Terminé';
  createdAt: Date;
  updatedAt: Date;
}

const ExpertiseSchema = new mongoose.Schema({
  typeLogement: { type: String, enum: ['appartement', 'maison'], required: true },
  
  beneficiaire: {
    nom: { type: String, required: true },
    adresse: { type: String, required: true },
    telephone: { type: String, required: true }
  },
  
  details: {
    anneeConstruction: { type: Number, required: true },
    superficie: { type: Number, required: true },
    nombreEtages: { type: Number, required: true }
  },
  
  ouvertures: {
    nombre: { type: Number, required: true },
    typeVitrage: { type: String, enum: ['simple', 'double'], required: true },
    etat: { type: String, enum: ['Bon', 'Moyen', 'Mauvais'], required: true },
    anneeInstallation: { type: Number, required: true }
  },
  
  chauffage: {
    types: [{ type: String, enum: ['Électrique', 'Gaz', 'Fioul', 'Bois', 'Poêle', 'Pac'] }],
    nombreRadiateurs: { type: Number, default: 0 },
    localisations: [{ type: String }],
    etat: { type: String, enum: ['Bon', 'Moyen', 'Mauvais'], required: true },
    anneeInstallation: { type: Number, required: true }
  },
  
  humidite: {
    taux: { type: Number, required: true },
    etat: { type: String, enum: ['Bon', 'Moyen', 'Mauvais'], required: true },
    tauxParPiece: {
      type: Map,
      of: Number
    }
  },
  
  facade: {
    type: { type: String, enum: ['Enduit', 'Peinture', 'Pierre'], required: true },
    epaisseurMurs: { type: Number, required: true },
    dernierEntretien: { type: Number, required: true },
    etat: { type: String, enum: ['Bon', 'Moyen', 'Mauvais'], required: true }
  },
  
  tableauElectrique: {
    type: { type: String, enum: ['Mono', 'Triphasé'], required: true },
    anneePose: { type: Number, required: true },
    presenceLinky: { type: Boolean, required: true },
    auxNormes: { type: Boolean, required: true },
    etat: { type: String, enum: ['Bon', 'Moyen', 'Mauvais'], required: true }
  },
  
  ventilation: {
    types: [{ type: String, enum: ['VMC Simple flux', 'Double Flux', 'VMI', 'VPH'] }],
    localisations: [{ type: String }],
    ventilationNaturelle: { type: Boolean, required: true },
    anneePose: { type: Number, required: true },
    etat: { type: String, enum: ['Bon', 'Moyen', 'Mauvais'], required: true }
  },
  
  isolation: {
    combles: {
      presence: { type: Boolean, required: true },
      type: { type: String, enum: ['Ouate de cellulose', 'Laine de Roche', 'Laine de Verre', 'Isolation Minerales', ''] },
      pose: { type: String, enum: ['Sous rampants', 'En soufflage', 'En rouleau', ''] },
      epaisseur: { type: Number },
      etat: { type: String, enum: ['Bon', 'Moyen', 'Mauvais'], required: true },
      presenceCondensation: { type: Boolean, required: true },
      localisationCondensation: { type: String },
      tauxHumiditeCombles: { type: Number, required: true },
      etatCombles: { type: String, enum: ['Bon', 'Moyen', 'Mauvais'], required: true }
    },
    murs: {
      presence: { type: Boolean, required: true },
      type: { type: String, enum: ['Ouate de cellulose', 'Laine de Roche', 'Laine de Verre', 'Isolation Minerales', ''] },
      pose: { type: String, enum: ['Sous rampants', 'En soufflage', 'En rouleau', ''] },
      epaisseur: { type: Number },
      etat: { type: String, enum: ['Bon', 'Moyen', 'Mauvais'], required: true }
    },
    sols: {
      presence: { type: Boolean },
      type: { type: String, enum: ['Ouate de cellulose', 'Laine de Roche', 'Laine de Verre', 'Isolation Minerales', ''] },
      pose: { type: String, enum: ['Sous rampants', 'En soufflage', 'En rouleau', ''] },
      epaisseur: { type: Number },
      etat: { type: String, enum: ['Bon', 'Moyen', 'Mauvais'] }
    }
  },
  
  charpente: {
    type: { type: String, enum: ['Fermette', 'Traditionnelle', 'Metalique'], required: true },
    presenceArtive: { type: Boolean, required: true },
    entretienEffectue: { type: Boolean, required: true },
    dateEntretien: { type: Date },
    etat: { type: String, enum: ['Bon', 'Moyen', 'Mauvais'], required: true }
  },
  
  toiture: {
    type: { type: String, enum: ['Ardoise Naturelle', 'Ardoise Fibrociment', 'Tuiles', 'Tuiles Béton', 'Acier'], required: true },
    typeFaitage: { type: String, enum: ['Cimente', 'En Boîte'], required: true },
    dateEntretien: { type: Date, required: true },
    typeEntretien: { type: String, required: true },
    presenceImpuretes: { type: Boolean, required: true },
    annee: { type: Number, required: true },
    etat: { type: String, enum: ['Bon', 'Moyen', 'Mauvais'], required: true }
  },

  evaluations: {
    rooms: {
      type: Map,
      of: {
        windows: { type: Number, min: 1, max: 5 },
        heating: { type: Number, min: 1, max: 5 },
        humidity: { type: Number, min: 1, max: 5 },
        ventilation: { type: Number, min: 1, max: 5 }
      }
    },
    global: {
      score: { type: Number, min: 0, max: 5 },
      condition: { 
        type: String, 
        enum: ['Favorable', 'Correct', 'Critique']
      },
      comment: { type: String }
    }
  },
  
  createdBy: { 
    type: String, 
    required: true 
  },

  status: { type: String, enum: ['En cours', 'Terminé'], default: 'En cours' }
}, { 
  timestamps: true 
});

const Expertise: Model<IExpertise> = mongoose.models.Expertise || mongoose.model<IExpertise>('Expertise', ExpertiseSchema);

export default Expertise;