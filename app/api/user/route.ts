// app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {dbConnect} from '../../lib/mongodb';
import User from '../../../models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const JWT_SECRET = process.env.JWT_SECRET;
const PUBLIC_DIR = join(process.cwd(), 'public');
const UPLOAD_DIR = join(PUBLIC_DIR, 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];


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


// Fonction utilitaire pour nettoyer les anciens fichiers
const cleanOldFile = async (filePath: string) => {
  try {
    await unlink(filePath);
  } catch (error) {
    console.error('Erreur lors de la suppression du fichier:', error);
  }
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
     }
   } catch (error) {
     console.error(`Error creating default user ${userData.email}:`, error);
   }
 }
}

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

export async function GET(request: NextRequest) {
  const user = authenticateToken(request);

  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { success: false, message: 'Accès non autorisé' },
      { status: 401 }
    );
  }

  try {
    await dbConnect();
    const users = await User.find({}, 'id _id name email role');
    console.log('Utilisateurs trouvés:', users);

    return NextResponse.json({
      success: true,
      data: users
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
 const data = await request.json();

 if (data.action === 'login') {
   return handleLogin(data);
 } else if (data.action === 'register') {
   return handleRegister(data);
 } else {
   return NextResponse.json(
     { success: false, message: 'Action non reconnue' },
     { status: 400 }
   );
 }
}


export async function PUT(request: NextRequest) {
  const user = authenticateToken(request);
  
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Non autorisé' },
      { status: 401 }
    );
  }

  try {
    await dbConnect();
    const data = await request.json();

    if (!data.action) {
      return NextResponse.json(
        { success: false, message: 'Action non spécifiée' },
        { status: 400 }
      );
    }

    switch (data.action) {
      case 'updateUser': {
        if (user.role !== 'admin') {
          return NextResponse.json(
            { success: false, message: 'Non autorisé' },
            { status: 401 }
          );
        }

        const { id, name, email, role, password } = data;
        if (!id || !name || !email || !role) {
          return NextResponse.json(
            { success: false, message: 'Données manquantes' },
            { status: 400 }
          );
        }

        // Utiliser le champ 'id' au lieu de '_id'
        const userToUpdate = await User.findOne({ id: id });
        
        if (!userToUpdate) {
          return NextResponse.json(
            { success: false, message: 'Utilisateur non trouvé' },
            { status: 404 }
          );
        }

        // Vérification si l'email est déjà utilisé par un autre utilisateur
        const existingUser = await User.findOne({
          email,
          id: { $ne: id } // Utiliser 'id' au lieu de '_id'
        });

        if (existingUser) {
          return NextResponse.json(
            { success: false, message: 'Cet email est déjà utilisé' },
            { status: 400 }
          );
        }

        // Mise à jour des champs
        userToUpdate.name = name;
        userToUpdate.email = email;
        userToUpdate.role = role;

        // Mise à jour du mot de passe si fourni
        if (password) {
          const salt = await bcrypt.genSalt(10);
          userToUpdate.password = await bcrypt.hash(password, salt);
        }

        // Sauvegarde des modifications
        await userToUpdate.save();

        return NextResponse.json({
          success: true,
          message: 'Utilisateur mis à jour avec succès',
          data: {
            id: userToUpdate.id,
            name: userToUpdate.name,
            email: userToUpdate.email,
            role: userToUpdate.role
          }
        });
      }

      case 'changeEmail': {
        const { newEmail } = data;
        if (!newEmail) {
          return NextResponse.json(
            { success: false, message: 'Email requis' },
            { status: 400 }
          );
        }

        const userToUpdate = await User.findOne({ id: user.id });
        if (!userToUpdate) {
          return NextResponse.json(
            { success: false, message: 'Utilisateur non trouvé' },
            { status: 404 }
          );
        }

        // Vérification si l'email est déjà utilisé
        const existingUser = await User.findOne({
          email: newEmail,
          id: { $ne: user.id }
        });

        if (existingUser) {
          return NextResponse.json(
            { success: false, message: 'Cet email est déjà utilisé' },
            { status: 400 }
          );
        }

        userToUpdate.email = newEmail;
        await userToUpdate.save();

        const newToken = createToken({
          id: userToUpdate.id,
          email: userToUpdate.email,
          role: userToUpdate.role,
          name: userToUpdate.name
        });

        return NextResponse.json({
          success: true,
          message: 'Email mis à jour avec succès',
          data: {
            id: userToUpdate.id,
            email: userToUpdate.email,
            name: userToUpdate.name,
            role: userToUpdate.role
          },
          token: newToken
        });
      }

      case 'updateProfile': {
        const { name, avatar } = data;
        const userToUpdate = await User.findOne({ id: user.id });
        
        if (!userToUpdate) {
          return NextResponse.json(
            { success: false, message: 'Utilisateur non trouvé' },
            { status: 404 }
          );
        }

        if (name) {
          userToUpdate.name = name;
        }

        if (avatar) {
          if (userToUpdate.avatar) {
            try {
              const oldAvatarPath = join(PUBLIC_DIR, userToUpdate.avatar);
              await unlink(oldAvatarPath);
            } catch (error) {
              console.error('Erreur lors de la suppression de l\'ancien avatar:', error);
            }
          }
          userToUpdate.avatar = avatar;
        }

        await userToUpdate.save();

        return NextResponse.json({
          success: true,
          message: 'Profil mis à jour avec succès',
          data: {
            id: userToUpdate.id,
            email: userToUpdate.email,
            name: userToUpdate.name,
            role: userToUpdate.role,
            avatar: userToUpdate.avatar
          }
        });
      }

      default:
        return NextResponse.json(
          { success: false, message: 'Action non reconnue' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Une erreur est survenue lors de la mise à jour' 
      },
      { status: 500 }
    );
  }
}
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const { userId } = await request.json();
    console.log('ID reçu pour suppression:', userId);
    
    const user = authenticateToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Rechercher d'abord l'utilisateur pour vérifier son existence
    const userExists = await User.findOne({ id: userId });
    console.log('Utilisateur trouvé:', userExists);

    if (!userExists) {
      // Si non trouvé avec id, essayer avec _id
      const userExistsById = await User.findById(userId);
      console.log('Utilisateur trouvé par _id:', userExistsById);

      if (!userExistsById) {
        return NextResponse.json(
          { success: false, message: 'Utilisateur non trouvé' },
          { status: 404 }
        );
      }

      await User.findByIdAndDelete(userId);
    } else {
      await User.findOneAndDelete({ id: userId });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Utilisateur supprimé avec succès' 
    });
  } catch (error: any) {
    console.error('Erreur détaillée:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}