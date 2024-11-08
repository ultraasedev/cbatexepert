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
interface BaseIsolation {
  presence: boolean;
  type: "Ouate de cellulose" | "Laine de Roche" | "Laine de Verre" | "Isolation Minerales" | string;
  pose: "Sous rampants" | "En soufflage" | "En rouleau";
  epaisseur: number;
  etat: 'Bon' | 'Moyen' | 'Mauvais';
}

interface CombleIsolation extends BaseIsolation {
  presenceCondensation: boolean;
  zonesCondensation: string[];
  tauxHumidite: number;
  etatCombles: 'Bon' | 'Moyen' | 'Mauvais';
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
    types: ("Électrique" | "Gaz" | "Fioul" | "Bois" | "Poêle" | "Pac")[];
    nombreRadiateurs: number;
    localisations: string[];
    etat: 'Bon' | 'Moyen' | 'Mauvais';
    anneeInstallation: number;
  };
  humidite: {
    etat: 'Bon' | 'Moyen' | 'Mauvais';
    tauxParPiece: Record<string, 'Bon' | 'Moyen' | 'Mauvais'>;  // Mise à jour ici
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
    types: ("VMC Simple flux" | "Double Flux" | "VMI" | "VPH")[];
    localisations: string[];
    ventilationNaturelle: boolean;
    anneePose: number;
    etat: 'Bon' | 'Moyen' | 'Mauvais';
  };
  isolation: {
    combles: CombleIsolation;
    murs: BaseIsolation;
    sols?: BaseIsolation;
  };
  charpente: {
    type: 'Fermette' | 'Traditionnelle' | 'Metalique';
    presenceArtive: boolean;
    entretienEffectue: boolean;
    dateEntretien: string | null;
    etat: 'Bon' | 'Moyen' | 'Mauvais';
  };
  toiture: {
    type: "Ardoise Naturelle" | "Ardoise Fibrociment" | "Tuiles" | "Tuiles Béton" | "Acier";
    typeFaitage: 'Cimente' | 'En Boîte';
    dateEntretien: string | null; 
    typeEntretien: string;
    presenceImpuretes: boolean;
    annee: number;
    etat: 'Bon' | 'Moyen' | 'Mauvais';
  };
  impuretes: {
    condition: 'Bon' | 'Moyen' | 'Mauvais'; // À la place de etat pour correspondre à votre code
  };
  securiteIncendie: {
    bouleIncendie: boolean;
    extincteur: boolean;
    detecteurFumee: boolean;
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
    expertise.humidite.etat,  // changé de condition à etat
    expertise.facade.etat,
    expertise.tableauElectrique.etat,
    expertise.ventilation.etat,
    expertise.isolation.combles.etat,
    expertise.isolation.combles.etatCombles,
    expertise.charpente.etat,
    expertise.toiture.etat
  ];

  const totalScore = elements.reduce((sum, etat) => sum + calculateScore(etat), 0);
  return totalScore / elements.length;
};

