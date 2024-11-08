import { NextRequest, NextResponse } from 'next/server';
import {dbConnect } from '../../lib/mongodb';
import Expertise from '../../../models/expertise';
import jwt from 'jsonwebtoken';
import { logger } from '../../lib/logger';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET;

// Interface pour le payload du token JWT
interface JWTPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

const authenticateToken = (request: NextRequest) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return null;

    const token = authHeader.split(' ')[1];
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as JWTPayload;

  } catch (error) {
    logger.error('Erreur lors de la vérification du token: ' + error);
    return null;
  }
};

// Route GET pour récupérer toutes les expertises
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = authenticateToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }

    let expertises;
    if (user.role === 'admin') {
      expertises = await Expertise.find();
    } else {
      expertises = await Expertise.find({ createdBy: user.id });
    }

    logger.success('Expertises récupérées avec succès');
    return NextResponse.json({ success: true, data: expertises });

  } catch (error: any) {
    logger.error('Erreur lors de la récupération des expertises: ' + error.message);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Route POST pour créer une nouvelle expertise
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const user = authenticateToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }

    const data = await request.json();
    data.createdBy = user.id;

    const expertise = await Expertise.create(data);

    logger.success('Expertise créée avec succès');
    return NextResponse.json({
      success: true,
      message: 'Expertise créée avec succès',
      data: expertise
    });

  } catch (error: any) {
    logger.error('Erreur lors de la création de l\'expertise: ' + error.message);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}