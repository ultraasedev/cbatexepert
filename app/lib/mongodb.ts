import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('La variable d\'environnement MONGODB_URI est manquante');
}

// Suivi de l'état de la connexion
let isConnected = false;

export const dbConnect = async () => {
    if (isConnected) {
        console.log("Utilisation de la connexion MongoDB existante");
        return;
    }

    try {
        // Connexion à MongoDB sans les options dépréciées
        await mongoose.connect(MONGODB_URI, {
            bufferCommands: false
        });

        isConnected = true;
        console.log("Connexion à MongoDB établie avec succès.");
    } catch (error) {
        console.error("Erreur lors de la connexion à MongoDB:", error);
        throw error;
    }
};

// Gestion des événements de connexion pour le suivi
mongoose.connection.on('connected', () => {
    console.log('Mongoose est connecté à MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error(`Erreur de connexion Mongoose : ${err}`);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose est déconnecté de MongoDB');
});

// Fermer la connexion en fin de processus pour les environnements non-production
if (process.env.NODE_ENV !== 'production') {
    process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('Connexion MongoDB fermée en raison de la fin du processus');
        process.exit(0);
    });
}
