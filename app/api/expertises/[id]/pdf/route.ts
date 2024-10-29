import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Expertise from '../../../../../models/expertise';
import { logger } from '../../../../lib/logger';
import jwt from 'jsonwebtoken';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined');
}

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

const authenticateToken = (request: NextRequest) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return null;

    const token = authHeader.split(' ')[1];
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET as string) as JWTPayload;
    return decoded;
  } catch (error) {
    logger.error(`Erreur lors de la vérification du token: ${error}`);
    return null;
  }
};

// Fonction pour calculer le score final
const calculateFinalScore = (expertise: any): string => {
  // Si un score global existe déjà, l'utiliser
  if (expertise.evaluations?.global?.score) {
    return Number(expertise.evaluations.global.score).toFixed(1);
  }

  // Sinon, calculer à partir des évaluations des pièces
  const roomEvaluations = expertise.evaluations?.rooms || {};
  let totalScore = 0;
  let evaluationCount = 0;

  Object.values(roomEvaluations).forEach((room: any) => {
    if (typeof room.windows === 'number') { totalScore += room.windows; evaluationCount++; }
    if (typeof room.heating === 'number') { totalScore += room.heating; evaluationCount++; }
    if (typeof room.humidity === 'number') { totalScore += room.humidity; evaluationCount++; }
    if (typeof room.ventilation === 'number') { totalScore += room.ventilation; evaluationCount++; }
  });

  return evaluationCount > 0 ? (totalScore / evaluationCount).toFixed(1) : '0.0';
};

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    if (expertise.createdBy.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      );
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = margin;

    // En-tête
    doc.setFontSize(24);
    doc.setTextColor(44, 82, 130);
    doc.text("Rapport d'expertise", pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Informations générales
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, margin, yPosition);
    yPosition += 15;

    // Section Bénéficiaire
    doc.setFontSize(18);
    doc.setTextColor(44, 82, 130);
    doc.text("Informations du bénéficiaire", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Nom: ${expertise.beneficiaire?.nom || 'Non renseigné'}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Adresse: ${expertise.beneficiaire?.adresse || 'Non renseigné'}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Téléphone: ${expertise.beneficiaire?.telephone || 'Non renseigné'}`, margin, yPosition);
    yPosition += 15;

    // Section Logement
    doc.setFontSize(18);
    doc.setTextColor(44, 82, 130);
    doc.text("Détails du logement", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Type: ${expertise.typeLogement || 'Non renseigné'}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Année de construction: ${expertise.details?.anneeConstruction || 'Non renseigné'}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Superficie: ${expertise.details?.superficie ? expertise.details.superficie + ' m²' : 'Non renseigné'}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Nombre d'étages: ${expertise.details?.nombreEtages || 'Non renseigné'}`, margin, yPosition);
    yPosition += 20;

    // Nouvelle page pour l'évaluation
    doc.addPage();
    yPosition = margin;

    // Évaluation globale
    doc.setFontSize(24);
    doc.setTextColor(44, 82, 130);
    doc.text("Évaluation globale", margin, yPosition);
    yPosition += 25;

    // Calcul du score moyen et récupération des évaluations
    const roomEvaluations = expertise.evaluations?.rooms || {};
    let totalScore = 0;
    let evaluationCount = 0;

    Object.values(roomEvaluations).forEach(room => {
      if (room.windows) { totalScore += room.windows; evaluationCount++; }
      if (room.heating) { totalScore += room.heating; evaluationCount++; }
      if (room.humidity) { totalScore += room.humidity; evaluationCount++; }
      if (room.ventilation) { totalScore += room.ventilation; evaluationCount++; }
    });

    // Calcul du score final
    const finalScore = evaluationCount > 0 ? (totalScore / evaluationCount).toFixed(1) : 
                      expertise.evaluations?.global?.score?.toFixed(1) || '0.0';

    // Détermination de la condition basée sur le score
    let condition = expertise.evaluations?.global?.condition;
    if (!condition) {
      const score = parseFloat(finalScore);
      condition = score >= 4 ? 'Favorable' : 
                 score >= 2.5 ? 'Correct' : 'Critique';
    }

    // Score et État
    const scoreColor = condition === 'Favorable' 
      ? [46, 204, 113]  // vert
      : condition === 'Correct'
      ? [241, 196, 15]  // jaune
      : [231, 76, 60];  // rouge

    // Affichage du score
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.circle(50, yPosition - 5, 15, 'F');
    doc.setTextColor(255);
    doc.setFontSize(16);
    doc.text(finalScore.toString(), 43, yPosition);

    // État général
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text("État général:", 80, yPosition);
    
    // Badge pour la condition
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.roundedRect(150, yPosition - 15, 80, 20, 3, 3, 'F');
    doc.setTextColor(255);
    doc.text(condition, 155, yPosition);

    yPosition += 30;

    // Recommandations
    doc.setTextColor(44, 82, 130);
    doc.setFontSize(18);
    doc.text("Recommandations:", margin, yPosition);
    yPosition += 10;

    // Mise en forme des recommandations
    doc.setFontSize(12);
    doc.setTextColor(60);
    const maxWidth = pageWidth - (2 * margin);
    
    // Récupération du commentaire de l'évaluation globale
    const recommendations = expertise.evaluations?.global?.comment || (() => {
      // Si pas de commentaire, générer un commentaire basé sur le score
      const score = parseFloat(finalScore);
      if (score >= 4) {
        return "L'état général du bâtiment est très satisfaisant. Les installations sont bien entretenues et performantes.";
      } else if (score >= 2.5) {
        return "L'état général du bâtiment est correct mais nécessite quelques améliorations ciblées pour optimiser son confort et ses performances.";
      } else {
        return "L'état général du bâtiment nécessite des travaux de rénovation importants. Une intervention est recommandée pour améliorer le confort et l'efficacité énergétique.";
      }
    })();

    const splitRecommendations = doc.splitTextToSize(recommendations, maxWidth);

    // Fond pour les recommandations
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin - 5, yPosition - 5, maxWidth + 10, 
                   (splitRecommendations.length * 7) + 10, 2, 2, 'F');

    // Texte des recommandations
    doc.setTextColor(60);
    doc.text(splitRecommendations, margin, yPosition + 5);

    // Pied de page
    doc.setFontSize(10);
    doc.setTextColor(128);
    doc.text(
      `Document généré le ${new Date().toLocaleDateString('fr-FR')}`,
      margin,
      doc.internal.pageSize.height - 20
    );

    // Pagination sur toutes les pages
    const totalPages = doc.getNumberOfPages();
    for(let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(128);
      doc.text(
        `Page ${i} sur ${totalPages}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Convertir en buffer et retourner
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=expertise-${params.id}.pdf`
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