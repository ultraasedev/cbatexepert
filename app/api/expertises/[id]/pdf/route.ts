// /app/api/expertises/[id]/pdf/route.ts

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Expertise from '../../../../../models/expertise';
import { logger } from '../../../../lib/logger';
import jwt from 'jsonwebtoken';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET;

// Interfaces
interface JWTPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}
     
interface RoomEvaluation {
  windows?: number;
  heating?: number;
  humidity?: number;
  ventilation?: number;
}

interface GlobalEvaluation {
  score: number;
  condition: 'Favorable' | 'Correct' | 'Critique';
  comment: string;
}

interface IExpertise {
  _id: string;
  typeLogement: 'appartement' | 'maison';
  beneficiaire: {
    nom: string;
    adresse: string;
    telephone: string;
  };
  details: {
    anneeConstruction: number;
    superficie: number;
    nombreEtages: number;
  };
  ouvertures: {
    nombre: number;
    typeVitrage: 'simple' | 'double';
    etat: 'Bon' | 'Moyen' | 'Mauvais';
    anneeInstallation: number;
  };
  chauffage: {
    type: 'Électrique' | 'Gaz' | 'Fioul' | 'Bois' | 'Poêle' | 'Pac';
    nombre: number;
    etat: 'Bon' | 'Moyen' | 'Mauvais';
    anneeInstallation: number;
  };
  humidite: {
    taux: number;
    etat: 'Bon' | 'Moyen' | 'Mauvais';
  };
  facade: {
    type: 'Enduit' | 'Peinture' | 'Pierre';
    epaisseurMurs: number;
    dernierEntretien: number;
    etat: 'Bon' | 'Moyen' | 'Mauvais';
  };
  tableauElectrique: {
    type: 'Mono' | 'Triphasé';
    anneePose: number;
    presenceLinky: boolean;
    auxNormes: boolean;
    etat: 'Bon' | 'Moyen' | 'Mauvais';
  };
  ventilation: {
    type: 'VMC Simple flux' | 'Double Flux' | 'VMI' | 'VPH';
    nombreBouches: number;
    piecesEquipees: string;
    ventilationNaturelle: boolean;
    anneePose: number;
    etat: 'Bon' | 'Moyen' | 'Mauvais';
  };
  isolation: {
    type: 'Ouate de cellulose' | 'Laine de Roche' | 'Laine de Verre' | 'Isolation Minerales';
    pose: 'Sous rampants' | 'En soufflage' | 'En rouleau';
    epaisseur: number;
    etat: 'Bon' | 'Moyen' | 'Mauvais';
    presenceCondensation: boolean;
    localisationCondensation?: string;
    tauxHumiditeCombles: number;
    etatCombles: 'Bon' | 'Moyen' | 'Mauvais';
  };
  charpente: {
    type: 'Fermette' | 'Traditionnelle' | 'Metalique';
    presenceArtive: boolean;
    entretienEffectue: boolean;
    dateEntretien?: Date;
    etat: 'Bon' | 'Moyen' | 'Mauvais';
  };
  toiture: {
    type: 'Ardoise Naturelle' | 'Ardoise Fibrociment' | 'Tuiles' | 'Tuiles Béton' | 'Acier';
    typeFaitage: 'Cimente' | 'En Boîte';
    dateEntretien: Date;
    typeEntretien: string;
    presenceImpuretes: boolean;
    annee: number;
    etat: 'Bon' | 'Moyen' | 'Mauvais';
  };
  evaluations: {
    rooms: {
      [key: string]: RoomEvaluation;
    };
    global: GlobalEvaluation;
  };
  createdBy: {
    toString(): string;
    _id?: string;
    id?: string;
  };
  status: 'En cours' | 'Terminé';
  createdAt: Date | string;
}

interface RawData extends Omit<IExpertise, '_id' | 'createdBy' | 'createdAt'> {
  _id: { toString(): string };
  createdBy: { 
    _id?: { toString(): string };
    id?: string;
    toString(): string;
  };
  createdAt: Date | string;
}

