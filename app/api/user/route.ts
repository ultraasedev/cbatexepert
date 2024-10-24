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
      } else {
        console.log(`Default user already exists: ${userData.email}`);
      }
    } catch (error) {
      console.error(`Error creating default user ${userData.email}:`, error);
    }
  }
}

(async () => {
  try {
    await createDefaultUsers();
    console.log('Default users creation process completed');
  } catch (error) {
    console.error('Error in default users creation:', error);
  }
})();

export async function POST(request: NextRequest) {
  await dbConnect();
  
  const body = await request.json();
  const { action, ...data } = body;

  switch (action) {
    case 'login':
      return handleLogin(data);
    case 'register':
      return handleRegister(data);
    case 'refresh-token':
      return handleTokenRefresh(request);
    default:
      return NextResponse.json(
        { success: false, message: 'Action non reconnue' },
        { status: 400 }
      );
  }
}

async function handleLogin({ email, password }: { email: string; password: string }) {
  try {
    const user = await User.findOne({ email });
    console.log('Login attempt for:', email);
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      console.log('Login failed: Invalid credentials');
      return NextResponse.json(
        { success: false, message: 'Identifiants invalides' },
        { status: 401 }
      );
    }

    const token = createToken(user);
    
    console.log('Login successful for:', email);
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

async function handleTokenRefresh(request: NextRequest) {
  const user = authenticateToken(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Token invalide' },
      { status: 401 }
    );
  }

  try {
    const dbUser = await User.findById(user.id).select('-password');
    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const newToken = createToken(dbUser);
    
    return NextResponse.json({
      success: true,
      token: newToken,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        name: dbUser.name
      }
    });
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

async function handleRegister({ name, email, password, role }: { name: string; email: string; password: string; role: 'user' | 'admin' }) {
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
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

    return NextResponse.json(
      { success: true, message: 'Utilisateur créé avec succès' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  await dbConnect();
  
  const user = authenticateToken(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { success: false, message: 'Non autorisé' },
      { status: 401 }
    );
  }

  try {
    const users = await User.find({}).select('-password');
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  await dbConnect();

  const user = authenticateToken(request);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Non autorisé' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { action, ...data } = body;

  switch (action) {
    case 'updateProfile':
      return handleUpdateProfile(user.id, data);
    case 'changePassword':
      return handleChangePassword(user.id, data);
    case 'changeEmail':
      return handleChangeEmail(user.id, data);
    default:
      return NextResponse.json(
        { success: false, message: 'Action non reconnue' },
        { status: 400 }
      );
  }
}

async function handleUpdateProfile(userId: string, { name, avatar }: { name?: string; avatar?: string }) {
  try {
    const updatedUser = await User.findOneAndUpdate(
      { id: userId },
      { $set: { name, avatar } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

async function handleChangePassword(userId: string, { currentPassword, newPassword }: { currentPassword: string; newPassword: string }) {
  try {
    const user = await User.findOne({ id: userId });
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return NextResponse.json(
        { success: false, message: 'Mot de passe actuel incorrect' },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return NextResponse.json(
      { success: true, message: 'Mot de passe mis à jour avec succès' }
    );
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

async function handleChangeEmail(userId: string, { newEmail, password }: { newEmail: string; password: string }) {
  try {
    const user = await User.findOne({ id: userId });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json(
        { success: false, message: 'Mot de passe incorrect' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
    }

    user.email = newEmail;
    await user.save();

    return NextResponse.json(
      { success: true, message: 'Email mis à jour avec succès' }
    );
  } catch (error) {
    console.error('Erreur lors du changement d\'email:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  await dbConnect();

  const user = authenticateToken(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { success: false, message: 'Non autorisé' },
      { status: 401 }
    );
  }

  const { userId } = await request.json();

  try {
    const deletedUser = await User.findOneAndDelete({ id: userId });
    if (!deletedUser) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Utilisateur supprimé avec succès' }
    );
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}