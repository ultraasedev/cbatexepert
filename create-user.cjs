require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable');
  process.exit(1);
}

// Définition du schéma User
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
  timestamps: true 
});

const User = mongoose.model('User', UserSchema);

async function createUser(name, email, password, role) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Un utilisateur avec cet email existe déjà');
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    await newUser.save();
    console.log(`Utilisateur créé avec succès: ${newUser.email}`);
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
  } finally {
    await mongoose.connection.close();
  }
}

const [,, name, email, password, role] = process.argv;

if (!name || !email || !password || !role) {
  console.log('Usage: node create-user.js <name> <email> <password> <role>');
  process.exit(1);
}

createUser(name, email, password, role);