import mongoose, { Document } from 'mongoose';

// Interface pour le document PDA
interface IPDA extends Document {
  title: string;
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
  createdBy: string; // Utilisation de l'UUID comme string
  createdAt: Date;
  updatedAt: Date;
}

// Schéma pour le modèle PDA
const PDASchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['En cours', 'Terminé'],
    default: 'En cours'
  },
  details: {
    beneficiary: {
      name: {
        type: String,
        required: true
      },
      address: {
        type: String,
        required: true
      },
      phone: {
        type: String,
        required: true
      },
    },
    typeOfImprovement: {
      type: String,
      required: true
    },
    fiscalIncome: {
      type: Number,
      required: true
    },
    estimatedCost: {
      type: Number,
      required: true
    },
    grantAmount: {
      type: Number,
      required: true
    }
  },
  createdBy: {
    type: String, // Utilisation de l'UUID
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const PDA = mongoose.model<IPDA>('PDA', PDASchema);
export default PDA;

