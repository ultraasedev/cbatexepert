import mongoose, { Document, Model } from 'mongoose';

export interface IPDA extends Document {
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
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const pdaSchema = new mongoose.Schema({
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
      name: { type: String, required: true },
      address: { type: String, required: true },
      phone: { type: String, required: true }
    },
    typeOfImprovement: { type: String, required: true },
    fiscalIncome: { type: Number, required: true },
    estimatedCost: { type: Number, required: true },
    grantAmount: { type: Number, required: true }
  },
  createdBy: {
    type: String,
    required: true
  }
}, { 
  timestamps: true 
});

// Modification de cette ligne pour éviter l'erreur de compilation
const PDA = (mongoose.models.PDA as Model<IPDA>) || mongoose.model<IPDA>('PDA', pdaSchema);

export default PDA;