const authenticateToken = (request: NextRequest) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return null;

    const token = authHeader.split(' ')[1];
    if (!token) return null;

    return jwt.verify(token, JWT_SECRET!) as JWTPayload;
  } catch (error) {
    logger.error(`Erreur lors de la vérification du token: ${error}`);
    return null;
  }
};

const calculateScore = (etat: 'Bon' | 'Moyen' | 'Mauvais'): number => {
  switch (etat) {
    case 'Bon': return 5;
    case 'Moyen': return 3;
    case 'Mauvais': return 1;
    default: return 0;
  }
};

const calculateGlobalScore = (expertise: IExpertise): number => {
  const elements = [
    expertise.ouvertures.etat,
    expertise.chauffage.etat,
    expertise.humidite.etat,
    expertise.facade.etat,
    expertise.tableauElectrique.etat,
    expertise.ventilation.etat,
    expertise.isolation.etat,
    expertise.isolation.etatCombles,
    expertise.charpente.etat,
    expertise.toiture.etat
  ];

  const totalScore = elements.reduce((sum, etat) => sum + calculateScore(etat), 0);
  return totalScore / elements.length;
};
const generateRecommendations = (expertise: IExpertise): string => {
  const recommendations: string[] = [];

  if (expertise.ouvertures.etat === 'Mauvais') {
    recommendations.push(`• Les ouvertures (${expertise.ouvertures.nombre} en ${expertise.ouvertures.typeVitrage}) nécessitent une rénovation`);
  }

  if (expertise.chauffage.etat === 'Mauvais') {
    recommendations.push(`• Le système de chauffage ${expertise.chauffage.type} installé en ${expertise.chauffage.anneeInstallation} nécessite une intervention`);
  }

  if (expertise.humidite.etat === 'Mauvais') {
    recommendations.push(`• Problème d'humidité important (${expertise.humidite.taux}%) nécessitant une action corrective`);
  }

  if (expertise.isolation.etat === 'Mauvais' || expertise.isolation.etatCombles === 'Mauvais') {
    recommendations.push(`• L'isolation (${expertise.isolation.type}) nécessite une amélioration` +
      (expertise.isolation.presenceCondensation 
        ? `\n  - Présence de condensation dans les combles (${expertise.isolation.tauxHumiditeCombles}% d'humidité)` 
        : ''));
  }

  if (expertise.ventilation.etat === 'Mauvais') {
    recommendations.push(`• La ventilation ${expertise.ventilation.type} nécessite une révision ou un remplacement`);
  }

  if (!expertise.tableauElectrique.auxNormes || expertise.tableauElectrique.etat === 'Mauvais') {
    recommendations.push(`• L'installation électrique nécessite une mise aux normes`);
  }

  if (expertise.toiture.etat === 'Mauvais') {
    recommendations.push(`• La toiture (${expertise.toiture.type}) présente des signes de dégradation` +
      (expertise.toiture.presenceImpuretes ? '\n  - Présence d\'impuretés nécessitant un nettoyage' : ''));
  }

  if (expertise.facade.etat === 'Mauvais') {
    recommendations.push(`• La façade nécessite une rénovation (dernier entretien: ${expertise.facade.dernierEntretien})`);
  }

  if (expertise.charpente.etat === 'Mauvais') {
    recommendations.push(`• La charpente nécessite une intervention` +
      (!expertise.charpente.entretienEffectue ? '\n  - Aucun entretien effectué' : ''));
  }

  if (recommendations.length === 0) {
    return "Aucun problème majeur n'a été détecté. Un entretien régulier est recommandé pour maintenir l'état actuel du bâtiment.";
  }

  return `Points nécessitant une attention particulière:\n\n${recommendations.join('\n\n')}`;
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

    const expertiseData = await Expertise.findById(params.id)
      .populate('createdBy', 'name email id');

    if (!expertiseData) {
      return NextResponse.json(
        { success: false, message: 'Expertise non trouvée' },
        { status: 404 }
      );
    }

    const rawData = expertiseData.toObject() as RawData;
    
    const expertise: IExpertise = {
      ...rawData,
      _id: rawData._id.toString(),
      createdAt: rawData.createdAt instanceof Date 
        ? rawData.createdAt.toISOString() 
        : rawData.createdAt,
      createdBy: {
        toString: () => (rawData.createdBy?._id || rawData.createdBy?.id || rawData.createdBy).toString(),
        _id: rawData.createdBy?._id?.toString(),
        id: rawData.createdBy?.id?.toString()
      }
    };

    if (expertise.createdBy &&
        expertise.createdBy.toString() !== user.id &&
        user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Création du PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPosition = margin;

    const addNewPage = () => {
      doc.addPage();
      yPosition = margin;
    };

    const checkPageBreak = (height: number) => {
      if (yPosition + height > pageHeight - margin) {
        addNewPage();
        return true;
      }
      return false;
    };

    // En-tête
    doc.setFillColor(44, 82, 130);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255);
    doc.setFontSize(24);
    doc.text("RAPPORT D'EXPERTISE", pageWidth / 2, 25, { align: 'center' });
    doc.setFontSize(14);
    doc.text(expertise.typeLogement.toUpperCase(), pageWidth / 2, 35, { align: 'center' });
    yPosition = 50;

    // Référence et date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Référence : EXP-${params.id.slice(-6)}`, margin, yPosition);
    doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 20;

    // Informations bénéficiaire
    doc.setFillColor(240, 240, 240);
    doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * (margin - 5), 45, 'F');
    doc.setTextColor(44, 82, 130);
    doc.setFontSize(16);
    doc.text("INFORMATIONS BÉNÉFICIAIRE", margin, yPosition + 5);
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text([
      `Nom : ${expertise.beneficiaire.nom}`,
      `Adresse : ${expertise.beneficiaire.adresse}`,
      `Téléphone : ${expertise.beneficiaire.telephone}`
    ], margin + 5, yPosition + 20);
    yPosition += 55;

    // Caractéristiques du bien
    doc.setFillColor(240, 240, 240);
    doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * (margin - 5), 45, 'F');
    doc.setTextColor(44, 82, 130);
    doc.setFontSize(16);
    doc.text("CARACTÉRISTIQUES DU BIEN", margin, yPosition + 5);
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text([
      `Type : ${expertise.typeLogement}`,
      `Année de construction : ${expertise.details.anneeConstruction}`,
      `Superficie : ${expertise.details.superficie} m²`,
      `Nombre d'étages : ${expertise.details.nombreEtages}`
    ], margin + 5, yPosition + 20);
    yPosition += 55;

    // Évaluations techniques
    checkPageBreak(300);
    doc.setFillColor(240, 240, 240);

    // Tableau des évaluations
    doc.setTextColor(44, 82, 130);
    doc.setFontSize(16);
    doc.text("ÉVALUATIONS TECHNIQUES", margin, yPosition);
    yPosition += 15;

    // @ts-ignore
    doc.autoTable({
      startY: yPosition,
      head: [['Élément', 'État', 'Détails']],
      body: [
        ['Ouvertures', expertise.ouvertures.etat, `${expertise.ouvertures.nombre} ouvertures - ${expertise.ouvertures.typeVitrage}`],
        ['Chauffage', expertise.chauffage.etat, expertise.chauffage.type],
        ['Ventilation', expertise.ventilation.etat, expertise.ventilation.type],
        ['Isolation', expertise.isolation.etat, `${expertise.isolation.type} - ${expertise.isolation.pose}`],
        ['Toiture', expertise.toiture.etat, expertise.toiture.type],
        ['Installation électrique', expertise.tableauElectrique.etat, `${expertise.tableauElectrique.type}${expertise.tableauElectrique.auxNormes ? ' - Aux normes' : ' - Non conforme'}`]
      ],
      styles: { 
        fontSize: 10,
        cellPadding: 5
      },
      headStyles: {
        fillColor: [44, 82, 130],
        textColor: [255, 255, 255]
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      }
    });

    // @ts-ignore
    yPosition = doc.lastAutoTable.finalY + 20;

    // Évaluation globale
    checkPageBreak(150);
    const globalScore = calculateGlobalScore(expertise);
    const scoreColor = globalScore >= 4 ? [46, 204, 113] : 
                      globalScore >= 2.5 ? [241, 196, 15] : 
                      [231, 76, 60];

    doc.setTextColor(44, 82, 130);
    doc.setFontSize(18);
    doc.text("ÉVALUATION GLOBALE", margin, yPosition);
    yPosition += 20;

    // Score dans un cercle
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    // Score dans un cercle
    doc.circle(pageWidth / 2, yPosition + 15, 25, 'F');
    doc.setTextColor(255);
    doc.setFontSize(20);
    doc.text(globalScore.toFixed(1), pageWidth / 2, yPosition + 20, { align: 'center' });
    yPosition += 50;

    // État général
    const condition = globalScore >= 4 ? 'FAVORABLE' : 
                     globalScore >= 2.5 ? 'CORRECT' : 'CRITIQUE';

    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 30, 3, 3, 'F');
    doc.text(condition, pageWidth / 2, yPosition + 20, { align: 'center' });
    yPosition += 45;

    // Section recommandations
    checkPageBreak(200);
    doc.setTextColor(44, 82, 130);
    doc.setFontSize(16);
    doc.text("RECOMMANDATIONS", margin, yPosition);
    yPosition += 15;

    doc.setTextColor(0);
    doc.setFontSize(11);
    const recommendations = generateRecommendations(expertise);
    const splitRecommendations = doc.splitTextToSize(recommendations, pageWidth - 2 * margin);
    
    // Fond gris clair pour les recommandations
    doc.setFillColor(245, 245, 245);
    doc.rect(margin - 5, yPosition - 5, pageWidth - 2 * (margin - 5), 
             splitRecommendations.length * 7 + 10, 'F');
    
    doc.text(splitRecommendations, margin, yPosition);
    yPosition += splitRecommendations.length * 7 + 20;

    // Priorités d'intervention
    let priorityText = "";
    const urgentIssues = [
      expertise.toiture.etat === 'Mauvais',
      expertise.tableauElectrique.etat === 'Mauvais' && !expertise.tableauElectrique.auxNormes,
      expertise.humidite.etat === 'Mauvais' && expertise.humidite.taux > 70,
      expertise.charpente.etat === 'Mauvais'
    ].filter(Boolean).length;

    if (urgentIssues >= 2) {
      priorityText = "INTERVENTION PRIORITAIRE RECOMMANDÉE";
      doc.setFillColor(231, 76, 60);  // Rouge
    } else if (urgentIssues === 1) {
      priorityText = "INTERVENTION CONSEILLÉE À COURT TERME";
      doc.setFillColor(241, 196, 15);  // Jaune
    } else {
      priorityText = "ENTRETIEN RÉGULIER RECOMMANDÉ";
      doc.setFillColor(46, 204, 113);  // Vert
    }

    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 20, 3, 3, 'F');
    doc.setTextColor(255);
    doc.setFontSize(14);
    doc.text(priorityText, pageWidth / 2, yPosition + 13, { align: 'center' });

    // Pied de page sur toutes les pages
    const totalPages = doc.getNumberOfPages();
    for(let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFillColor(44, 82, 130);
      doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
      doc.setFontSize(8);
      doc.setTextColor(255);
      
      // Date de génération
      doc.text(
        `Document généré le ${new Date().toLocaleDateString('fr-FR')}`,
        margin,
        pageHeight - 8
      );
      
      // Numéro de page
      doc.text(
        `Page ${i} / ${totalPages}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: 'right' }
      );

      // Référence au centre
      doc.text(
        `Expertise ${params.id}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
    }

    // Générer et retourner le PDF
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