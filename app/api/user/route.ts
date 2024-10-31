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
   const users = await User.find({}, 'id name email role');

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
 if (!user || user.role !== 'admin') {
   return NextResponse.json(
     { success: false, message: 'Non autorisé' },
     { status: 401 }
   );
 }

 try {
   await dbConnect();
   const { action, id, name, email, role, password } = await request.json();

   if (action !== 'updateUser') {
     return NextResponse.json(
       { success: false, message: 'Action non valide' },
       { status: 400 }
     );
   }

   const userToUpdate = await User.findOne({ id: id });
   if (!userToUpdate) {
     return NextResponse.json(
       { success: false, message: 'Utilisateur non trouvé' },
       { status: 404 }
     );
   }

   userToUpdate.name = name;
   userToUpdate.email = email;
   userToUpdate.role = role;

   if (password) {
     const salt = await bcrypt.genSalt(10);
     userToUpdate.password = await bcrypt.hash(password, salt);
   }

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

 } catch (error: any) {
   console.error('Erreur lors de la mise à jour:', error);
   return NextResponse.json(
     { success: false, message: error.message },
     { status: 500 }
   );
 }
}

export async function DELETE(request: NextRequest) {
 try {
   await dbConnect();
   const { userId } = await request.json();
   
   const user = authenticateToken(request);
   if (!user || user.role !== 'admin') {
     return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 401 });
   }

   const userToDelete = await User.findOne({ id: userId });
   if (!userToDelete) {
     return NextResponse.json({ success: false, message: 'Utilisateur non trouvé' }, { status: 404 });
   }

   await User.findOneAndDelete({ id: userId });

   return NextResponse.json({ success: true, message: 'Utilisateur supprimé avec succès' });
 } catch (error: any) {
   console.error('Erreur lors de la suppression:', error);
   return NextResponse.json({ success: false, message: error.message }, { status: 500 });
 }
}