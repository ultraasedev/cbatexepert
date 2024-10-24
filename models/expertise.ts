// models/Expertise.ts
import mongoose from 'mongoose';

const ExpertiseSchema = new mongoose.Schema({
  // Étape 1
  typeLogement: { type: String, enum: ['appartement', 'maison'], required: true },
  
  // Étape 2
  beneficiaire: {
    nom: { type: String, required: true },
    adresse: { type: String, required: true },
    telephone: { type: String, required: true }
  },
  
  // Étape 3
  details: {
    anneeConstruction: { type: Number, required: true },
    superficie: { type: Number, required: true },
    nombreEtages: { type: Number, required: true }
  },
  
  // Étape 4
  ouvertures: {
    nombre: { type: Number, required: true },
    typeVitrage: { type: String, enum: ['simple', 'double'], required: true },
    etat: { type: String, enum: ['Bon', 'Moyen', 'Mauvais'], required: true },
    anneeInstallation: { type: Number, required: true }
  },
  
  // Étape 5
  chauffage: {
    type: { type: String, enum: ['Électrique', 'Gaz', 'Fioul', 'Bois', 'Pele', 'Pompe à chaleur'], required: true },
    nombre: { type: Number, required: true },
    etat: { type: String, enum: ['Bon', 'Moyen', 'Mauvais'], required: true },
    anneeInstallation: { type: Number, required: true }
  },
  
  // Étape 6
  humidite: {
    taux: { type: Number, required: true },
    etat: { type: String, enum: ['Bon', 'Moyen', 'Mauvais'], required: true }
  },
  
  // Étape 7
  facade: {
    type: { type: String, enum: ['Enduit', 'Peinture', 'Pierre'], required: true },
    epaisseurMurs: { type: Number, required: true },
    dernierEntretien: { type: Number, required: true },
    etat: { type: String, enum: ['Bon', 'Moyen', 'Mauvais'], required: true }
  },
  
  // Étape 8
  tableauElectrique: {
    type: { type: String, enum: ['Mono', 'Triphasé'], required: true },
    anneePose: { type: Number, required: true },
    presenceLinky: { type: Boolean, required: true },
    auxNormes: { type: Boolean, required: true },
    etat: { type: String, enum: ['Bon', 'Moyen', 'Mauvais'], required: true }
  },
  
  // Étape 9
  ventilation: {
    type: { type: String, enum: ['VMC Simple flux', 'Double Flux', 'VMI', 'VPH'], required: true },
    nombreBouches: { type: Number, required: true },
    piecesEquipees: { type: String, required: true },
    ventilationNaturelle: { type: Boolean, required: true },
    anneePose: { type: Number, required: true },
    etat: { type: String, enum: ['Bon', 'Moyen', 'Mauvais'], required: true }
  },
  
  // Étape 10
  isolation: {
    type: { type: String, enum: ['Ouate de cellulose', 'Laine de Roche', 'Laine de Verre', 'Isolation Minerales'], required: true },
    pose: { type: String, enum: ['Sous rampants', 'En soufflage', 'En rouleau'], required: true },
    epaisseur: { type: Number, required: true },
    etat: { type: String, enum: ['Bon', 'Moyen', 'Mauvais'], required: true },
    presenceCondensation: { type: Boolean, required: true },
    localisationCondensation: { type: String },
    tauxHumiditeCombles: { type: Number, required: true },
    etatCombles: { type: String, enum: ['Bon', 'Moyen', 'Mauvais'], required: true }
  },
  
  // Étape 11
  charpente: {
    type: { type: String, enum: ['Fermette', 'Traditionnelle', 'Metalique'], required: true },
    presenceArtive: { type: Boolean, required: true },
    entretienEffectue: { type: Boolean, required: true },
    dateEntretien: { type: Date },
    etat: { type: String, enum: ['Bon', 'Moyen', 'Mauvais'], required: true }
  },
  
  // Étape 12
  toiture: {
    type: { type: String, enum: ['Ardoise Naturelle', 'Ardoise Fibrociment', 'Tuiles', 'Tuiles Béton', 'Acier'], required: true },
    typeFaitage: { type: String, enum: ['Cimente', 'En Boîte'], required: true },
    dateEntretien: { type: Date, required: true },
    typeEntretien: { type: String, required: true },
    presenceImpuretes: { type: Boolean, required: true },
    annee: { type: Number, required: true },
    etat: { type: String, enum: ['Bon', 'Moyen', 'Mauvais'], required: true }
  },
  
  status: { type: String, enum: ['En cours', 'Terminé'], default: 'En cours' }
}, { timestamps: true });

export default mongoose.models.Expertise || mongoose.model('Expertise', ExpertiseSchema);