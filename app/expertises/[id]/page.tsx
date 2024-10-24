// app/expertises/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  Icon,
  HStack,
  Button,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Divider,
  Flex,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { FaHome, FaBuilding, FaArrowLeft, FaDownload } from 'react-icons/fa';
import {
  MdPerson,
  MdHome,
  MdWindow,
  MdLocalFireDepartment,
  MdWaterDrop,
  MdWallet,
  MdElectricBolt,
  MdAir,
  MdSnowing,
  MdRoofing,
} from 'react-icons/md';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../lib/auth';
import { jsPDF } from "jspdf";

interface ExpertiseDetails {
  _id: string;
  buildingType: 'maison' | 'appartement';
  details: {
    beneficiary: {
      firstName: string;
      lastName: string;
      address: string;
      phone: string;
    };
    construction: {
      year: number;
      area: number;
      floors: number;
    };
    rooms: Array<{
      id: string;
      type: string;
      floor: number;
      windows: {
        count: number;
        type: string;
        installationYear: number;
      };
      heating: {
        types: string[];
        installationYear: number;
      };
      ventilation: string[];
      humidity: number;
    }>;
    facades: Array<{
      type: string;
      thickness: number;
      lastMaintenance: Date;
      condition: string;
    }>;
    electrical: {
      type: string;
      installationYear: number;
      hasLinky: boolean;
      upToStandards: boolean;
      condition: string;
    };
    insulation: {
      type: string;
      installation: string;
      thickness: number;
      hasCondensation: boolean;
      condensationLocations: string[];
      humidityRate: number;
      condition: string;
    };
    framework: {
      type: string;
      hasBeam: boolean;
      hadMaintenance: boolean;
      maintenanceDate: Date | null;
      condition: string;
    };
    roof: {
      type: string;
      ridgeType: string;
      maintenanceDate: Date;
      maintenanceType: string;
      hasImpurities: boolean;
      installationYear: number;
      condition: string;
    };
  };
  evaluations: {
    rooms: {
      [key: string]: {
        windows: number;
        heating: number;
        humidity: number;
        ventilation: number;
      };
    };
    global: {
      score: number;
      condition: 'Favorable' | 'Correct' | 'Critique';
      comment: string;
    };
  };
  createdAt: string;
  createdBy: string;
}

