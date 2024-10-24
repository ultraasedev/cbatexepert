// app/guser/userExpertises.tsx
'use client'

import { useState, useEffect } from 'react';
import { Box, Heading, List, ListItem, Text, VStack } from '@chakra-ui/react';
import { useParams } from 'next/navigation';

interface Expertise {
  _id: string;
  typeLogement: string;
  nomBeneficiaire: string;
  adresseBeneficiaire: string;
  telBeneficiaire: string;
  anneeConstruction: string;
  superficie: string;
  nombreEtages: string;
  nombreOuvertures: string;
  typeVitrage: string;
  etatOuvrants: string;
  anneeInstallationOuvrants: string;
  typeChauffage: string;
  nombreChauffages: string;
  etatChauffage: string;
  anneeInstallationChauffage: string;
  tauxHumidite: string;
  etatHumidite: string;
  typeFacade: string;
  epaisseurMurs: string;
  dernierEntretienFacade: string;
  etatFacade: string;
  typeTableau: string;
  anneePoseTableau: string;
  presenceLinky: string;
  tableauAuxNormes: string;
  etatTableau: string;
  typeVentilation: string;
  nombreBouches: string;
  piecesVentilation: string;
  ventilationNaturelle: string;
  anneePoseVentilation: string;
  etatVentilation: string;
  typeIsolation: string;
  poseIsolation: string;
  epaisseurIsolant: string;
  etatIsolation: string;
  presenceCondensation: string;
  localisationCondensation: string;
  tauxHumiditeCombles: string;
  etatCombles: string;
  typeCharpente: string;
  presenceArtive: string;
  entretienCharpente: string;
  dateEntretienCharpente: string;
  etatCharpente: string;
  typeToiture: string;
  typeFaitage: string;
  dateEntretienToiture: string;
  typeEntretienToiture: string;
  presenceImpuretes: string;
  anneeToiture: string;
  etatToiture: string;
  createdAt: string;
  status: string;
}

export default function UserExpertises() {
  const [expertises, setExpertises] = useState<Expertise[]>([]);
  const params = useParams();
  const userId = params.userId as string;

  useEffect(() => {
    if (userId) {
      fetchUserExpertises();
    }
  }, [userId]);

  const fetchUserExpertises = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/expertises`);
      if (response.ok) {
        const data = await response.json();
        setExpertises(data);
      } else {
        throw new Error('Erreur lors de la récupération des expertises');
      }
    } catch (error) {
      console.error('Erreur:', error instanceof Error ? error.message : 'Une erreur est survenue');
    }
  };

  return (
    <Box>
      <Heading as="h2" size="lg" mb={4}>Dernières expertises de l'utilisateur</Heading>
      <List spacing={3}>
        {expertises.map((expertise) => (
          <ListItem key={expertise._id} borderWidth={1} borderRadius="md" p={4}>
            <VStack align="start" spacing={2}>
              <Text><strong>Type de logement:</strong> {expertise.typeLogement}</Text>
              <Text><strong>Bénéficiaire:</strong> {expertise.nomBeneficiaire}</Text>
              <Text><strong>Adresse:</strong> {expertise.adresseBeneficiaire}</Text>
              <Text><strong>Année de construction:</strong> {expertise.anneeConstruction}</Text>
              <Text><strong>Superficie:</strong> {expertise.superficie} m²</Text>
              <Text><strong>Type de chauffage:</strong> {expertise.typeChauffage}</Text>
              <Text><strong>Type d'isolation:</strong> {expertise.typeIsolation}</Text>
              <Text><strong>Type de ventilation:</strong> {expertise.typeVentilation}</Text>
              <Text><strong>Type de toiture:</strong> {expertise.typeToiture}</Text>
              <Text><strong>État général:</strong> {expertise.etatToiture}</Text>
              <Text><strong>Date de création:</strong> {new Date(expertise.createdAt).toLocaleDateString()}</Text>
              <Text><strong>Statut:</strong> {expertise.status}</Text>
            </VStack>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}