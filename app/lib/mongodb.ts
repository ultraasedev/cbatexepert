import mongoose from 'mongoose';

// URI MongoDB depuis les variables d'environnement
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('La variable d\'environnement MONGODB_URI est manquante');
}

// Variable pour suivre l'état de la connexion (utile pour les environnements serverless)
let isConnected = false;

// Options de connexion pour Mongoose
const options = {
    bufferCommands: false, // Désactive la file d'attente des commandes jusqu'à la connexion
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

// Fonction de connexion MongoDB
export const dbConnect = async () => {
    // Vérifie si la connexion est déjà établie
    if (isConnected) {
        console.log("Utilisation de la connexion MongoDB existante");
        return;
    }

    try {
        // Connexion à MongoDB
        await mongoose.connect(MONGODB_URI, options);
        isConnected = true; // Marque la connexion comme établie
        console.log("Connexion à MongoDB établie avec succès.");
    } catch (error) {
        console.error("Erreur lors de la connexion à MongoDB:", error);
        throw error;
    }
};

// Gestion des événements de connexion (facultatif mais recommandé pour le suivi)
mongoose.connection.on('connected', () => {
    console.log('Mongoose est connecté à MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error(`Erreur de connexion Mongoose : ${err}`);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose est déconnecté de MongoDB');
});

// Nettoyage de la connexion lors de l'arrêt du processus (utile pour les environnements locaux)
if (process.env.NODE_ENV !== 'production') {
    process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('Connexion MongoDB fermée en raison de la fin du processus');
        process.exit(0);
    });
}
