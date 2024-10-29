// app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../lib/mongodb';
import User from '../../../models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

const authenticateToken = (request: NextRequest) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return null;

  try {
    return jwt.verify(token, JWT_SECRET as string) as { id: string; email: string; role: string };
  } catch (error) {
    console.error('Erreur de vérification du token:', error);
    return null;
  }
};

const createToken = (user: any) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      name: user.name
    },
    JWT_SECRET as string,
    { expiresIn: '7d' }
  );
};

// Création des utilisateurs par défaut
async function createDefaultUsers() {
  await dbConnect();
  const defaultUsers = [
    { 
      name: 'Admin User', 
      email: 'admin@admin.com', 
      password: 'admin1234', 
      role: 'admin' as const 
    },
    { 
      name: 'Regular User', 
      email: 'user@user.com', 
      password: 'user1234', 
      role: 'user' as const 
    }
  ];

  for (const userData of defaultUsers) {
    try {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        const newUser = new User({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role
        });

        await newUser.save();
        console.log(`Created default user: ${userData.email}`);
      }
    } catch (error) {
      console.error(`Error creating default user ${userData.email}:`, error);
    }
  }
}

// Initialisation des utilisateurs par défaut
(async () => {
  try {
    await createDefaultUsers();
  } catch (error) {
    console.error('Error in default users creation:', error);
  }
})();

async function handleLogin({ email, password }: { email: string; password: string }) {
  try {
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json(
        { success: false, message: 'Identifiants invalides' },
        { status: 401 }
      );
    }

    const token = createToken(user);
    
    return NextResponse.json({ 
      success: true, 
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

async function handleRegister(data: {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}) {
  try {
    const { name, email, password, role } = data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    );
  }
}
