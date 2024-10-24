// scripts/migrate.ts
import dbConnect from '../app/lib/mongodb';
import PDA from '../models/pda';
import User from '../models/user';
import Expertise from '../models/expertise';

async function migrate() {
  await dbConnect();
  
  let newUser;
  // Création d'un utilisateur
  try {
    const userData = {
      email: 'admin@gmail.com',
      name: 'Admin User',
      password: 'admin1234', 
      role: 'admin'
    };
    newUser = new User(userData);
    await newUser.save();
    console.log('Utilisateur créé avec succès');
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    return;
  }

  // Création d'un PDA
  try {
    const pdaData = {
      title: "Plan d'aide test",
      status: "En cours",
      details: {
        beneficiary: {
          name: "John Doe",
          address: "123 Test Street",
          phone: "0123456789"
        },
        typeOfImprovement: "Isolation",
        fiscalIncome: 30000,
        estimatedCost: 10000,
        grantAmount: 6000
      },
      createdBy: newUser._id 
    };
    const newPDA = new PDA(pdaData);
    await newPDA.save();
    console.log('PDA créé avec succès');
  } catch (error) {
    console.error('Erreur lors de la création du PDA:', error);
  }

  // Création d'une expertise
  try {
    const expertiseData = {
      typeLogement: 'appartement', // Assurez-vous que cette valeur correspond à votre enum
  beneficiaire: {
    nom: "John Doe",
    adresse: "123 rue Example, Ville",
    telephone: "0123456789"
  },
  details: {
    anneeConstruction: 1990,
    superficie: 100,
    nombreEtages: 2
  },
  ouvertures: {
    nombre: 5,
    typeVitrage: 'double',
    etat: 'Bon',
    anneeInstallation: 2010
  },
  chauffage: {
    type: 'Électrique',
    nombre: 3,
    etat: 'Bon',
    anneeInstallation: 2015
  },
  humidite: {
    taux: 50,
    etat: 'Bon'
  },
  facade: {
    type: 'Enduit',
    epaisseurMurs: 30,
    dernierEntretien: 2018,
    etat: 'Bon'
  },
  tableauElectrique: {
    type: 'Mono',
    anneePose: 2000,
    presenceLinky: true,
    auxNormes: true,
    etat: 'Bon'
  },
  ventilation: {
    type: 'VMC Simple flux',
    nombreBouches: 3,
    piecesEquipees: 'Cuisine, Salle de bain, WC',
    ventilationNaturelle: false,
    anneePose: 2005,
    etat: 'Bon'
  },
  isolation: {
    type: 'Laine de Verre',
    pose: 'En rouleau',
    epaisseur: 20,
    etat: 'Bon',
    presenceCondensation: false,
    localisationCondensation: '',
    tauxHumiditeCombles: 30,
    etatCombles: 'Bon'
  },
  charpente: {
    type: 'Traditionnelle',
    presenceArtive: false,
    entretienEffectue: true,
    dateEntretien: new Date('2020-01-01'),
    etat: 'Bon'
  },
  toiture: {
    type: 'Tuiles',
    typeFaitage: 'Cimente',
    dateEntretien: new Date('2019-06-15'),
    typeEntretien: 'Nettoyage',
    presenceImpuretes: false,
    annee: 1990,
    etat: 'Bon'
  },
  status: 'En cours'
    };
    const newExpertise = new Expertise(expertiseData);
    await newExpertise.save();
    console.log('Expertise créée avec succès');
  } catch (error) {
    console.error('Erreur lors de la création de l\'expertise:', error);
  }

  console.log('Migration terminée');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Erreur lors de la migration:', err);
  process.exit(1);
});