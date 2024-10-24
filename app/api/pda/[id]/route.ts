// app/api/pda/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import PDA from '../../../../models/pda';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

const authenticateToken = (request: NextRequest) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return null;

    const token = authHeader.split(' ')[1];
    if (!token) return null;

    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string; name: string };
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return null;
  }
};

// GET un PDA spécifique
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

    const pda = await PDA.findById(params.id);
    if (!pda) {
      return NextResponse.json(
        { success: false, message: 'PDA non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a le droit d'accéder à ce PDA
    if (pda.createdBy !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: pda });

  } catch (error: any) {
    console.error('Erreur lors de la récupération du PDA:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE un PDA
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

    const pda = await PDA.findById(params.id);
    if (!pda) {
      return NextResponse.json(
        { success: false, message: 'PDA non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a le droit de supprimer ce PDA
    if (pda.createdBy !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Non autorisé à supprimer ce PDA' },
        { status: 403 }
      );
    }

    await PDA.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'PDA supprimé avec succès'
    });

  } catch (error: any) {
    console.error('Erreur lors de la suppression du PDA:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT pour mettre à jour un PDA
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
    const pda = await PDA.findById(params.id);

    if (!pda) {
      return NextResponse.json(
        { success: false, message: 'PDA non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a le droit de modifier ce PDA
    if (pda.createdBy !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Non autorisé à modifier ce PDA' },
        { status: 403 }
      );
    }

    const updatedPDA = await PDA.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'PDA mis à jour avec succès',
      data: updatedPDA
    });

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du PDA:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}