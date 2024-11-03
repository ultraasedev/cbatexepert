// /app/api/expertises/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Expertise from '../../../../models/expertise';
import { logger } from '../../../lib/logger';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET;

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

// GET - Récupérer une expertise
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const user = authenticateToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }

    const expertise = await Expertise.findById(params.id)
      .populate('createdBy', 'name email id');

    if (!expertise) {
      logger.error('Expertise non trouvée');
      return NextResponse.json(
        { success: false, message: 'Expertise non trouvée' },
        { status: 404 }
      );
    }

    // Vérification des permissions avec gestion des cas où createdBy n'existe pas
    if (expertise.createdBy && 
        typeof expertise.createdBy === 'object' && 
        expertise.createdBy.toString() !== user.id && 
        user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      );
    }

    logger.success('Expertise récupérée avec succès');
    return NextResponse.json({ success: true, data: expertise });

  } catch (error) {
    logger.error(`Erreur lors de la récupération de l'expertise: ${error}`);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une expertise
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const user = authenticateToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }

    const updateData = await request.json();
    const expertise = await Expertise.findById(params.id);

    if (!expertise) {
      logger.error('Expertise non trouvée');
      return NextResponse.json(
        { success: false, message: 'Expertise non trouvée' },
        { status: 404 }
      );
    }

    // Vérification des permissions
    if (expertise.createdBy && 
        typeof expertise.createdBy === 'object' && 
        expertise.createdBy.toString() !== user.id && 
        user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Non autorisé à modifier cette expertise' },
        { status: 403 }
      );
    }

    const updatedExpertise = await Expertise.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    logger.success('Expertise mise à jour avec succès');
    return NextResponse.json({
      success: true,
      message: 'Expertise mise à jour avec succès',
      data: updatedExpertise
    });

  } catch (error: any) {
    logger.error('Erreur lors de la mise à jour de l\'expertise: ' + error.message);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une expertise
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const user = authenticateToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }

    const expertise = await Expertise.findById(params.id);
    if (!expertise) {
      logger.error('Expertise non trouvée');
      return NextResponse.json(
        { success: false, message: 'Expertise non trouvée' },
        { status: 404 }
      );
    }

    // Vérification des permissions avec gestion des cas où createdBy n'existe pas
    if (expertise.createdBy && 
        typeof expertise.createdBy === 'object' && 
        expertise.createdBy.toString() !== user.id && 
        user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Non autorisé à supprimer cette expertise' },
        { status: 403 }
      );
    }

    await Expertise.findByIdAndDelete(params.id);
    logger.success('Expertise supprimée avec succès');

    return NextResponse.json({
      success: true,
      message: 'Expertise supprimée avec succès'
    });

  } catch (error: any) {
    logger.error('Erreur lors de la suppression de l\'expertise: ' + error.message);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}