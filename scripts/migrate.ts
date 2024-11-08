// scripts/migrate.ts
import {dbConnect} from '../app/lib/mongodb';
import PDA from '../models/pda';
import User from '../models/user';
import Expertise from '../models/expertise';
 
// Données d'expertise de base
const baseExpertiseData = {
  typeLogement: 'appartement',
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
  evaluations: {
    rooms: new Map([
      ["entree", {
        windows: 0,
        heating: 5,
        humidity: 4,
        ventilation: 4
      }],
      ["salon", {
        windows: 4,
        heating: 5,
        humidity: 4,
        ventilation: 4
      }],
      ["cuisine", {
        windows: 5,
        heating: 4,
        humidity: 4,
        ventilation: 5
      }]
    ]),
    global: {
      score: 4.5,
      condition: "Favorable",
      comment: "Excellent état général"
    }
  },
  status: 'En cours'
};

async function migrate() {
  await dbConnect();
  
  // Création de l'admin
  let adminUser;
  try {
    const adminData = {
      email: 'admin@gmail.com',
      name: 'Admin User',
      password: 'admin1234', 
      role: 'admin'
    };
    adminUser = new User(adminData);
    await adminUser.save();
    console.log('Administrateur créé avec succès');
  } catch (error) {
    console.error('Erreur lors de la création de l\'administrateur:', error);
    return;
  }

  // Création de l'utilisateur régulier
  let regularUser;
  try {
    const regularUserData = {
      email: 'user@user.com',
      name: 'Regular User',
      password: 'user1234', 
      role: 'user'
    };
    regularUser = new User(regularUserData);
    await regularUser.save();
    console.log('Utilisateur régulier créé avec succès');
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur régulier:', error);
    return;
  }

  // Création d'un PDA pour l'admin
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
      createdBy: adminUser.id
    };
    const newPDA = new PDA(pdaData);
    await newPDA.save();
    console.log('PDA créé avec succès');
  } catch (error) {
    console.error('Erreur lors de la création du PDA:', error);
  }

  // Création d'une expertise pour l'admin
  try {
    const adminExpertise = {
      ...baseExpertiseData,
      createdBy: adminUser.id
    };
    const newAdminExpertise = new Expertise(adminExpertise);
    await newAdminExpertise.save();
    console.log('Expertise créée pour l\'administrateur avec succès');
  } catch (error) {
    console.error('Erreur lors de la création de l\'expertise admin:', error);
  }

  // Création d'une expertise pour l'utilisateur régulier
  try {
    const regularUserExpertise = {
      ...baseExpertiseData,
      beneficiaire: {
        ...baseExpertiseData.beneficiaire,
        nom: "Jane Smith"
      },
      createdBy: regularUser.id
    };
    const newRegularUserExpertise = new Expertise(regularUserExpertise);
    await newRegularUserExpertise.save();
    console.log('Expertise créée pour l\'utilisateur régulier avec succès');
  } catch (error) {
    console.error('Erreur lors de la création de l\'expertise utilisateur:', error);
  }

  console.log('Migration terminée avec succès');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Erreur lors de la migration:', err);
  process.exit(1);
});