import mongoose, { Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Interface pour le document User
interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

// Schéma pour le modèle User
const UserSchema = new mongoose.Schema({
  id: { 
    type: String, 
    default: () => uuidv4(),
    unique: true,
    required: true 
  },
  name: { 
    type: String, 
    required: [true, 'Le nom est requis'],
    trim: true,
    minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  email: { 
    type: String, 
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Veuillez fournir un email valide']
  },
  password: { 
    type: String, 
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
  },
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual pour les expertises de l'utilisateur
UserSchema.virtual('expertises', {
  ref: 'Expertise',
  localField: '_id',
  foreignField: 'createdBy'
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;