const generateRecommendations = (expertise: IExpertise): string => {
  const recommendations: string[] = [];

  if (expertise.ouvertures.etat === 'Mauvais') {
    recommendations.push(`• Les ouvertures (${expertise.ouvertures.nombre} en ${expertise.ouvertures.typeVitrage}) nécessitent une rénovation complète\n  - Installation datant de ${expertise.ouvertures.anneeInstallation}`);
  }

  if (expertise.chauffage.etat === 'Mauvais') {
    recommendations.push(`• Le système de chauffage nécessite une intervention\n  - Type: ${expertise.chauffage.types.join(', ')}\n  - Installation datant de ${expertise.chauffage.anneeInstallation}\n  - ${expertise.chauffage.nombreRadiateurs} radiateurs installés`);
  }

  if (expertise.humidite.etat === 'Mauvais') {
    recommendations.push(`• Problème d'humidité important nécessitant une action corrective`);
  }

  // Isolation des combles
  if (expertise.isolation.combles.etat === 'Mauvais' || expertise.isolation.combles.etatCombles === 'Mauvais') {
    let isolationCombles = `• L'isolation des combles nécessite une amélioration\n`;
    if (expertise.isolation.combles.presence) {
      isolationCombles += `  - Type actuel: ${expertise.isolation.combles.type}\n`;
      isolationCombles += `  - Pose: ${expertise.isolation.combles.pose}\n`;
      isolationCombles += `  - Épaisseur: ${expertise.isolation.combles.epaisseur}cm\n`;
    } else {
      isolationCombles += `  - Absence d'isolation\n`;
    }
    if (expertise.isolation.combles.presenceCondensation) {
      isolationCombles += `  - Présence de condensation (${expertise.isolation.combles.tauxHumidite}% d'humidité)\n`;
      if (expertise.isolation.combles.zonesCondensation.length > 0) {
        isolationCombles += `  - Zones touchées: ${expertise.isolation.combles.zonesCondensation.join(', ')}\n`;
      }
    }
    recommendations.push(isolationCombles);
  }

  // Isolation des murs
  if (expertise.isolation.murs.etat === 'Mauvais') {
    let isolationMurs = `• L'isolation des murs nécessite une amélioration\n`;
    if (expertise.isolation.murs.presence) {
      isolationMurs += `  - Type actuel: ${expertise.isolation.murs.type}\n`;
      isolationMurs += `  - Pose: ${expertise.isolation.murs.pose}\n`;
      isolationMurs += `  - Épaisseur: ${expertise.isolation.murs.epaisseur}cm\n`;
    } else {
      isolationMurs += `  - Absence d'isolation murale\n`;
    }
    recommendations.push(isolationMurs);
  }

  // Isolation des sols
  if (expertise.isolation.sols?.etat === 'Mauvais') {
    let isolationSols = `• L'isolation des sols nécessite une amélioration\n`;
    if (expertise.isolation.sols.presence) {
      isolationSols += `  - Type actuel: ${expertise.isolation.sols.type}\n`;
      isolationSols += `  - Pose: ${expertise.isolation.sols.pose}\n`;
      isolationSols += `  - Épaisseur: ${expertise.isolation.sols.epaisseur}cm\n`;
    } else {
      isolationSols += `  - Absence d'isolation des sols\n`;
    }
    recommendations.push(isolationSols);
  }

  if (expertise.ventilation.etat === 'Mauvais') {
    let ventilationDetails = `• La ventilation nécessite une révision ou un remplacement\n`;
    ventilationDetails += `  - Types installés: ${expertise.ventilation.types.join(', ')}\n`;
    ventilationDetails += `  - Installation datant de ${expertise.ventilation.anneePose}\n`;
    if (expertise.ventilation.ventilationNaturelle) {
      ventilationDetails += `  - Présence de ventilation naturelle\n`;
    }
    recommendations.push(ventilationDetails);
  }

  if (!expertise.tableauElectrique.auxNormes || expertise.tableauElectrique.etat === 'Mauvais') {
    let electriciteDetails = `• L'installation électrique nécessite une mise aux normes\n`;
    electriciteDetails += `  - Type: ${expertise.tableauElectrique.type}\n`;
    electriciteDetails += `  - Installation datant de ${expertise.tableauElectrique.anneePose}\n`;
    if (!expertise.tableauElectrique.presenceLinky) {
      electriciteDetails += `  - Absence de compteur Linky\n`;
    }
    recommendations.push(electriciteDetails);
  }

  if (expertise.toiture.etat === 'Mauvais') {
    let toitureDetails = `• La toiture nécessite une rénovation\n`;
    toitureDetails += `  - Type: ${expertise.toiture.type}\n`;
    toitureDetails += `  - Faîtage: ${expertise.toiture.typeFaitage}\n`;
    toitureDetails += `  - Installation: ${expertise.toiture.annee}\n`;
    if (expertise.toiture.presenceImpuretes) {
      toitureDetails += `  - Présence d'impuretés nécessitant un nettoyage\n`;
    }
    recommendations.push(toitureDetails);
  }

  if (expertise.facade.etat === 'Mauvais') {
    let facadeDetails = `• La façade nécessite une rénovation\n`;
    facadeDetails += `  - Type: ${expertise.facade.type}\n`;
    facadeDetails += `  - Épaisseur des murs: ${expertise.facade.epaisseurMurs}cm\n`;
    const lastMaintenance = new Date(expertise.facade.dernierEntretien).toLocaleDateString('fr-FR');
    facadeDetails += `  - Dernier entretien: ${lastMaintenance}\n`;
    recommendations.push(facadeDetails);
  }

  if (expertise.charpente.etat === 'Mauvais') {
    let charpenteDetails = `• La charpente nécessite une intervention\n`;
    charpenteDetails += `  - Type: ${expertise.charpente.type}\n`;
    if (expertise.charpente.presenceArtive) {
      charpenteDetails += `  - Présence d'arêtier\n`;
    }
    if (!expertise.charpente.entretienEffectue) {
      charpenteDetails += `  - Aucun entretien effectué\n`;
    } else if (expertise.charpente.dateEntretien) {
      const maintenanceDate = new Date(expertise.charpente.dateEntretien).toLocaleDateString('fr-FR');
      charpenteDetails += `  - Dernier entretien: ${maintenanceDate}\n`;
    }
    recommendations.push(charpenteDetails);
  }

  // Sécurité incendie
  const securityMissing = [];
  if (!expertise.securiteIncendie.bouleIncendie) securityMissing.push('boule incendie');
  if (!expertise.securiteIncendie.extincteur) securityMissing.push('extincteur');
  if (!expertise.securiteIncendie.detecteurFumee) securityMissing.push('détecteur de fumée');
  
  if (securityMissing.length > 0) {
    recommendations.push(`• Sécurité incendie à améliorer\n  - Équipements manquants: ${securityMissing.join(', ')}`);
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

    const rawData = expertiseData.toObject() as any;

   // Fonction fléchée pour convertir taux en Bon/Moyen/Mauvais
   const convertTauxToEtat = (taux: number): 'Bon' | 'Moyen' | 'Mauvais' => {
    if (taux < 30) return 'Bon';
    if (taux < 60) return 'Moyen';
    return 'Mauvais';
};
// Conversion manuelle de `tauxParPiece` dans `humidite`
const tauxParPieceConverted = Object.fromEntries(
  Object.entries(rawData.humidite?.tauxParPiece || {}).map(([piece, taux]) => [
      piece,
      convertTauxToEtat(taux as number)  // Assurer que `taux` est interprété comme un nombre
  ])
);
    
    const expertise: IExpertise = {
      ...rawData,
      
      _id: (rawData._id as { toString(): string }).toString(),
      createdAt: rawData.createdAt instanceof Date
          ? rawData.createdAt.toISOString()
          : rawData.createdAt,
      createdBy: {
          toString: () => (rawData.createdBy?._id || rawData.createdBy?.id || rawData.createdBy).toString(),
          _id: rawData.createdBy?._id?.toString(),
          id: rawData.createdBy?.id?.toString()
      },
      humidite: {
        etat: rawData.humidite?.etat || 'Moyen',
        tauxParPiece: tauxParPieceConverted  // Utiliser la version convertie de `tauxParPiece`
    },

      isolation: {
          combles: {
              presence: rawData.isolation?.combles?.presence || false,
              type: rawData.isolation?.combles?.type || '',
              pose: rawData.isolation?.combles?.pose || 'En rouleau',
              epaisseur: rawData.isolation?.combles?.epaisseur || 0,
              etat: rawData.isolation?.combles?.etat || 'Moyen',
              presenceCondensation: rawData.isolation?.combles?.presenceCondensation || false,
              zonesCondensation: rawData.isolation?.combles?.zonesCondensation || [],
              tauxHumidite: rawData.isolation?.combles?.tauxHumidite || 0,
              etatCombles: rawData.isolation?.combles?.etatCombles || 'Moyen'
          },
          murs: {
              presence: rawData.isolation?.murs?.presence || false,
              type: rawData.isolation?.murs?.type || '',
              pose: rawData.isolation?.murs?.pose || 'En rouleau',
              epaisseur: rawData.isolation?.murs?.epaisseur || 0,
              etat: rawData.isolation?.murs?.etat || 'Moyen'
          },
          sols: rawData.isolation?.sols ? {
              presence: rawData.isolation.sols.presence || false,
              type: rawData.isolation.sols.type || '',
              pose: rawData.isolation.sols.pose || 'En rouleau',
              epaisseur: rawData.isolation.sols.epaisseur || 0,
              etat: rawData.isolation.sols.etat || 'Moyen'
          } : undefined
      },
      charpente: {
          type: rawData.charpente?.type || 'Fermette',
          presenceArtive: rawData.charpente?.presenceArtive || false,
          entretienEffectue: rawData.charpente?.entretienEffectue || false,
          dateEntretien: rawData.charpente?.dateEntretien 
              ? new Date(rawData.charpente.dateEntretien).toISOString().split('T')[0] 
              : null,
          etat: rawData.charpente?.etat || 'Moyen'
      },
      toiture: {
          type: rawData.toiture?.type || 'Ardoise Naturelle',
          typeFaitage: rawData.toiture?.typeFaitage || 'Cimente',
          dateEntretien: rawData.toiture?.dateEntretien 
              ? new Date(rawData.toiture.dateEntretien).toISOString().split('T')[0]
              : null,
          typeEntretien: rawData.toiture?.typeEntretien || '',
          presenceImpuretes: rawData.toiture?.presenceImpuretes || false,
          annee: rawData.toiture?.annee || new Date().getFullYear(),
          etat: rawData.toiture?.etat || 'Moyen'
      },
      facade: {
          type: rawData.facade?.type || 'Enduit',
          epaisseurMurs: rawData.facade?.epaisseurMurs || 0,
          dernierEntretien: rawData.facade?.dernierEntretien
          ? new Date(rawData.facade.dernierEntretien).getTime()
          : 0,
      
          etat: rawData.facade?.etat || 'Moyen'
      },
      tableauElectrique: {
          type: rawData.tableauElectrique?.type || 'Mono',
          anneePose: rawData.tableauElectrique?.anneePose || new Date().getFullYear(),
          presenceLinky: rawData.tableauElectrique?.presenceLinky || false,
          auxNormes: rawData.tableauElectrique?.auxNormes || false,
          etat: rawData.tableauElectrique?.etat || 'Moyen'
      },
      ventilation: {
          types: rawData.ventilation?.types || [],
          localisations: rawData.ventilation?.localisations || [],
          ventilationNaturelle: rawData.ventilation?.ventilationNaturelle || false,
          anneePose: rawData.ventilation?.anneePose || new Date().getFullYear(),
          etat: rawData.ventilation?.etat || 'Moyen'
      },
      securiteIncendie: {
        extincteur: rawData.securiteIncendie?.extincteur || false,
        detecteurFumee: rawData.securiteIncendie?.detecteurFumee || false,
        bouleIncendie: rawData.securiteIncendie?.bouleIncendie || false
    },
    impuretes: {
        condition: rawData.impuretes?.condition || 'Moyen'
    },
      evaluations: {
          rooms: rawData.evaluations?.rooms || {},
          global: {
              score: rawData.evaluations?.global?.score || 0,
              condition: rawData.evaluations?.global?.condition || 'Correct',
              comment: rawData.evaluations?.global?.comment || ''
          }
      },
      status: rawData.status || 'En cours'
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
        ['Chauffage', expertise.chauffage.etat, expertise.chauffage.types],
        ['Ventilation', expertise.ventilation.etat, expertise.ventilation.types],
        ['Isolation des combles', expertise.isolation.combles.etat, `${expertise.isolation.combles.type} - ${expertise.isolation.combles.pose}`],
  ['Isolation des murs', expertise.isolation.murs.etat, `${expertise.isolation.murs.type} - ${expertise.isolation.murs.pose}`],
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
      expertise.humidite.etat === 'Mauvais',  // Retiré la vérification du taux car la structure a changé
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