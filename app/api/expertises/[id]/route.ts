import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Expertise from '../../../../models/expertise';
import { logger } from '../../../lib/logger';
import jwt from 'jsonwebtoken';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

// Fonction pour générer le PDF
async function generatePDF(request: NextRequest, expertiseId: string) {
  try {
    await connectDB();
    
    const user = authenticateToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }

    const expertise = await Expertise.findById(expertiseId)
      .populate('createdBy', 'name email id');

    if (!expertise) {
      logger.error('Expertise non trouvée pour la génération du PDF');
      return NextResponse.json(
        { success: false, message: 'Expertise non trouvée' },
        { status: 404 }
      );
    }

    // Vérification des permissions
    if (expertise.createdBy.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Non autorisé à accéder à cette expertise' },
        { status: 403 }
      );
    }

    // Créer un nouveau document PDF
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // En-tête
    doc.setFontSize(24);
    doc.text('Rapport d\'expertise', pageWidth/2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 20, 30);

    let yPos = 50;

    // Informations du bénéficiaire
    doc.setFontSize(16);
    doc.text('Informations du bénéficiaire', 20, yPos);
    doc.setFontSize(12);
    yPos += 10;
    doc.text([
      `Nom: ${expertise.beneficiaire.nom}`,
      `Adresse: ${expertise.beneficiaire.adresse}`,
      `Téléphone: ${expertise.beneficiaire.telephone}`
    ], 20, yPos);

    yPos += 25;

    // Détails du logement
    doc.setFontSize(16);
    doc.text('Détails du logement', 20, yPos);
    doc.setFontSize(12);
    yPos += 10;
    doc.text([
      `Type: ${expertise.typeLogement}`,
      `Année de construction: ${expertise.details.anneeConstruction}`,
      `Superficie: ${expertise.details.superficie} m²`,
      `Nombre d'étages: ${expertise.details.nombreEtages}`
    ], 20, yPos);

    yPos += 30;

    // Nouvelle page si nécessaire
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Évaluation globale
    if (expertise.evaluations?.global) {
      doc.setFontSize(16);
      doc.text('Évaluation globale', 20, yPos);
      doc.setFontSize(12);
      yPos += 10;

      const condition = expertise.evaluations.global.condition;
      const conditionColor = 
        condition === 'Favorable' ? [0, 255, 0] : 
        condition === 'Correct' ? [255, 255, 0] : 
        [255, 0, 0];
      
      doc.setFillColor(conditionColor[0], conditionColor[1], conditionColor[2]);
      doc.rect(20, yPos, 40, 8, 'F');
      doc.setTextColor(0);
      doc.text(condition, 25, yPos + 6);

      yPos += 15;
      doc.text([
        `Score global: ${expertise.evaluations.global.score}/5`,
        '',
        'Commentaire:',
        expertise.evaluations.global.comment
      ], 20, yPos);
    }

    // Pagination
    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Page ${i} / ${pageCount}`, pageWidth/2, 290, { align: 'center' });
    }

    // Convertir et retourner le PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=expertise-${expertiseId}.pdf`
      }
    });

  } catch (error) {
    logger.error(`Erreur lors de la génération du PDF: ${error}`);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    );
  }
}

// GET - Récupérer une expertise ou générer un PDF
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Récupérer le pathname de l'URL
  const pathname = request.nextUrl.pathname;
  logger.info('Récupération d\'une expertise spécifique');
  
  if (pathname.endsWith('/pdf')){
    return generatePDF(request, params.id);
  }

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

    // Vérification des permissions
    if (expertise.createdBy.toString() !== user.id && user.role !== 'admin') {
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

    if (expertise.createdBy.toString() !== user.id && user.role !== 'admin') {
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

    if (expertise.createdBy.toString() !== user.id && user.role !== 'admin') {
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