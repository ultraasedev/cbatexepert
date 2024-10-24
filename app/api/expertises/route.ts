// app/api/expertise/route.ts

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../lib/mongodb';
import Expertise from '../../../models/expertise';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

const authenticateToken = (request: NextRequest) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.log('Pas d\'en-tête d\'autorisation');
      return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('Pas de token trouvé dans l\'en-tête');
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string; name: string };
    return decoded;
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return null;
  }
};

export async function POST(request: NextRequest) {
  console.log('------------- Début de la requête POST Expertise -------------');
  
  try {
    await connectDB();
    console.log('Connexion MongoDB établie');

    const user = authenticateToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }

    const data = await request.json();
    console.log('Données reçues:', data);

    // Ajout de l'identifiant de l'utilisateur qui crée l'expertise
    const expertiseData = {
      ...data,
      createdBy: user.id
    };

    const newExpertise = new Expertise(expertiseData);
    const savedExpertise = await newExpertise.save();

    console.log('Expertise sauvegardée avec succès:', savedExpertise);

    return NextResponse.json({
      success: true,
      message: 'Expertise créée avec succès',
      data: savedExpertise
    });

  } catch (error: any) {
    console.error('Erreur détaillée lors de la création de l\'expertise:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erreur lors de la création de l\'expertise',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('------------- Début de la requête GET Expertises -------------');
  
  try {
    await connectDB();

    const user = authenticateToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Construction de la requête selon le rôle
    let query = {};
    if (user.role !== 'admin') {
      query = { createdBy: user.id };
    }

    const expertises = await Expertise.find(query)
      .sort({ createdAt: -1 });

    console.log(`${expertises.length} expertises trouvées`);

    return NextResponse.json({ 
      success: true, 
      data: expertises 
    });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des expertises:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Route pour récupérer une expertise spécifique
export async function GET_ONE(request: NextRequest, { params }: { params: { id: string } }) {
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
      return NextResponse.json(
        { success: false, message: 'Expertise non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier les droits d'accès
    if (expertise.createdBy.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Non autorisé à voir cette expertise' },
        { status: 403 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: expertise 
    });

  } catch (error: any) {
    console.error('Erreur lors de la récupération de l\'expertise:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const user = authenticateToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Vérifier que l'expertise existe
    const expertise = await Expertise.findById(params.id);
    if (!expertise) {
      return NextResponse.json(
        { success: false, message: 'Expertise non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier les droits d'accès
    if (expertise.createdBy.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Non autorisé à modifier cette expertise' },
        { status: 403 }
      );
    }

    const updatedExpertise = await Expertise.findByIdAndUpdate(
      params.id,
      data,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Expertise mise à jour avec succès',
      data: updatedExpertise
    });

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de l\'expertise:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const user = authenticateToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Vérifier que l'expertise existe
    const expertise = await Expertise.findById(params.id);
    if (!expertise) {
      return NextResponse.json(
        { success: false, message: 'Expertise non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier les droits d'accès
    if (expertise.createdBy.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Non autorisé à supprimer cette expertise' },
        { status: 403 }
      );
    }

    await Expertise.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Expertise supprimée avec succès'
    });

  } catch (error: any) {
    console.error('Erreur lors de la suppression de l\'expertise:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}