export default function ExpertiseDetails({ params }: { params: { id: string } }) {
  const [expertise, setExpertise] = useState<ExpertiseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const fetchExpertise = async () => {
      try {
        const response = await fetch(`/api/expertise/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des détails');
        }

        const data = await response.json();
        setExpertise(data.data);
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les détails de l\'expertise',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        router.push('/expertises');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchExpertise();
    }
  }, [params.id, router, toast]);

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Favorable':
        return 'green';
      case 'Correct':
        return 'yellow';
      case 'Critique':
        return 'red';
      case 'Bon':
        return 'green';
      case 'Moyen':
        return 'yellow';
      case 'Mauvais':
        return 'red';
      default:
        return 'gray';
    }
  };

  const downloadPDF = async () => {
    if (!expertise) return;

    try {
      const doc = new jsPDF();
      
      // En-tête
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 255);
      doc.text("Rapport d'expertise habitat", 20, 20);
      
      // Informations générales
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Informations générales", 20, 40);
      doc.setFontSize(12);
      doc.text(`Type de bâtiment: ${expertise.buildingType === 'maison' ? 'Maison' : 'Appartement'}`, 25, 50);
      doc.text(`Bénéficiaire: ${expertise.details.beneficiary.firstName} ${expertise.details.beneficiary.lastName}`, 25, 60);
      doc.text(`Adresse: ${expertise.details.beneficiary.address}`, 25, 70);

      // ... (ajout de toutes les autres informations pertinentes)

      const pdfBlob = doc.output('blob');
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expertise_${expertise._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Téléchargement réussi",
        description: "Le PDF a été téléchargé avec succès.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Erreur de téléchargement",
        description: "Une erreur est survenue lors du téléchargement du PDF.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex">
        <Sidebar />
        <Box flex="1" p={8} display="flex" justifyContent="center" alignItems="center">
          <Spinner size="xl" />
        </Box>
      </Box>
    );
  }

  if (!expertise) {
    return (
      <Box display="flex">
        <Sidebar />
        <Box flex="1" p={8}>
          <Text>Expertise non trouvée</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex">
      <Sidebar />
      <Box flex="1" p={8}>
        <VStack spacing={6} align="stretch">
          {/* En-tête */}
          <Flex justify="space-between" align="center">
            <Button
              leftIcon={<FaArrowLeft />}
              variant="ghost"
              onClick={() => router.push('/expertises')}
            >
              Retour à la liste
            </Button>
            <Button
              leftIcon={<FaDownload />}
              colorScheme="blue"
              onClick={downloadPDF}
            >
              Télécharger le rapport
            </Button>
          </Flex>

          {/* Informations principales */}
          <Card>
            <CardBody>
              <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                <VStack align="start">
                  <HStack>
                    <Icon
                      as={expertise.buildingType === 'maison' ? FaHome : FaBuilding}
                      w={6}
                      h={6}
                    />
                    <Heading size="md">
                      {expertise.buildingType === 'maison' ? 'Maison' : 'Appartement'}
                    </Heading>
                  </HStack>
                  <Text>{expertise.details.beneficiary.firstName} {expertise.details.beneficiary.lastName}</Text>
                  <Text fontSize="sm">{expertise.details.beneficiary.address}</Text>
                </VStack>

                <VStack align="center">
                  <Heading size="md">Score global</Heading>
                  <Badge
                    colorScheme={getConditionColor(expertise.evaluations.global.condition)}
                    p={2}
                    borderRadius="full"
                    fontSize="xl"
                  >
                    {expertise.evaluations.global.score.toFixed(1)}/5
                  </Badge>
                  <Text>{expertise.evaluations.global.condition}</Text>
                </VStack>

                <VStack align="end">
                  <Text>Date de création:</Text>
                  <Text>{new Date(expertise.createdAt).toLocaleDateString()}</Text>
                  {user?.role === 'admin' && (
                    <>
                      <Text>Créé par:</Text>
                      <Text>{expertise.createdBy}</Text>
                    </>
                  )}
                </VStack>
              </Grid>
            </CardBody>
          </Card>

          {/* Contenu principal en onglets */}
          <Tabs isFitted variant="enclosed">
            <TabList>
              <Tab><Icon as={MdPerson} mr={2} /> Informations générales</Tab>
              <Tab><Icon as={MdHome} mr={2} /> Configuration des pièces</Tab>
              <Tab><Icon as={MdWallet} mr={2} /> Caractéristiques techniques</Tab>
              <Tab><Icon as={MdSnowing} mr={2} /> Évaluations</Tab>
            </TabList>

            <TabPanels>
              {/* Onglet Informations générales */}
              <TabPanel>
                <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                  <Card>
                    <CardHeader>
                      <Heading size="md">Bénéficiaire</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        <Text><strong>Nom:</strong> {expertise.details.beneficiary.firstName} {expertise.details.beneficiary.lastName}</Text>
                        <Text><strong>Adresse:</strong> {expertise.details.beneficiary.address}</Text>
                        <Text><strong>Téléphone:</strong> {expertise.details.beneficiary.phone}</Text>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="md">Bâtiment</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        <Text><strong>Année de construction:</strong> {expertise.details.construction.year}</Text>
                        <Text><strong>Surface:</strong> {expertise.details.construction.area} m²</Text>
                        <Text><strong>Nombre d'étages:</strong> {expertise.details.construction.floors}</Text>
                      </VStack>
                    </CardBody>
                  </Card>
                </Grid>
              </TabPanel>

              {/* Onglet Configuration des pièces */}
              <TabPanel>
                <VStack spacing={4}>
                  {expertise.details.rooms.map((room) => (
                    <Card key={room.id} width="100%">
                      <CardHeader>
                        <Heading size="md">{room.type} {room.floor > 0 ? `(Étage ${room.floor})` : '(RDC)'}</Heading>
                      </CardHeader>
                      <CardBody>
                        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                          <VStack align="start">
                            <HStack>
                              <Icon as={MdWindow} />
                              <Text><strong>Fenêtres:</strong> {room.windows.count} ({room.windows.type})</Text>
                            </HStack>
                            {room.windows.count > 0 && (
                              <Text ml={6}>Installées en {room.windows.installationYear}</Text>
                            )}
                          </VStack>

                          <VStack align="start">
                            <HStack>
                              <Icon as={MdLocalFireDepartment} />
                              <Text><strong>Chauffage:</strong></Text>
                            </HStack>
                            {room.heating.types.map((type) => (
                              <Text key={type} ml={6}>{type}</Text>
                            ))}
                          </VStack>

                          <VStack align="start">
                            <HStack>
                              <Icon as={MdAir} />
                              <Text><strong>Ventilation:</strong></Text>
                            </HStack>
                            {room.ventilation.map((type) => (
                              <Text key={type} ml={6}>{type}</Text>
                            ))}
                          </VStack>

                          <VStack align="start">
                            <HStack>
                              <Icon as={MdWaterDrop} />
                              <Text><strong>Humidité:</strong> {room.humidity}%</Text>
                            </HStack>
                          </VStack>
                        </Grid>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </TabPanel>

              {/* Onglet Caractéristiques techniques */}
              <TabPanel>
                <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                  <Card>
                    <CardHeader>
                      <Heading size="md">Façades</Heading>
                    </CardHeader>
                    <CardBody>
                      {expertise.details.facades.map((facade, index) => (
                        <VStack key={index} align="start" spacing={3}>
                          <Text><strong>Type:</strong> {facade.type}</Text>
                          <Text><strong>Épaisseur:</strong> {facade.thickness} cm</Text>
                          <Text><strong>Dernier entretien:</strong> {new Date(facade.lastMaintenance).toLocaleDateString()}</Text>
                          <Badge colorScheme={getConditionColor(facade.condition)}>
                            État: {facade.condition}
                            </Badge>
                        </VStack>
                      ))}
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="md">Installation électrique</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        <Text><strong>Type:</strong> {expertise.details.electrical.type}</Text>
                        <Text><strong>Année d'installation:</strong> {expertise.details.electrical.installationYear}</Text>
                        <Text><strong>Compteur Linky:</strong> {expertise.details.electrical.hasLinky ? 'Oui' : 'Non'}</Text>
                        <Text><strong>Aux normes:</strong> {expertise.details.electrical.upToStandards ? 'Oui' : 'Non'}</Text>
                        <Badge colorScheme={getConditionColor(expertise.details.electrical.condition)}>
                          État: {expertise.details.electrical.condition}
                        </Badge>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="md">Isolation</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        <Text><strong>Type:</strong> {expertise.details.insulation.type}</Text>
                        <Text><strong>Installation:</strong> {expertise.details.insulation.installation}</Text>
                        <Text><strong>Épaisseur:</strong> {expertise.details.insulation.thickness} cm</Text>
                        <Text><strong>Condensation:</strong> {expertise.details.insulation.hasCondensation ? 'Présente' : 'Absente'}</Text>
                        {expertise.details.insulation.hasCondensation && (
                          <Text><strong>Localisation:</strong> {expertise.details.insulation.condensationLocations.join(', ')}</Text>
                        )}
                        <Text><strong>Taux d'humidité:</strong> {expertise.details.insulation.humidityRate}%</Text>
                        <Badge colorScheme={getConditionColor(expertise.details.insulation.condition)}>
                          État: {expertise.details.insulation.condition}
                        </Badge>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="md">Charpente</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        <Text><strong>Type:</strong> {expertise.details.framework.type}</Text>
                        <Text><strong>Poutre:</strong> {expertise.details.framework.hasBeam ? 'Présente' : 'Absente'}</Text>
                        <Text><strong>Entretien effectué:</strong> {expertise.details.framework.hadMaintenance ? 'Oui' : 'Non'}</Text>
                        {expertise.details.framework.maintenanceDate && (
                          <Text><strong>Date d'entretien:</strong> {new Date(expertise.details.framework.maintenanceDate).toLocaleDateString()}</Text>
                        )}
                        <Badge colorScheme={getConditionColor(expertise.details.framework.condition)}>
                          État: {expertise.details.framework.condition}
                        </Badge>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="md">Toiture</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        <Text><strong>Type:</strong> {expertise.details.roof.type}</Text>
                        <Text><strong>Type de faîtage:</strong> {expertise.details.roof.ridgeType}</Text>
                        <Text><strong>Date d'entretien:</strong> {new Date(expertise.details.roof.maintenanceDate).toLocaleDateString()}</Text>
                        <Text><strong>Type d'entretien:</strong> {expertise.details.roof.maintenanceType}</Text>
                        <Text><strong>Impuretés:</strong> {expertise.details.roof.hasImpurities ? 'Présentes' : 'Absentes'}</Text>
                        <Text><strong>Année d'installation:</strong> {expertise.details.roof.installationYear}</Text>
                        <Badge colorScheme={getConditionColor(expertise.details.roof.condition)}>
                          État: {expertise.details.roof.condition}
                        </Badge>
                      </VStack>
                    </CardBody>
                  </Card>
                </Grid>
              </TabPanel>

              {/* Onglet Évaluations */}
              <TabPanel>
                <VStack spacing={6}>
                  <Card width="100%">
                    <CardHeader>
                      <Heading size="md">Évaluation globale</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <HStack justify="space-between">
                          <Text fontSize="xl">Score global:</Text>
                          <Badge
                            colorScheme={getConditionColor(expertise.evaluations.global.condition)}
                            p={2}
                            borderRadius="full"
                            fontSize="xl"
                          >
                            {expertise.evaluations.global.score.toFixed(1)}/5
                          </Badge>
                        </HStack>
                        <Progress
                          value={expertise.evaluations.global.score * 20}
                          colorScheme={getConditionColor(expertise.evaluations.global.condition)}
                          size="lg"
                          borderRadius="full"
                        />
                        <Divider />
                        <Text fontSize="lg" fontWeight="bold">Recommandations:</Text>
                        <Text>{expertise.evaluations.global.comment}</Text>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Heading size="md">Évaluation par pièce</Heading>
                  {expertise.details.rooms.map((room) => {
                    const evaluation = expertise.evaluations.rooms[room.id];
                    return (
                      <Card key={room.id} width="100%">
                        <CardHeader>
                          <Heading size="sm">{room.type} {room.floor > 0 ? `(Étage ${room.floor})` : '(RDC)'}</Heading>
                        </CardHeader>
                        <CardBody>
                          <VStack spacing={4} align="stretch">
                            {room.windows.count > 0 && (
                              <Box>
                                <Text mb={2}>Ouvrants</Text>
                                <Progress
                                  value={evaluation.windows * 20}
                                  colorScheme={getConditionColor(
                                    evaluation.windows >= 4 ? 'Bon' : evaluation.windows >= 2.5 ? 'Moyen' : 'Mauvais'
                                  )}
                                  size="sm"
                                />
                              </Box>
                            )}
                            {room.heating.types.length > 0 && (
                              <Box>
                                <Text mb={2}>Chauffage</Text>
                                <Progress
                                  value={evaluation.heating * 20}
                                  colorScheme={getConditionColor(
                                    evaluation.heating >= 4 ? 'Bon' : evaluation.heating >= 2.5 ? 'Moyen' : 'Mauvais'
                                  )}
                                  size="sm"
                                />
                              </Box>
                            )}
                            <Box>
                              <Text mb={2}>Humidité</Text>
                              <Progress
                                value={evaluation.humidity * 20}
                                colorScheme={getConditionColor(
                                  evaluation.humidity >= 4 ? 'Bon' : evaluation.humidity >= 2.5 ? 'Moyen' : 'Mauvais'
                                )}
                                size="sm"
                              />
                            </Box>
                            {room.ventilation.length > 0 && (
                              <Box>
                                <Text mb={2}>Ventilation</Text>
                                <Progress
                                  value={evaluation.ventilation * 20}
                                  colorScheme={getConditionColor(
                                    evaluation.ventilation >= 4 ? 'Bon' : evaluation.ventilation >= 2.5 ? 'Moyen' : 'Mauvais'
                                  )}
                                  size="sm"
                                />
                              </Box>
                            )}
                          </VStack>
                        </CardBody>
                      </Card>
                    );
                  })}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Box>
    </Box>
  );
}