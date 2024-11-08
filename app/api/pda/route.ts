// app/api/pda/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {dbConnect } from '../../lib/mongodb';
import PDA from '../../../models/pda';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

const authenticateToken = (request: NextRequest) => {
  try {
    const authHeader = request.headers.get('Authorization');
    console.log('Headers reçus:', Object.fromEntries(request.headers.entries()));
    
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
    console.log('Token décodé avec succès:', decoded);
    return decoded;
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return null;
  }
};

export async function POST(request: NextRequest) {
  console.log('------------- Début de la requête POST PDA -------------');
  
  try {
    // Connexion à la base de données
    await dbConnect();
    console.log('Connexion MongoDB établie');

    // Vérification de l'authentification
    const user = authenticateToken(request);
    console.log('Utilisateur authentifié:', user);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }

    const data = await request.json();
    console.log('Données reçues du formulaire:', data);

    // Validation approfondie des données
    const validationErrors = [];
    if (!data.title) validationErrors.push('Le titre est requis');
    if (!data.details?.beneficiary?.name) validationErrors.push('Le nom du bénéficiaire est requis');
    if (!data.details?.beneficiary?.address) validationErrors.push('L\'adresse est requise');
    if (!data.details?.beneficiary?.phone) validationErrors.push('Le téléphone est requis');
    if (!data.details?.typeOfImprovement) validationErrors.push('Le type d\'amélioration est requis');
    if (!data.details?.fiscalIncome) validationErrors.push('Le revenu fiscal est requis');
    if (!data.details?.estimatedCost) validationErrors.push('Le coût estimé est requis');

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Données invalides', 
          errors: validationErrors 
        },
        { status: 400 }
      );
    }

    // Préparation des données pour la création du PDA
    const pdaData = {
      title: data.title,
      status: 'En cours',
      details: {
        beneficiary: {
          name: data.details.beneficiary.name,
          address: data.details.beneficiary.address,
          phone: data.details.beneficiary.phone
        },
        typeOfImprovement: data.details.typeOfImprovement,
        fiscalIncome: Number(data.details.fiscalIncome),
        estimatedCost: Number(data.details.estimatedCost),
        grantAmount: Number(data.details.grantAmount)
      },
      createdBy: user.id
    };

    console.log('Données PDA préparées:', pdaData);

    // Création et sauvegarde du PDA
    const newPDA = new PDA(pdaData);
    const savedPDA = await newPDA.save();
    console.log('PDA sauvegardé avec succès:', savedPDA);

    return NextResponse.json({
      success: true,
      message: 'Plan d\'aide créé avec succès',
      data: savedPDA
    });

  } catch (error: any) {
    console.error('Erreur détaillée lors de la création du PDA:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      details: error
    });
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erreur lors de la création du plan d\'aide',
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('------------- Début de la requête GET -------------');
  
  try {
    await dbConnect();

    const user = authenticateToken(request);
    console.log('Utilisateur authentifié pour GET:', user);

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

    console.log('Requête MongoDB:', query);

    const pdas = await PDA.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    console.log(`${pdas.length} PDAs trouvés`);

    return NextResponse.json({ 
      success: true, 
      data: pdas 
    });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des PDAs:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  console.log('------------- Début de la requête PUT -------------');
  
  try {
    await dbConnect();

    const user = authenticateToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    // Vérification que le PDA existe
    const existingPDA = await PDA.findById(id);
    if (!existingPDA) {
      return NextResponse.json(
        { success: false, message: 'PDA non trouvé' },
        { status: 404 }
      );
    }

    // Vérification des droits d'accès
    if (existingPDA.createdBy.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Non autorisé à modifier ce PDA' },
        { status: 403 }
      );
    }

    // Mise à jour du PDA
    const updatedPDA = await PDA.findByIdAndUpdate(
      id,
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

export async function DELETE(request: NextRequest) {
  console.log('------------- Début de la requête DELETE -------------');
  
  try {
    await dbConnect();

    const user = authenticateToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await request.json();
    
    // Vérification que le PDA existe
    const pda = await PDA.findById(id);
    if (!pda) {
      return NextResponse.json(
        { success: false, message: 'PDA non trouvé' },
        { status: 404 }
      );
    }

    // Vérification des droits d'accès
    if (pda.createdBy.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Non autorisé à supprimer ce PDA' },
        { status: 403 }
      );
    }

    await PDA.findByIdAndDelete(id);

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