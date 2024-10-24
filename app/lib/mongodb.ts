// app/lib/mongodb.ts
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Charge les variables d'environnement depuis .env.local
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Veuillez définir la variable MONGODB_URI dans votre fichier .env.local'
  );
}

interface CachedMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: CachedMongoose | undefined;
}

let cached: CachedMongoose = global.mongoose || {
  conn: null,
  promise: null,
};

if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    console.log('✅ Utilisation de la connexion MongoDB existante');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    mongoose.set('strictQuery', true);

    cached.promise = mongoose
      .connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        console.log('✅ Nouvelle connexion MongoDB établie');
        return mongoose;
      })
      .catch((error) => {
        console.error('❌ Erreur de connexion MongoDB:', error);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Fonction pour fermer la connexion (utile pour les tests)
export async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    await cached.conn.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('✅ Déconnexion MongoDB réussie');
  }
}

// Fonction pour vérifier l'état de la connexion
export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

// Gestionnaire d'événements de connexion
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connecté avec succès');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Erreur MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB déconnecté');
});

// Gestion de la fermeture propre lors de l'arrêt de l'application
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

export default connectDB;