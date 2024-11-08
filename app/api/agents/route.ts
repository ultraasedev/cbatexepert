import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import {dbConnect} from '../../lib/mongodb'; 
import User from '../../../models/user';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

const authenticateToken = (request: NextRequest) => {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as { email: string; role: string };
  } catch (error) {
    console.error('Erreur de vérification du token:', error);
    return null;
  }
};

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = authenticateToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const agents = await User.find({ role: 'user' }).select('-password');

    return NextResponse.json(agents);
  } catch (error) {
    console.error('Erreur lors de la récupération des agents:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}